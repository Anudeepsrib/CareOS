# careOS Architecture (Interview-Ready)

This document explains the key architectural decisions that make careOS a production-oriented, defensible clinical AI reference platform rather than a loose prototype.

## 1. Why Deterministic Intent Routing Before Any Agent?

**Problem**: Using an LLM or agent as the primary router creates non-determinism, audit nightmares, and safety risk. A misrouted chest pain query could bypass safety triage.

**Solution**:
- Layer 1: Fast deterministic rules (regex, RapidFuzz, safety lexicon, role context)
- Layer 2: Structured LLM fallback (Claude Haiku via Bedrock with Pydantic output)
- Layer 3: Policy overrides (emergency symptoms → `clinical_safety_triage` regardless of confidence)

**Benefits**:
- Every routing decision is fully auditable with explicit `reason`
- Safety overrides are impossible to bypass
- Low latency for the common case
- Easy to unit test 100% of routing logic

## 2. The MCP Governance Layer (The Most Important Innovation)

RAG retrieves. **MCP decides what reaches the LLM**.

Every single LLM call in the system (including `simple_llm` for "what is an MRI?") passes through `MCPContextGovernanceService.govern()`.

MCP responsibilities:
- Tenant + patient ABAC enforcement
- Consent scope validation
- Role-based transformation (patient-friendly vs clinician full context)
- PHI minimization / redaction
- Abnormal value detection → force human review
- Injection of required disclaimers
- Audit tagging

This is the mechanism that makes the platform defensible to compliance officers and CISOs.

## 3. How Hallucinations Are Systematically Reduced

1. Authorization before any retrieval
2. Metadata-aware hybrid retrieval (pgvector/OpenSearch + filters)
3. MCP filtering (only authorized chunks reach the prompt)
4. Strict grounding instructions + citation enforcement in every prompt
5. Structured Pydantic output validation
6. Answerability check before returning content
7. Safe fallback language when evidence is insufficient

## 4. RBAC + ABAC + Minimum Necessary (Real Implementation)

- `UserContext` carries ABAC attributes (assigned patients, facilities, break-glass status)
- `can_access_patient()` is called on every patient-scoped operation
- Middleware + MCP both enforce the rule
- Admin and compliance_officer roles do **not** get blanket clinical access by default

## 5. Human-in-the-Loop as a First-Class State Machine

Workflows that matter (`discharge_planning`, `prior_authorization`, any medium/high risk) create a `HumanReviewTask`.

The workflow literally cannot complete until the task reaches `approved` or `rejected`.
This is backed by a PostgreSQL database in production, ensuring that review tasks are persistent, strongly consistent, and isolated by tenant ID. Role-based access ensures that only clinicians can review clinical tasks, while compliance officers can audit all tasks.

This is not a UI banner — it is a hard gate in the orchestration layer.

## 6. Memory vs RAG (Critical Distinction)

- **RAG** = source of truth, versioned documents, citations required
- **Memory** = non-authoritative, governed, user preference / workflow continuity only

Memory goes through the exact same governance pipeline as everything else. It is never used for clinical facts.

## 7. LangGraph vs Deep Agents

All agentic work uses LangGraph state machines.

Deep Agent (planner + researcher + writer sub-agents) patterns are used **only** inside the most complex workflows (Discharge Planning) where true hierarchical planning adds value.

The primary router is never an agent.

## 8. Local vs Production Abstractions

Every external dependency has a clean interface:
- `ModelRouter` / `EmbeddingProvider`
- `VectorStore` (PgVector local → OpenSearch prod)
- Auth provider

This allows a 5-minute `docker compose up` experience while preserving an identical path to real AWS Bedrock + OpenSearch + Cognito.

## 9. Audit and Observability

Every PHI touch, route decision, MCP decision, LLM call, and human review action produces an immutable `audit_event`.

Chat history stores only references + minimized metadata. Raw clinical text lives in governed RAG chunks.

**Tracing & Logging**: The API is instrumented with **OpenTelemetry** for end-to-end distributed tracing. Logs are structured (JSON) and routed to AWS CloudWatch Log Groups. AWS CloudTrail is configured via Terraform to track all control plane and S3 data events for compliance audits.

## 10. Frontend Enterprise Auth

The Next.js frontend uses a unified authentication strategy via **NextAuth.js**.
- **Production**: Configured with an AWS Cognito OAuth 2.0 PKCE provider to map Hospital SSO identities into the app. Custom claims (`custom:role`, `custom:tenant_id`) are injected into the session.
- **Local Dev**: A seamless fallback to local mock users for rapid development.

## 10. Why This Architecture Is Production-Oriented

- Core safety rules are enforced in code, not just documented
- No path exists to bypass MCP or authorization
- The intent router is one of the most heavily tested components
- Terraform modules are written for real multi-AZ, encrypted, private deployments
- CI includes security scanning and IaC validation
- Clear separation between reference implementation and items requiring legal/compliance sign-off

This is the kind of system a serious health system innovation team or health tech company would review in an architecture board or use as the starting point for a real program.
