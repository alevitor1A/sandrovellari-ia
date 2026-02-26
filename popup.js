// popup.js — Extensão SandroVellari IA (Corrigido)
// Usa o backend Vercel para evitar problemas de CORS

// IMPORTANTE: Após deploy na Vercel, substitua pela sua URL real
const VERCEL_URL = 'https://sandrovellari-ia.vercel.app';
const VERCEL_URL = 'https://sandrovellari-ia.vercel.app';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

let siteUrl = '', siteTitle = '', pageText = '';

// Pegar info do site atual + conteúdo da página
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  siteUrl = tabs[0]?.url || '';
  siteTitle = tabs[0]?.title || '';
  document.getElementById('site-bar').textContent = `📍 ${siteTitle || siteUrl}`;

  // Tentar pegar texto da página via content script
  chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageInfo' }, resp => {
    if (resp?.text) pageText = resp.text.substring(0, 1500);
  });
});

document.getElementById('inp').addEventListener('keydown', e => {
  if (e.key === 'Enter') send();
});

window.send = async function() {
  const inp = document.getElementById('inp');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';

  addMsg(text, 'user');

  const typing = document.createElement('div');
  typing.className = 'typing'; typing.id = 'typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  document.getElementById('msgs').appendChild(typing);
  scroll();

  const system = `Você é Sandro IA, assistente web inteligente. O usuário está no site: "${siteTitle}" (${siteUrl}).

Contexto da página atual:
${pageText ? pageText.substring(0,800) : 'Não disponível'}

Quando o usuário pedir para executar uma ação:
1. Explique o que vai fazer em português natural
2. Gere o código JS necessário dentro de: <script_action>CODIGO_AQUI</script_action>

Exemplos de ações por site:
- Telegram Web: document.querySelector('.input-message-input').focus(); então simular digitação
- WhatsApp Web: document.querySelector('[data-testid="conversation-compose-box-input"]')
- Google: document.querySelector('input[name="q"]').value = 'pesquisa'; document.querySelector('form').submit()
- Formulários genéricos: document.querySelectorAll('input[type=text]')

Seja objetivo, amigável e em português.`;

  const reply = await callAI(text, system);

  document.getElementById('typing')?.remove();

  // Executar script_action se houver
  const match = reply.match(/<script_action>([\s\S]*?)<\/script_action>/);
  const display = reply.replace(/<script_action>[\s\S]*?<\/script_action>/g, '').trim();

  addMsg(display || 'Ação executada!', 'ai');

  if (match) {
    const code = match[1].trim();
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (c) => {
          try {
            eval(c);
          } catch(e) {
            console.error('[Sandro IA] Erro ao executar:', e.message);
          }
        },
        args: [code]
      }).catch(err => console.error('[Sandro IA] scripting error:', err));
    });
  }
};

async function callAI(text, system) {
  // Tentativa 1: Backend Vercel
  try {
    const r = await fetch(`${VERCEL_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        system,
        mode: 'assistant'
      })
    });
    if (r.ok) {
      const d = await r.json();
      if (d.reply) return d.reply;
    }
  } catch(e) { console.log('[Sandro] Vercel indisponível, tentando Groq direto...'); }

  // Tentativa 2: Groq direto (extensões têm menos restrições de CORS)
  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text }
        ],
        temperature: 0.75,
        max_tokens: 600
      })
    });
    if (r.ok) {
      const d = await r.json();
      const reply = d.choices?.[0]?.message?.content;
      if (reply) return reply;
    }
  } catch(e) { console.log('[Sandro] Groq direto falhou:', e.message); }

  // Tentativa 3: Demo local
  return demoReply(text);
}

function demoReply(text) {
  const t = text.toLowerCase();
  if (t.includes('manda') && t.includes('oi')) return 'Vou tentar enviar "oi" agora! Mas para isso funcionar corretamente, você precisa estar na página de chat aberta. A extensão vai clicar no campo de texto e digitar.\n\n<script_action>const inp = document.querySelector(\'[contenteditable="true"], textarea, input[type="text"]\'); if(inp){inp.focus();inp.textContent="oi";inp.dispatchEvent(new Event("input",{bubbles:true}));}else{alert("Não encontrei o campo de texto nesta página.");}</script_action>';
  if (t.includes('rola') || t.includes('scroll')) return 'Rolando a página para baixo!\n\n<script_action>window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});</script_action>';
  if (t.includes('pesquisa') || t.includes('google')) return 'Aqui está como pesquisar no Google:\n\n<script_action>window.open("https://google.com/search?q="+encodeURIComponent("sua pesquisa"),"_blank");</script_action>';
  return `Entendido! Você quer: "${text}". Para executar ações neste site (${siteTitle}), eu preciso identificar os elementos corretos da página. Pode me dar mais detalhes do que exatamente você quer fazer?`;
}

function addMsg(text, type) {
  const c = document.getElementById('msgs');
  const d = document.createElement('div');
  d.className = `msg ${type}`;
  if (type === 'ai') d.innerHTML = `<b>Sandro IA</b>${String(text).replace(/\n/g,'<br>')}`;
  else d.textContent = text;
  c.appendChild(d);
  scroll();
}

function scroll() {
  const c = document.getElementById('msgs');
  c.scrollTop = c.scrollHeight;
}