const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Memória simples em memória (não persistente) por usuário
const userMemories = {};

function generateReply(message, userId, userName) {
  const t = (message || '').toLowerCase();
  if (!userMemories[userId]) userMemories[userId] = [];
  const mem = userMemories[userId];

  // Basic intents
  if (/oi|olá|ola|bom dia|boa tarde|boa noite/.test(t)) {
    const replies = [
      `Olá ${userName || ''}. Como posso ajudar você hoje?`,
      `Oi ${userName || ''}, em que posso ajudar?`,
      `Olá${userName ? ' ' + userName : ''}! Diga o que você precisa.`
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  if (/ajuda|o que pode|o que faz|como/.test(t)) {
    return 'Posso preencher formulários, clicar em botões, copiar textos e abrir sites. Diga o que deseja.';
  }

  if (/copiar|clipboard|copie/.test(t)) {
    // extract text to copy if quoted
    const m = message.match(/"([^"]+)"/);
    const textToCopy = m ? m[1] : 'texto copiado';
    return `Pronto — vou copiar o texto para a área de transferência.` + ` <script_action>navigator.clipboard.writeText(${JSON.stringify(textToCopy)});</script_action>`;
  }

  if (/whatsapp/.test(t)) {
    // try to extract phone or contact + message
    const msgMatch = message.match(/(?:diz|dizendo)\s+(.+)$/i);
    const msgText = msgMatch ? msgMatch[1] : 'Olá';
    // open WhatsApp Web and prefill (note: wa.me requires number; here just open web)
    const code = `window.open('https://web.whatsapp.com','_blank');`;
    return `Vou abrir o WhatsApp Web para você.` + `<script_action>${code}</script_action>`;
  }

  // Keep simple conversation memory to avoid repeating same assistant reply
  const fallbackReplies = [
    `Entendi. Você pode me dar mais detalhes?`,
    `Certo — posso fazer isso. Quer que eu prossiga agora?`,
    `Ok, vou preparar isso para você. Deseja algo mais?`
  ];

  // choose a reply not equal to last assistant message
  const lastAssistant = mem.slice().reverse().find(m => m.role === 'assistant')?.content;
  let candidate = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  if (candidate === lastAssistant) {
    candidate = fallbackReplies[(fallbackReplies.indexOf(candidate) + 1) % fallbackReplies.length];
  }
  return candidate;
}

app.post('/api/chat', (req, res) => {
  const { message, userId = 'guest', userName = '' } = req.body || {};
  if (!userMemories[userId]) userMemories[userId] = [];
  const mem = userMemories[userId];
  mem.push({ role: 'user', content: message });

  const reply = generateReply(message, userId, userName);
  mem.push({ role: 'assistant', content: reply });

  res.json({ message: reply, success: true });
});

exports.api = functions.https.onRequest(app);
