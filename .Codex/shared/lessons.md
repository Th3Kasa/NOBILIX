# Alfred lessons

No active unapplied lessons existed before this task.

## 2026-06-26 — Minor — Final audit needs separate severity interpretation

- Observation: `npm audit --omit=dev` can return nonzero for moderate transitive advisories where the suggested fix is a breaking or downgrading dependency path.
- Impact: Final verification needs both the raw audit output and a severity/risk interpretation instead of treating every nonzero audit as automatically fixable inside an unrelated UI redesign.
- Fix applied: Performance log now records the audit findings and why forced fixes were not applied in this branch.
- Fix applied date: 2026-06-26.
