# Tutor Italiano IA

Aplicativo web de videochamada com tutor IA de italiano que integra chamadas de vídeo em tempo real via Agora SDK com serviços de IA da OpenAI.

## 📋 Sobre o Projeto

Este aplicativo permite que usuários conversem por vídeo com um agente de IA (representado por um avatar) que sempre se comunica em italiano, mesmo que o usuário fale em português ou outra língua. O sistema realiza:

1. Transcrição de fala do usuário (STT)
2. Geração de resposta em italiano pelo modelo de linguagem (GPT)
3. Conversão de texto em voz (TTS) para retorno falado em italiano

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React.js, Agora RTC SDK
- **Backend**: Node.js, Express
- **APIs**: OpenAI (Whisper, GPT, TTS), Agora.io

## 🚀 Configuração no GitHub Codespaces

### Passo 1: Criar o Codespace

1. Clique no botão "Code" no repositório
2. Clique na aba "Codespaces"
3. Clique em "Create codespace on main"

### Passo 2: Configurar Variáveis de Ambiente

1. No Codespace, crie um arquivo `.env` na raiz do projeto (você pode copiar o `.env.example`):

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais:

```
# Porta do servidor
PORT=5000

# Credenciais Agora.io (obtenha em https://console.agora.io/)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Credenciais OpenAI (obtenha em https://platform.openai.com/api-keys)
OPENAI_API_KEY=your_openai_api_key

# Configurações de Canal Agora
DEFAULT_CHANNEL_NAME=tutor_italiano_channel

# Ambiente
NODE_ENV=development
```

### Passo 3: Instalar Dependências

Execute o comando para instalar todas as dependências:

```bash
npm run install-all
```

### Passo 4: Iniciar o Projeto

```bash
npm start
```

Isso iniciará tanto o backend (porta 5000) quanto o frontend (porta 3000). O Codespace irá detectar automaticamente a porta e oferecer um link para acessar o aplicativo.

## 📁 Estrutura do Projeto

```
tutor-italiano-ia/
├── frontend/              # Código do frontend React
│   ├── public/
│   └── src/
│       ├── components/    # Componentes React
│       └── services/      # Serviços de API
└── backend/               # Código do servidor Node.js
    ├── routes/            # Rotas da API
    └── services/          # Serviços para OpenAI e Agora
```

## 📱 Uso do Aplicativo

1. Clique em "Iniciar Conversa" na tela inicial
2. Permita acesso à sua câmera e microfone quando solicitado
3. Pressione o botão de microfone e fale (em qualquer idioma)
4. Solte o botão para enviar sua fala para processamento
5. O tutor responderá sempre em italiano, com texto e áudio

## 🔑 Obtendo as Credenciais Necessárias

### Agora.io
1. Crie uma conta em [https://console.agora.io/](https://console.agora.io/)
2. Crie um novo projeto para obter o App ID
3. Habilite o Certificate para seu projeto para obter o App Certificate

### OpenAI
1. Crie uma conta em [https://platform.openai.com/](https://platform.openai.com/)
2. Crie uma chave de API em [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Adicione créditos à sua conta para usar as APIs de Whisper e TTS

## ⚙️ Configurações Avançadas

Para ajustar as configurações do tutor de IA, você pode modificar o prompt do sistema em `backend/services/openaiServices.js`.

## 📄 Licença

MIT