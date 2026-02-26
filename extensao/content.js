// Content Script — SandroVellari IA
window.__sandroIA = { version: '1.0', active: true };

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'execute') {
    try { sendResponse({ ok: true, result: eval(req.code) }); }
    catch(e) { sendResponse({ ok: false, error: e.message }); }
  }
  if (req.action === 'getPageInfo') {
    sendResponse({
      title: document.title,
      url: location.href,
      text: document.body.innerText.substring(0, 2000)
    });
  }
  return true;
});