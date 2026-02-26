const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
// Serve arquivos estáticos da pasta raiz E da pasta public (compatível com ambas)
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz → login
app.get('/', (req, res) => {
  // Tenta index.html na raiz primeiro, depois em public/
  const rootIndex = path.join(__dirname, 'index.html');
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  const fs = require('fs');
  if (fs.existsSync(rootIndex)) {
    res.sendFile(rootIndex);
  } else {
    res.sendFile(publicIndex);
  }
});

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Memória de conversa por usuário (humanização)
const userMemories = {};

// IA Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, userId, userName } = req.body;
  
  if (!userMemories[userId]) {
    userMemories[userId] = [];
  }

  const memory = userMemories[userId];
  memory.push({ role: 'user', content: message });

  // Manter apenas as últimas 20 mensagens
  if (memory.length > 20) memory.splice(0, memory.length - 20);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: `Você é Sandro IA, também chamado de SandroVellari IA. Você é uma inteligência artificial 100% humanizada, calorosa, empática e amigável. Você fala de forma natural como um amigo próximo, usando linguagem descontraída mas respeitosa. Você aprende com cada conversa e lembra das preferências das pessoas. Você pode ajudar com qualquer tarefa do dia a dia. O usuário que está falando com você agora se chama ${userName || 'amigo'}. Responda sempre em português brasileiro de forma natural e humanizada, como se fosse uma conversa real entre amigos.`
          },
          ...memory
        ],
        temperature: 0.9,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'Desculpa, tive um problema aqui. Pode repetir?';
    
    memory.push({ role: 'assistant', content: aiMessage });
    
    res.json({ message: aiMessage, success: true });
  } catch (err) {
    console.error('Erro Groq:', err);
    res.status(500).json({ message: 'Erro ao conectar com a IA', success: false });
  }
});

// Socket.io para chat universal em tempo real
const connectedUsers = {};
const publicMessages = [];

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('join', ({ userId, userName, photoURL }) => {
    connectedUsers[socket.id] = { userId, userName, photoURL, socketId: socket.id };
    io.emit('users-online', Object.values(connectedUsers));
    // Enviar histórico das últimas 50 mensagens
    socket.emit('message-history', publicMessages.slice(-50));
  });

  socket.on('public-message', (data) => {
    const msg = {
      id: Date.now(),
      ...data,
      timestamp: new Date().toISOString()
    };
    publicMessages.push(msg);
    if (publicMessages.length > 200) publicMessages.splice(0, 1);
    io.emit('public-message', msg);
  });

  socket.on('private-message', (data) => {
    const { toSocketId } = data;
    const msg = { ...data, timestamp: new Date().toISOString() };
    socket.to(toSocketId).emit('private-message', msg);
    socket.emit('private-message', msg);
  });

  socket.on('disconnect', () => {
    delete connectedUsers[socket.id];
    io.emit('users-online', Object.values(connectedUsers));
  });
});

const PORT = process.env.PORT || 3000;
if (!GROQ_API_KEY) {
  console.warn('Atenção: variável de ambiente GROQ_API_KEY não definida. As chamadas à API da IA podem falhar.');
}

server.listen(PORT, () => {
  console.log(`SandroVellari IA rodando em http://localhost:${PORT}`);
});
