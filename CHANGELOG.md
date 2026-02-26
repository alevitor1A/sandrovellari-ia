# Changelog

## 2026-02-25 — Deploy & finalize
- Added `Permitir executar ações` checkbox to the Assistente Web UI (`app.html`).
- Web UI now sends `conversationOnly` and only executes returned `action` when the user allows it.
- `sendAssistant()` updated to handle structured responses { message, action }.
- Added local test script `test_api.js` and verified server responses for conversation-only and execution modes.
- Deployed site to Vercel: https://sandrovellari-ia.vercel.app

Notes:
- The project supports a free demo fallback and a Vercel serverless endpoint. No paid APIs are required to run the demo.
