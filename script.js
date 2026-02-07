async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const message = input.value.trim();

    if (!message) return;

    // Adiciona mensagem do usuário na tela
    appendMessage('user', message);
    input.value = '';

    try {
        const response = await fetch('https://kamilah-untransportable-semimalignantly.ngrok-free.dev/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        appendMessage('bot', data.reply);

    } catch (error) {
        appendMessage('bot', "Erro de conexão. O servidor caiu?");
    }
}

function appendMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = `<div class="content">${text}</div>`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}