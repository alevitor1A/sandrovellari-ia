// Content script do Sandro IA
// Injeta no site para permitir que o Sandro execute ações

window.sandroIA = {
  version: '1.0',
  active: true
};

// Listener para mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'execute') {
    try {
      const result = eval(request.code);
      sendResponse({ success: true, result });
    } catch(e) {
      sendResponse({ success: false, error: e.message });
    }
  }
  return true;
});
