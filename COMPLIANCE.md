# careOS Compliance Control Mapping

careOS is a **HIPAA-aware reference implementation**. It demonstrates technical controls that map to HIPAA Privacy and Security Rule concerns, but it is not certified as compliant with HIPAA and has not been through a formal audit in this repository.

## Reference Controls Implemented

| Control area | Reference implementation | Evidence |
| --- | --- | --- |
| Access control | RBAC, ABAC, tenant context, patient scope checks, Cognito/JWT path | `app/core/context.py`, `app/core/security.py`, `app/core/middleware.py` |
| Audit controls | Route, review, and governance events can be written to audit records | `app/services/audit/service.py`, `app/api/v1/audit.py` |
| Minimum necessary | Retrieval filters and MCP context governance reduce context before model calls | `app/services/rag/service.py`, `app/services/mcp/service.py` |
| Transmission security | TLS-ready app configuration and private AWS networking reference modules | `infra/terraform/modules/networking`, `infra/terraform/modules/api-gateway` |
| Encryption references | KMS, S3, RDS, OpenSearch, and Secrets Manager modules | `infra/terraform/modules/kms`, `infra/terraform/modules/s3`, `infra/terraform/modules/rds` |
| Person/entity authentication | Demo JWT locally; Cognito JWKS verification path for production mode | `app/api/v1/auth.py`, `app/core/security.py` |
| Emergency access | Break-glass fields exist in user context and are intended to be audited | `app/core/context.py` |
| Logging safeguards | Structured logging redacts common PHI/PII keys and patterns | `app/core/logging.py` |
| Human review | Safety-sensitive workflows create review tasks with role-filtered resolution | `app/api/v1/reviews.py` |

## Required Before Real PHI

1. Formal HIPAA risk analysis and organization-specific policies.
2. Signed BAAs with AWS and any model/provider vendors.
3. Clinical safety validation board sign-off.
4. Legal review of all patient-facing language.
5. Independent penetration testing and prompt-injection red teaming.
6. Live AWS deployment evidence, including Cognito MFA, KMS, CloudTrail, S3 audit retention, WAF, and SIEM integration.
7. EHR/FHIR integration review with consent, provenance, and data retention controls.
8. Incident response, breach notification, backup, disaster recovery, and access review procedures.
9. SOC 2/HITRUST roadmap execution if required by customers or employers.

## Approved Portfolio Language

Use:

> HIPAA-aware reference controls for governed clinical AI.

Avoid:

> Certified HIPAA compliance for a clinical AI platform.

## Philosophy

Trustworthy clinical AI needs governance in the architecture, not only in policy documents. careOS demonstrates that product pattern while keeping formal compliance claims tied to evidence that would need to be produced outside this local reference repo.
