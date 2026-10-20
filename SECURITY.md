# Security and Privacy

Single-user local tool, not a multi-tenant service. Keep it bound to 127.0.0.1.
Do not tunnel it publicly: exports and temporary uploads are served without auth.
Only one render runs at a time.

Audio stays in the browser until export, then goes to your loopback server.
Temporary uploads are removed on success/failure. A process crash may leave files
in `work/uploads/`; inspect/remove them locally when appropriate. Exports remain
in `outputs/`. Project JSON contains potentially private lyrics/timings/metadata.
Dependencies/browser downloads need internet. Coding agents have separate data
policies; app-local processing does not imply their providers never see shared files.

Never put sensitive recordings/logs/secrets in public issues. Report vulnerabilities
to the maintainer privately through their published contact details or the host's
private reporting feature when enabled. The public-file check is a guardrail,
not a comprehensive secret scanner or Git-history review. Review both before publishing.
