// URL do backend (Vercel implantado) — endpoint direto da função serverless
const SERVER_URL = 'https://sandrovellari-ia.vercel.app/api/chat';

// Modo demo local: respostas variáveis sem usar API paga
function localDemoResponse(userText, userName, conversationOnly = false) {
  const t = (userText || '').toLowerCase();
  const name = userName ? userName.split(' ')[0] : '';
  const greetings = [
    `Olá ${name}. Como posso ajudar você hoje?`,
    `Oi ${name}, em que posso ajudar?`,
    `Olá${name ? ' ' + name : ''}! Diga o que você precisa.`
  ];

  const helpReplies = [
    'Posso preencher formulários, clicar em botões e copiar textos. Diga o que deseja.',
    'Consigo executar ações simples em páginas: preencher campos, clicar botões e copiar conteúdo. O que quer que eu faça?'
  ];

  if (/oi|olá|ola|bom dia|boa tarde|boa noite/.test(t)) return { text: greetings[Math.floor(Math.random()*greetings.length)], action: null };
  if (/ajuda|como|o que|pode fazer/.test(t)) return { text: helpReplies[Math.floor(Math.random()*helpReplies.length)], action: null };
  if (/copiar|clipboard|copie/.test(t)) return { text: 'Certo — vou copiar o texto para o seu clipboard.', action: { type: 'eval', code: `navigator.clipboard.writeText('texto copiado')` } };

  // Ação: abrir WhatsApp Web
  if (/whatsapp/.test(t) || /abre o whatsapp/.test(t)) {
    const msg = 'Vou abrir o WhatsApp Web para você.';
    const code = `window.open('https://web.whatsapp.com', '_blank');`;
    if (conversationOnly) return { text: 'Posso abrir o WhatsApp Web e preparar a mensagem, mas estou em modo conversa apenas. Quer que eu execute?', action: null };
    return { text: msg, action: { type: 'open', url: 'https://web.whatsapp.com', code } };
  }

  if (/abrir|telegram|google|site/.test(t)) {
    if (conversationOnly) return { text: 'Posso abrir páginas e interagir com elementos, mas estou em modo conversa apenas. Quer que eu abra?', action: null };
    return { text: 'Posso abrir páginas e interagir com elementos. Diga qual site e o que quer que eu faça.', action: null };
  }
  if (/tchau|até|valeu|obrigado/.test(t)) return { text: 'Por nada — até mais!', action: null };

  // fallback: respostas variadas
  return { text: `Recebi: "${userText}". Posso transformar isso em uma ação no site ou responder normalmente.`, action: null };
}

let currentTabUrl = '';
let currentTabTitle = '';

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentTabUrl = tabs[0]?.url || '';
  currentTabTitle = tabs[0]?.title || '';
  document.getElementById('site-info').textContent = `${currentTabTitle || currentTabUrl}`;
});

document.getElementById('user-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  addMsg(text, 'user');

  const typingEl = document.createElement('div');
  typingEl.className = 'typing';
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  document.getElementById('messages').appendChild(typingEl);
  scrollBottom();

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0] || {};
    try {
      // demo mode if backend not configured
      const allowActions = document.getElementById('allow-actions')?.checked === true;
      if (!SERVER_URL || SERVER_URL.includes('REPLACE_WITH_BACKEND_URL')) {
        const replyObj = localDemoResponse(text, tab.title || '', !allowActions);
        document.getElementById('typing')?.remove();
        addMsg(replyObj.text, 'ai');
        try { if ('speechSynthesis' in window) { const u=new SpeechSynthesisUtterance(replyObj.text.replace(/<br>/g,'\n')); u.lang='pt-BR'; speechSynthesis.cancel(); speechSynthesis.speak(u);} } catch(e){console.warn(e)}
        if (replyObj.action && allowActions) {
          const a = replyObj.action;
          if (a.type === 'open' && a.url) {
            chrome.tabs.create({ url: a.url });
          } else if (a.code) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: (jsCode) => { try { eval(jsCode); } catch(e){console.error(e)} }, args: [a.code] });
            });
          }
        }
        return;
      }

      const response = await fetch(`${SERVER_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userId: tab.id || 'extension', userName: tab.title || '' })
      });

      if (!response.ok) throw new Error('server error');

      const data = await response.json();
      const reply = data.message || 'Desculpe, não consegui processar isso.';
      const action = data.action || null;

      document.getElementById('typing')?.remove();
      addMsg(reply, 'ai');
      try { if ('speechSynthesis' in window) { const u=new SpeechSynthesisUtterance(reply.replace(/<br>/g,'\n')); u.lang='pt-BR'; speechSynthesis.cancel(); speechSynthesis.speak(u);} } catch(e){console.warn(e)}

      if (action && allowActions) {
        if (action.type === 'open' && action.url) chrome.tabs.create({ url: action.url });
        else if (action.code) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: (jsCode) => { try { eval(jsCode); } catch(e){console.error(e)} }, args: [action.code] });
          });
        }
      }

    } catch (err) {
      // fallback to demo response on network/server error
      document.getElementById('typing')?.remove();
      const allowActions = document.getElementById('allow-actions')?.checked === true;
      const replyObj = localDemoResponse(text, tab.title || '', !allowActions);
      addMsg(replyObj.text, 'ai');
      try { if ('speechSynthesis' in window) { const u=new SpeechSynthesisUtterance(replyObj.text.replace(/<br>/g,'\n')); u.lang='pt-BR'; speechSynthesis.cancel(); speechSynthesis.speak(u);} } catch(e){console.warn(e)}
      if (replyObj.action && allowActions) {
        const a = replyObj.action;
        if (a.type === 'open' && a.url) chrome.tabs.create({ url: a.url });
        else if (a.code) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: (jsCode) => { try { eval(jsCode); } catch(e){console.error(e)} }, args: [a.code] });
          });
        }
      }
    }
  });
}

function addMsg(text, type) {
  const container = document.getElementById('messages');
  // Avoid duplicate messages within the last 3 messages
  const children = Array.from(container.children).reverse().slice(0,3);
  for (const c of children) {
    if (!c.classList) continue;
    const isMsg = c.classList.contains('msg');
    const sameType = c.classList.contains(type);
    const cText = (type === 'ai') ? c.innerText.replace(/SANDRO IA/i, '').trim() : c.textContent.trim();
    if (isMsg && sameType && cText && cText === text) return;
  }

  const el = document.createElement('div');
  el.className = `msg ${type}`;
  if (type === 'ai') el.innerHTML = `<strong>Sandro</strong> ${text.replace(/\n/g, '<br>')}`;
  else el.textContent = text;
  container.appendChild(el);
  scrollBottom();
}

function scrollBottom() {
  const el = document.getElementById('messages');
  el.scrollTop = el.scrollHeight;
}
