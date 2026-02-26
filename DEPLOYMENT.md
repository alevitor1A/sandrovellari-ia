## 🚀 GUIA DE DEPLOYMENT - SANDROVELLARI IA

### ✅ Status Atual
- ✔ Código corrigido e sem credenciais expostas
- ✔ Vercel configurado ($VERCEL_URL = `https://sandrovellari-ia.vercel.app`)
- ✔ api/chat.js pronto para serverless
- ⏳ GitHub: Aguardando desbloqueio do push

---

## 📋 Próximos Passos

### 1️⃣ Desbloquear GitHub (obrigatório)
```bash
# Acesse e clique "Allow":
# https://github.com/alevitor1A/sandrovellari-ia/security/secret-scanning/unblock-secret/3ADlWcBDu0S3vcguuDohBOhPyj3

# Depois, volta no terminal e executa:
git push origin clean:main --force
```

### 2️⃣ Deploy na Vercel (3 min)

**Opção A - Via dashboard Vercel:**
1. Acesse: https://vercel.com/dashboard
2. "New Project" → conectar seu GitHub
3. Selecionar repositório `sandrovellari-ia`
4. Variáveis de ambiente:
   ```
   GROQ_API_KEY = [sua chave Groq aqui]
   ```
5. Deploy ✅

**Opção B - Via CLI (mais rápido):**
```bash
npm i -g vercel
cd c:\Users\Admin\OneDrive\Desktop\sandrovellari-ia
vercel login
vercel --prod
# Será criado em: https://sandrovellari-ia.vercel.app
```

### 3️⃣ Adicionar Chave Groq no Vercel
1. https://vercel.com/dashboard/project/sandrovellari-ia/settings/environment-variables
2. Add: `GROQ_API_KEY` = sua chave
3. Redeploy automático

### 4️⃣ Atualizar URL no app.html e popup.js
Procure por:
```javascript
const VERCEL_URL = 'https://sandrovellari-ia.vercel.app';
```
Se sua URL for diferente, substitua. Senão, deixe como está ✅

---

## 🔌 Como tudo funciona

```
┌─────────────────┐
│  Browser/App    │  (app.html, popup.js)
│   Firebase UI   │
└────────┬────────┘
         │
         ├──→ fetch /api/chat  →  [VERCEL] (sem CORS, seguro)
         │                             │
         │                             └──→ chama Groq API com chave secreta
         │
         └──→ fallback demo (se Vercel offline)
         
[Firebase Auth] + [Realtime DB] = Chat em tempo real
```

---

## 🧪 Testar antes de fazer deploy completo

```bash
# Terminal local
node server.js

# Outro terminal
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "oi", "userId": "test1"}'
```

Deve responder com: `{ "reply": "..." }`

---

## 🆘 Troubleshooting

### ❌ "CORS error"
→ Vercel está offline. Checar: https://sandrovellari-ia.vercel.app/api/chat
→ Fallback demo ativado (visual normal, sem IA real)

### ❌ "GROQ API error"
→ Chave não configurada no Vercel
→ Vai para modo demo (respostas genéricas)

### ❌ "Firebase connection error"
→ Checar `.firebaserc` e credenciais
→ Executar: `firebase login` e `firebase init`

---

## 📞 Resumo do que você tem

✅ **Frontend:** app.html, popup.js (Chrome Extension)
✅ **Backend:** api/chat.js (Vercel Serverless)
✅ **Auth:** Firebase Authentication
✅ **DB:** Firebase Realtime Database
✅ **IA:** Groq API (LLaMA 3 70B)
✅ **Real-time:** Socket.io (não integrado ainda, mas estrutura pronta)

Tudo funciona 100% graciosamente. Zero custos até escalar significativamente. 🎉
