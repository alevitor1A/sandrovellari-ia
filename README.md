
# SandroVellari IA

> Inteligência artificial humanizada, com voz, chat universal e assistente web.

---

## Como Rodar

### 1. Instale as dependências
```bash
cd sandrovellari-ia
npm install
```

### 2. Inicie o servidor
```bash
npm start
```

Antes de iniciar, crie um arquivo `.env` na raiz do projeto com a sua chave da API Groq:

```
GROQ_API_KEY=seu_token_aqui
PORT=3000
```

### 3. Acesse no navegador
```
http://localhost:3000
```
### 3. Acesse no navegador (local)
```
http://localhost:3000
```

Deploy do backend no Google Cloud Run (opcional)

Se quiser implantar o servidor Node (Express) que faz proxy para a API da IA, recomendo usar Cloud Run. O projeto já inclui um `Dockerfile` e um `cloudbuild.yaml` para deploy automático.

Manual (com `gcloud`):
```
# faça login e selecione o projeto
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# build e deploy via script
chmod +x deploy_cloudrun.sh
./deploy_cloudrun.sh YOUR_PROJECT_ID us-central1
```

Depois do deploy, atualize `SERVER_URL` em `app.html` e `popup.js` para o URL do serviço Cloud Run (ex.: `https://sandrovellari-ia-xxxx.a.run.app`).

Modo gratuito / demo

Se você não quer (ou não pode) usar uma API paga, o projeto possui um modo "demo" que responde localmente sem conectar à API da Groq. Para usar o modo demo mantenha `SERVER_URL` como `https://REPLACE_WITH_BACKEND_URL` (valor padrão) — o cliente irá gerar respostas simples e usar TTS no navegador.

---

## Estrutura do Projeto

```
sandrovellari-ia/
├── server.js          → Servidor Express + Socket.io
├── package.json
├── public/
│   ├── index.html     → Página de Login (Firebase)
│   └── app.html       → Aplicativo principal
└── extensao/          → Extensão Chrome
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── content.js
    └── background.js
```

---
### Deploy gratuito do backend (recomendado: Vercel)

Se você está no plano Free do Firebase e precisa de um endpoint serverless gratuito, pode usar Vercel. Copiei para este repositório uma função compatível em `api/chat.js` que replica o modo demo e aceita POSTs JSON.

1) Instale o CLI do Vercel:

```bash
npm i -g vercel
vercel login
```

2) Faça deploy (na pasta do projeto):

```bash
vercel --prod
```

3) Após o deploy, pegue a URL (ex: `https://meu-app.vercel.app`) e defina `SERVER_URL` nos clientes para `https://meu-app.vercel.app/api/chat` (em `app.html` e `popup.js`).

Observação: a função `api/chat.js` é stateless entre invocações (memória em RAM por container), adequada para o modo gratuito.

## Funcionalidades

### Sandro IA (Chat Principal)
- Conversa humanizada com IA via Groq (LLaMA 3 70B)
- Aprende e lembra do contexto da conversa
- Fala em voz alta (Text-to-Speech)
- Aceita comandos por voz (Speech-to-Text)

### Chat Universal
- Mensagens em tempo real entre todos os usuários online
- Via Socket.io

### Chat Privado
- Conversa privada entre dois usuários
- Selecione um usuário online na sidebar

### Assistente Web (Extensão Chrome)
1. Abra o Chrome e acesse `chrome://extensions`
2. Ative o **Modo do desenvolvedor**
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `extensao/`
5. O ícone do Sandro aparece na barra do Chrome
6. Clique no ícone em qualquer site e peça ações!

---

## Credenciais

- **API IA:** Groq API (LLaMA 3 70B)
- **Auth + DB:** Firebase
- **Tempo real:** Socket.io

---

## Como usar a voz

1. Use o ícone de microfone para falar com o Sandro
2. Fale em português — a fala será transcrita automaticamente
3. Ative a opção de áudio para o Sandro responder em voz alta

---

Feito por SandroVellari IA
