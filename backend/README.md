# Sandrovellari IA backend

This small backend exposes `/chat` and supports two modes: `conversa` and `execucao`.

Quick start (Node 18+):

```bash
cd backend
npm install
npm start
```

If you provide `GROQ_KEY` (or `GROQ_API_KEY`) in `.env`, the server will proxy requests to Groq/OpenAI-style endpoint. If no key is present, a demo fallback will handle common commands and return structured `action` when appropriate.
