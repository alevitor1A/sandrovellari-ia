// test_api.js — simple Node test for /api/chat
// Usage: node test_api.js
const url = 'https://sandrovellari-ia.vercel.app/api/chat';

async function post(message, conversationOnly) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationOnly })
    });
    const json = await res.json();
    console.log('---', 'conversationOnly=', conversationOnly);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('request failed', e.message || e);
  }
}

(async () => {
  await post('abre o whatsapp e manda olá', true);
  await post('abre o whatsapp e manda olá', false);
})();
