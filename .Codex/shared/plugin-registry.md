# Approved Skills and Plugins

## last30days

- Type: Skill
- Source: https://github.com/mvanhorn/last30days-skill
- Approved: 2026-06-22
- Approved by: Alfred
- Version reviewed: 3.7.0
- License: MIT
- Community: Approximately 45,000 GitHub stars and 3,700 forks at review time
- Maintenance: Latest reviewed release published 2026-06-20
- Security: No published GitHub advisories; repository does not provide a formal SECURITY.md
- Dependencies: Python 3.12 or newer; no mandatory Python runtime packages declared
- Credential policy: Approved for keyless sources by default. Optional API keys and browser-session credentials must never be committed or printed in logs.
- Decision: Approved for current-design and trend research. Research output remains advisory and must be validated against primary sources before implementation.

## Open Generative AI / MuAPI

- Type: External asset-authoring toolkit
- Source: https://github.com/Anil-matcha/Open-Generative-AI
- Approved: 2026-06-24
- Approved by: Alfred
- Version reviewed: v2.0.0 and main at 8499ac1
- License: MIT
- Community: Approximately 20,600 GitHub stars and 3,500 forks at review time
- Maintenance: Repository pushed 2026-06-22; latest release v2.0.0 published 2026-05-23
- Security: `npm audit --omit=dev` reported 7 vulnerabilities in the reviewed lockfile, including 3 high-severity findings affecting Axios, form-data, and the repository's older Next.js dependency.
- Credential policy: MuAPI keys must remain in ignored environment files, must not be exposed to browser bundles, source control, generated metadata, screenshots, or logs.
- Data policy: Only approved project artwork may be uploaded. Do not upload credentials, private user data, Firebase exports, receipts, analytics data, or identifiable player information.
- Decision: Conditionally approved as an isolated offline asset-generation reference and workflow. Do not install its full application or dependencies into the Nobilix production repository. Use MuAPI through a minimal isolated generation script or sandbox, review every output manually, then import only optimized final assets into the website.
