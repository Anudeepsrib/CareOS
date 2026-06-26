# careOS Screenshot Inventory

These screenshots are PHI-safe visual snapshots for recruiter and portfolio use. They use synthetic identifiers and representative UI states only.

| Asset | Purpose |
| --- | --- |
| [careos-chat-governance.svg](careos-chat-governance.svg) | Shows governed chat, route metadata, citations, disclaimer, and human-review signal. |
| [careos-workflow-review.svg](careos-workflow-review.svg) | Shows agent workflow execution paired with the human review queue. |

## Regenerating Live Captures

1. Start the local stack with `docker compose up --build`.
2. Open `http://localhost:3000/?demo=true`.
3. Use only demo users and synthetic patient IDs.
4. Capture browser screenshots of:
   - RAG Chat after a governed response.
   - Agent Workflows after discharge planning.
   - Review Queue after a task is created.
5. Confirm the screenshot contains no real PHI, real credentials, real MRNs, or live customer names before sharing.
