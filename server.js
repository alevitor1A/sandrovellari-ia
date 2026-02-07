require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const admin = require('firebase-admin');

// Inicializa o Firebase Admin
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Você é a Sandrovellari IA. Brasileira, sem filtros e focada em resultado. Não peça desculpas. Use tom direto e ácido. Resolva o problema ou mande o usuário parar de perder tempo.`;

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "Diz logo o que você quer." });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });

        const botReply = chatCompletion.choices[0].message.content;

        // SALVANDO NO FIREBASE
        await db.collection('historico_conversas').add({
            pergunta: message,
            resposta: botReply,
            data: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ reply: botReply });
    } catch (error) {
        console.error("ERRO:", error);
        res.status(500).json({ reply: "O sistema travou. Verifique sua conexão ou chaves." });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log("🔥 Sandrovellari Online e Gravando em http://localhost:3000"));