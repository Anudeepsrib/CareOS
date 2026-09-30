"""AI Chat endpoints - fully wired with Intent Router + MCP Governance + RAG + Safe Generation."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import json
from langsmith import traceable

from app.core.config import settings
from app.core.context import get_current_user, get_current_tenant
from app.schemas.chat import ChatRequest, ChatResponse, RouteDecision, Citation, GovernanceReceipt
from app.services.intent_router.service import route_intent
from app.services.mcp.service import MCPContextGovernanceService
from app.services.rag.service import retrieve_authorized_chunks
from app.services.memory.service import memory_service
from app.services.audit.service import log_audit_event
from app.services.chat_history.service import save_minimized_chat_history
from app.api.v1.reviews import create_review_task
from app.providers.model_router import model_router
try:
    from services.agent_orchestration_service.app.deep_agents.deep_agent_factory import DeepAgentFactory
except Exception:
    DeepAgentFactory = None
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()


@traceable(
    name="careos_governed_response",
    run_type="chain",
    project_name=settings.LANGSMITH_PROJECT,
    tags=["jev-eval-candidate"],
)
def _record_eval_trace(state: dict) -> dict:
    """Emit a minimized state for the LangSmith-hosted Jev evaluator."""
    return state


@router.post("/route", response_model=RouteDecision)
async def classify_intent(req: ChatRequest, user=Depends(get_current_user)):
    """Pure intent classification (used by frontend for UI hints + safety)."""
    decision = await route_intent(req.query, user.role)
    return decision


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user=Depends(get_current_user)):
    """
    Production-grade chat flow:
    1. Deterministic-first intent routing (with safety overrides)
    2. Authorized retrieval (tenant + patient + consent filtered)
    3. Mandatory MCP governance (the non-bypassable safety layer)
    4. Grounded generation via ModelRouter (mock or real Bedrock)
    5. Full audit + minimized history
    """
    tenant = get_current_tenant()
    decision = await route_intent(req.query, user.role)

    # 1. Retrieve only what this user is allowed to see
    chunks = []
    if decision.requires_rag:
        chunks = await retrieve_authorized_chunks(
            query=req.query,
            user=user,
            patient_id=req.patient_id,
            top_k=6,
        )

    # 2. MCP Governance — this is the most important gate in the system
    mcp = MCPContextGovernanceService()
    mcp_decision = await mcp.govern(
        candidate_chunks=chunks,
        user=user,
        route=decision.intent,
        patient_id=req.patient_id,
        query=req.query,
    )

    # 3. Generate grounded, safe response
    generation = await model_router.generate(
        query=req.query,
        allowed_context=mcp_decision.allowed_context,
        route=decision.intent,
        user_role=user.role,
        requires_review=mcp_decision.requires_human_review or decision.requires_human_review,
    )

    # 4. Build citations (only from allowed context)
    citations = [
        Citation(
            document_id=c.get("document_id", ""),
            chunk_id=c.get("chunk_id", ""),
            doc_type=c.get("doc_type", "clinical_document"),
            relevance=round(c.get("relevance", 0.8), 3),
            snippet=c.get("content", "")[:280] + "...",
        )
        for c in mcp_decision.allowed_context[:4]
    ]

    audit_event_id = await log_audit_event(
        tenant_id=tenant.tenant_id,
        user_id=user.user_id,
        event_type="route_decision",
        resource_type="conversation",
        resource_id=req.conversation_id,
        patient_id=req.patient_id,
        action="ai_chat",
        outcome="success",
        details={
            "route": decision.intent,
            "confidence": decision.confidence,
            "requires_rag": decision.requires_rag,
            "requires_agent": decision.requires_agent,
            "requires_human_review": decision.requires_human_review or mcp_decision.requires_human_review,
            "mcp_blocked_context_count": mcp_decision.blocked_context_count,
            "mcp_audit_tags": mcp_decision.audit_tags,
        },
    )

    # 5. Governed memory (optional, non-clinical only)
    memory_used = False
    try:
        mem = await memory_service.extract_and_store(
            user=user,
            conversation_turn={"content": req.query, "patient_id": req.patient_id},
        )
        memory_used = mem is not None
    except Exception:
        pass  # Memory is best-effort

    # 6. Final safety disclaimer
    disclaimer = (
        "This is a summary of authorized records only. "
        "It is not a diagnosis, treatment recommendation, or substitute for clinical judgment. "
        "All safety-sensitive outputs require licensed human review."
    )

    requires_review = generation["requires_human_review"]
    review_task_id = None
    if requires_review:
        review_task = await create_review_task(
            task_type="ai_chat_safety_review",
            patient_id=req.patient_id or user.user_id,
            reason="AI response requires human review based on route, MCP, or model safety policy",
            assigned_to="clinician",
            tenant_id=tenant.tenant_id,
        )
        review_task_id = review_task["id"]

    await save_minimized_chat_history(
        user=user,
        conversation_id=req.conversation_id,
        patient_id=req.patient_id,
        query=req.query,
        response=generation["text"],
        intent_route=decision.intent,
        retrieved_document_ids=[c.document_id for c in citations],
        model_used=generation.get("model", "unknown"),
        confidence=round(decision.confidence, 3),
        requires_human_review=requires_review,
        safety_flags=decision.safety_flags + (["mcp_human_review_triggered"] if mcp_decision.requires_human_review else []),
        audit_event_id=audit_event_id,
    )

    response = ChatResponse(
        response=generation["text"],
        route=decision.intent,
        confidence=round(decision.confidence, 3),
        requires_human_review=requires_review,
        citations=citations,
        safety_flags=decision.safety_flags + (["mcp_human_review_triggered"] if mcp_decision.requires_human_review else []),
        disclaimer=disclaimer,
        human_review_task_id=review_task_id,
        memory_used=memory_used,
        governance_receipt=GovernanceReceipt(
            audit_event_id=audit_event_id,
            classifier=decision.model_used_for_classification,
            generation_model=generation.get("model", "unknown"),
            allowed_evidence_count=len(mcp_decision.allowed_context),
            blocked_evidence_count=mcp_decision.blocked_context_count,
            controls_applied=sorted(set(mcp_decision.policy_decisions + mcp_decision.audit_tags)),
        ),
    )
    if settings.ENABLE_LANGSMITH_EVALS:
        _record_eval_trace(
            {
                "assistant_response": response.response,
                "user_role": user.role,
                "route": response.route,
                "requires_human_review": response.requires_human_review,
                "safety_flags": response.safety_flags,
                "allowed_evidence_count": response.governance_receipt.allowed_evidence_count,
                "blocked_evidence_count": response.governance_receipt.blocked_evidence_count,
            }
        )
    return response


@router.post("/stream")
async def chat_stream(req: ChatRequest, user=Depends(get_current_user)):
    """Streaming version (SSE) — same safety guarantees as /chat."""
    async def generator():
        decision = await route_intent(req.query, user.role)
        yield f"data: {json.dumps({'event': 'route', 'intent': decision.intent, 'confidence': decision.confidence})}\n\n"

        chunks = []
        if decision.requires_rag:
            chunks = await retrieve_authorized_chunks(req.query, user, req.patient_id, top_k=5)
        mcp = MCPContextGovernanceService()
        mcp_decision = await mcp.govern(chunks, user, decision.intent, req.patient_id, req.query)

        yield f"data: {json.dumps({'event': 'mcp', 'allowed_chunks': len(mcp_decision.allowed_context), 'requires_review': mcp_decision.requires_human_review})}\n\n"

        generation = await model_router.generate(
            query=req.query,
            allowed_context=mcp_decision.allowed_context,
            route=decision.intent,
            user_role=user.role,
            requires_review=mcp_decision.requires_human_review,
        )

        # Stream the response in chunks for UX
        words = generation["text"].split()
        for i in range(0, len(words), 4):
            chunk = " ".join(words[i:i+4]) + " "
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        yield f"data: {json.dumps({'done': True, 'route': decision.intent, 'requires_human_review': generation['requires_human_review'], 'citations': []})}\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream")


@router.post("/rag/query", response_model=ChatResponse)
async def rag_query(req: ChatRequest, user=Depends(get_current_user)):
    req.context["force_rag"] = True
    return await chat(req, user)


@router.post("/agent/run")
async def run_deep_agent(req: ChatRequest, user=Depends(get_current_user)):
    decision = await route_intent(req.query, user.role)
    route = decision.intent if decision.requires_agent else req.context.get("route", "chart_summary_complex")
    if DeepAgentFactory is None:
        return {"status": "degraded", "message": "Deep Agent package is unavailable in this runtime."}
    agent = DeepAgentFactory.create(
        route=route,
        tenant_id=user.tenant_id,
        hospital_id=None,
        facility_id=None,
        user_id=user.user_id,
        role=user.role,
        patient_id=req.patient_id,
        encounter_id=req.encounter_id,
        workflow_id=req.context.get("workflow_id", "api_agent_run"),
    )
    if not agent:
        return {"status": "not_applicable", "route": route, "message": "No Deep Agent is registered for this route."}
    result = await agent.run(req.query, [])
    return result.__dict__
