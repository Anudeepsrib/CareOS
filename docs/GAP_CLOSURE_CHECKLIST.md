# careOS Gap-Closure Checklist

Last updated: 2026-06-26

This checklist separates the recruiter-ready case-study closure from the remaining production work. It is intentionally evidence-based and avoids claiming formal audit status.

## Closed For Recruiter-Ready Case Study

- [x] Rewrote README into an executive case-study summary with CI/test badges.
- [x] Replaced broad HIPAA compliance claims with HIPAA-aware reference-control language.
- [x] Added implemented-vs-planned matrix with repository evidence.
- [x] Added architecture diagram source for the recruiter-facing story.
- [x] Added role/RBAC matrix covering patient, nurse, clinician, care coordinator, admin, compliance officer, and super admin.
- [x] Added synthetic PHI-safe demo workflow and 5-minute demo script.
- [x] Added audit log examples using fictional IDs and no real PHI.
- [x] Added threat model summary with controls, evidence, and remaining production work.
- [x] Added PHI-safe screenshot assets for portfolio/recruiter review.
- [x] Added CHANGELOG entry for the case-study hardening pass.
- [x] Fixed careOS branding drift in the main UI header.
- [x] Added a missing frontend API client used by demo auth.

## Evidence Already In Repository

- [x] Deterministic intent routing tests.
- [x] MCP governance tests for tenant blocking, patient-facing abnormal value review, role transformation, and prompt-injection blocking.
- [x] Review authorization tests showing admin cannot resolve clinical review tasks by default.
- [x] Auth hardening tests for demo-login disablement and production runtime configuration.
- [x] Deep Agent SDK/tool permission tests.
- [x] Memory governance and audit minimization tests.
- [x] GitHub Actions workflow for backend, frontend, Terraform, and security scanning.

## Remaining Before Real PHI Or Production Deployment

- [ ] Execute account-specific `terraform plan` and `terraform apply` in a governed AWS environment.
- [ ] Configure production Cognito pool, MFA, app client, custom claims, and end-to-end token tests.
- [ ] Validate Bedrock, Titan embeddings, and OpenSearch paths against live AWS resources.
- [ ] Complete formal HIPAA risk analysis and map administrative, physical, and technical safeguards to organization-specific evidence.
- [ ] Secure BAAs with AWS and any model/provider vendors.
- [ ] Run independent penetration testing, prompt-injection red teaming, retrieval poisoning tests, and model extraction tests.
- [ ] Complete clinical safety validation and patient-facing language review.
- [ ] Implement real EHR/FHIR integration with consent and provenance controls.
- [ ] Complete production document ingestion worker with malware scanning, extraction, chunking, embedding, and indexing evidence.
- [ ] Add immutable audit retention, SIEM integration, alerting runbooks, and incident response drills.
- [ ] Expand frontend beyond the consolidated demo into production-grade role-specific workspaces.
- [ ] Add accessibility, load, chaos, infrastructure, and browser end-to-end test suites.
- [ ] Enforce all CI scanner findings as blocking after vulnerability triage.

## Portfolio Positioning

Use this language:

> careOS is a HIPAA-aware governed clinical AI reference platform. It demonstrates technical controls and product workflows that would support a formal compliance program, but it does not claim certified HIPAA compliance without external audit evidence.

Avoid this language:

> careOS has certified HIPAA compliance.

> careOS is production-ready for real PHI.

> careOS is SOC 2 or HITRUST certified.
