import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

import { detectMode } from '../ai-core/modes.js';
import { buildSystemPrompt } from '../ai-core/personality.js';

dotenv.config();

const app = express();
app.use(express.json());

// CORS for simple testing from hosting
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST,GET');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function demoReply(message, mode) {
  // lightweight demo fallback similar to existing api handler
  const t = (message || '').toLowerCase();
  if (/whatsapp/.test(t)) {
    const encoded = encodeURIComponent(message.replace(/.*whatsapp/i, '').trim() || 'Olá');
    const url = `https://wa.me/?text=${encoded}`;
    const code = `window.open(${JSON.stringify(url)}, '_blank');`;
    if (mode === 'execucao') return { reply: 'Posso abrir o WhatsApp para você. Quer que eu execute?', action: { type: 'open', url, code } };
    return { reply: 'Consigo abrir o WhatsApp e preparar a mensagem, mas estou em modo conversa apenas. Quer que eu faça?', action: null };
  }
  if (/copiar|copie/.test(t)) {
    const code = `navigator.clipboard.writeText(${JSON.stringify(message)})`;
    if (mode === 'execucao') return { reply: 'Vou copiar para o clipboard. Deseja que eu prossiga?', action: { type: 'eval', code } };
    return { reply: 'Posso copiar esse texto para você, mas estou no modo conversa apenas.', action: null };
  }
  // generic fallback
  return { reply: `Recebi: "${message}". Posso transformar isso em ação ou responder normalmente.`, action: null };
}

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message || '';

    const mode = detectMode(userMessage); // 'conversa' or 'execucao'
    const systemPrompt = buildSystemPrompt(mode);

    // If GROQ key is provided, proxy to Groq/OpenAI-style API
    const GROQ_KEY = process.env.GROQ_KEY || process.env.GROQ_API_KEY;
    if (GROQ_KEY) {
      // Best-effort proxy; user must set env key
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama3-70b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });
      const data = await response.json();
      // Attempt to parse assistant message and any structured action (best-effort)
      const assistant = data?.choices?.[0]?.message?.content || (data?.choices?.[0]?.message || '');
      // Return assistant reply and detected mode
      return res.json({ reply: assistant, mode, action: null, success: true });
    }

    // Fallback demo processing (no paid API required)
    const demo = demoReply(userMessage, mode);
    return res.json({ reply: demo.reply, mode, action: demo.action, success: true });
  } catch (err) {
    console.error('chat error', err);
    return res.status(500).json({ error: 'server error', success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🧠 Sandrovellari IA backend running on ${PORT}`));
