// Lightweight serverless /api/chat for free deployment on Vercel or similar
// Accepts POST { message, userId, userName } and returns { message, success }

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST,GET');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { message = '', userId = 'guest', userName = '', conversationOnly = false } = req.body || {};

  if (!global.__userMemories) global.__userMemories = {};
  const userMemories = global.__userMemories;
  if (!userMemories[userId]) userMemories[userId] = [];
  const mem = userMemories[userId];
  mem.push({ role: 'user', content: message });

  function generateReply(message, userId, userName, conversationOnly = false) {
    const t = (message || '').toLowerCase().trim();
    const mem = userMemories[userId] || [];

    // Helper to choose a reply different from last assistant reply
    function choose(replies) {
      const last = mem.slice().reverse().find(m => m.role === 'assistant')?.content || '';
      const options = replies.filter(r => r && r !== last);
      if (!options.length) return replies[Math.floor(Math.random() * replies.length)];
      return options[Math.floor(Math.random() * options.length)];
    }

    // Utility to return structured reply: { text, action }
    function textOnly(txt) { return { text: txt, action: null }; }
    function withAction(txt, action) { return { text: txt, action }; }

    // Greeting
    if (/^\s*(oi|olá|ola|bom dia|boa tarde|boa noite)\b/.test(t)) {
      const replies = [
        `Olá${userName ? ' ' + userName.split(' ')[0] : ''}! Como você está?`,
        `Oi${userName ? ' ' + userName.split(' ')[0] : ''}! Diga o que quer que eu faça.`,
        `Prazer em falar com você${userName ? ', ' + userName.split(' ')[0] : ''}! No que posso ajudar?`
      ];
      return textOnly(choose(replies));
    }

    // Help / capabilities only when asked
    if (/\b(ajuda|o que pode|o que faz|como|o que você pode)\b/.test(t)) {
      const replies = [
        'Posso interagir com páginas, copiar textos, abrir sites e executar ações simples que você pedir. O que deseja agora?',
        'Consigo preencher campos, clicar botões, abrir WhatsApp/Telegram e copiar conteúdo. Me diga uma tarefa.'
      ];
      return textOnly(choose(replies));
    }

    // Copy to clipboard: extract quoted text or the rest
    if (/\b(copiar|copie|clipboard)\b/.test(t)) {
      const m = message.match(/"([^\\"]+)"/) || message.match(/copiar\s+(.+)$/i);
      const textToCopy = m ? (m[1] || m[0].replace(/copiar\s+/i, '').trim()) : 'texto copiado';
      const code = `navigator.clipboard.writeText(${JSON.stringify(textToCopy)});`;
      const replies = [
        `Pronto — copiei para você. Quer que eu cole em algum lugar?`,
        `Feito, texto copiado.`
      ];
      if (conversationOnly) return textOnly(`Posso copiar esse texto para você, mas estou no modo conversa apenas.`);
      return withAction(choose(replies), { type: 'eval', code });
    }

    // WhatsApp: open wa.me with prefilled message
    if (/\b(whatsapp)\b/.test(t)) {
      const m = message.match(/(?:para\s+([\w\s]+)\s*)?(?:dizendo|diga|com|mensagem\s+)(.+)$/i);
      const text = m ? (m[2] || 'Olá') : message.replace(/.*whatsapp/i, '').trim() || 'Olá';
      const encoded = encodeURIComponent(text);
      const waUrl = `https://wa.me/?text=${encoded}`;
      const code = `window.open(${JSON.stringify(waUrl)}, '_blank');`;
      const replies = [`Abri o WhatsApp Web para você.`, `Vou abrir o WhatsApp com a mensagem pronta.`];
      if (conversationOnly) return textOnly(`Consigo abrir o WhatsApp e preparar a mensagem, mas estou no modo conversa apenas. Quer que eu faça?`);
      return withAction(choose(replies), { type: 'open', url: waUrl, code });
    }

    // Telegram: open web.telegram.org (cannot prefill easily) — ask follow-up
    if (/\b(telegram)\b/.test(t)) {
      const url = 'https://web.telegram.org';
      const code = `window.open('${url}', '_blank');`;
      const replies = [`Abri o Telegram Web. Quer que eu prepare uma mensagem?`, `Abrindo o Telegram Web agora.`];
      if (conversationOnly) return textOnly(`Consigo abrir o Telegram Web, mas estou no modo conversa apenas. Quer que eu abra?`);
      return withAction(choose(replies), { type: 'open', url, code });
    }

    // Open generic site
    const openMatch = message.match(/(?:abre|abrir|abre o|abre a)\s+([\w:\/.?&=-]+)/i);
    if (openMatch) {
      const url = openMatch[1].startsWith('http') ? openMatch[1] : 'https://' + openMatch[1];
      const code = `window.open(${JSON.stringify(url)}, '_blank');`;
      const replies = [`Pronto, abri ${url} para você.`, `Abri a página solicitada.`];
      if (conversationOnly) return textOnly(`Posso abrir ${url} para você, mas agora estou apenas conversando. Quer que eu abra?`);
      return withAction(choose(replies), { type: 'open', url, code });
    }

    // Default: ask a contextual follow-up, avoid repeating same phrase
    const fallbackReplies = [
      `Entendi. Pode me dar mais detalhes?`,
      `Certo — quer que eu execute isso agora?`,
      `Ok, estou preparado para fazer isso. Deseja que eu prossiga?`
    ];
    return textOnly(choose(fallbackReplies));
  }

  const result = generateReply(message, userId, userName, conversationOnly);
  mem.push({ role: 'assistant', content: result.text });

  return res.json({ message: result.text, action: result.action || null, success: true });
};
