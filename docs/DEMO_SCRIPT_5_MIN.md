# careOS 5-Minute Demo Script

Use this script for recruiter screens, portfolio walkthroughs, and staff/principal-level architecture interviews. Keep the demo scoped to synthetic data only.

## 0:00-0:45 - Executive Setup

Say:

> careOS is a HIPAA-aware reference platform for governed clinical AI. The main idea is that clinical AI should not be prompt-to-model. Every request goes through deterministic routing, role and patient authorization, MCP context governance, human review when risk is present, and audit logging.

Show:

- README badges and executive summary.
- The clinical safety rule.
- The implemented-vs-planned matrix.

## 0:45-1:30 - Role Boundaries

Say:

> I built the demo around realistic hospital personas. A clinician, nurse, care coordinator, patient, admin, and compliance officer do not see the same context. Admins do not get blanket clinical PHI access by default.

Show:

- `http://localhost:3000/?demo=true`
- Role dropdown.
- README RBAC matrix.

Point out:

- Patient is scoped to own record.
- Clinician/care coordinator can access assigned or tenant-authorized patients.
- Admin/compliance views are de-identified or metadata-oriented by default.

## 1:30-2:20 - Governed RAG Chat

Demo action:

1. Select `clinician@hospital-a.demo`.
2. Ask: `Summarize the last 72 hours for pat_001 before rounds.`

Say:

> The response includes route metadata, confidence, citations, disclaimer language, and human-review flags. The important part is not just the answer. It is the control path: router, retrieval, MCP, model router, audit.

Show:

- Route and confidence badge.
- Citations.
- Disclaimer.
- Audit example in README or case study doc.

## 2:20-3:20 - Agentic Workflow With Human Review

Demo action:

1. Switch to `care_coordinator@hospital-a.demo`.
2. Open Agent Workflows.
3. Run `Deep Agent: Discharge Planning`.
4. Open Review Queue.

Say:

> This is where careOS moves beyond a chatbot. The discharge workflow gathers governed context, detects blockers, drafts a summary, and pauses when human review is needed. The workflow does not silently complete a safety-sensitive task.

Show:

- Workflow result.
- Review task ID.
- Review queue context snapshot.
- Approve/reject modal requiring notes.

## 3:20-4:10 - Patient Safety and Threat Model

Demo action:

1. Switch to `patient@hospital-a.demo`.
2. Ask: `Should I be worried about chest pain?`

Say:

> Safety language routes through triage. careOS should not diagnose or prescribe. It should escalate urgent language, explain limitations, and require clinical review.

Show:

- Safety-critical route.
- Human review flag.
- Threat model summary.
- MCP prompt-injection blocking test reference.

## 4:10-5:00 - Close With Senior Judgment

Say:

> The repo is intentionally honest about what is implemented and what remains. It includes the core governed architecture, tests, CI, Terraform reference modules, and PHI-safe demos. It does not claim formal HIPAA compliance, SOC 2, HITRUST, or production readiness without audit evidence.

Show:

- Implemented-vs-planned matrix.
- Gap-closure checklist.
- CI workflow badge.
- Screenshot inventory.

Close with:

> The product value is safer clinical acceleration: AI can summarize, retrieve, draft, flag, and route work, while humans remain accountable for clinical decisions.
