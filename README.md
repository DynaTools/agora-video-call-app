# Agora Video Call App

Uma aplicação web de videochamadas construída com o SDK da Agora.io. Esta aplicação permite realizar chamadas de vídeo em tempo real, com controle de volume para áudio local e remoto.

## Características

- Videochamadas em tempo real
- Controle de volume para áudio local e remoto
- Botões para ativar/desativar áudio e vídeo
- Interface de usuário responsiva
- Carregamento via CDN (sem necessidade de instalação de pacotes)
- Compatível com a maioria dos navegadores modernos

## Requisitos

- Um navegador web moderno (Chrome, Firefox, Safari ou Edge recomendados)
- Uma conta Agora.io com um App ID válido
- Acesso a câmera e microfone

## Como usar

1. Clone ou faça download deste repositório
2. Abra o arquivo `index.html` em um navegador web
3. Preencha os campos:
   - **App ID**: Seu App ID da plataforma Agora.io
   - **Canal**: Nome do canal que deseja criar ou entrar
   - **Token**: Token de autenticação (opcional para desenvolvimento)
4. Clique em "Entrar no Canal" para iniciar a chamada de vídeo
5. Use os controles para gerenciar áudio, vídeo e volume

## Importante para desenvolvimento

Para testar em ambiente de desenvolvimento local:

- Use `http://localhost` ou `https://` (navegadores exigem conexões seguras para acessar câmera/microfone)
- Para desenvolvimento sem servidor local, você pode usar:
  - GitHub Pages (após fazer commit do projeto)
  - GitHub Codespaces
  - Serviços como Netlify, Vercel, etc.

## Obtendo um App ID e Token

1. Crie uma conta em [Agora.io Console](https://console.agora.io/)
2. Crie um novo projeto
3. Copie o App ID do projeto
4. Para ambiente de produção, implemente um servidor de tokens conforme a [documentação da Agora](https://docs.agora.io/en/video-calling/reference/manage-agora-account#generate-a-temporary-token)

## Estrutura do Projeto

```
agora-video-call-app/
├── index.html         # Página principal da aplicação
├── css/
│   └── style.css      # Estilos da aplicação
├── js/
│   ├── app.js         # Lógica principal da aplicação
│   ├── config.js      # Configuração do Agora (AppID, etc.)
│   └── ui.js          # Manipulação da interface do usuário
└── README.md          # Documentação do projeto
```

## Recursos Adicionais

- [Documentação da Agora](https://docs.agora.io/en/video-calling/overview/product-overview)
- [Guia de Início Rápido](https://docs.agora.io/en/video-calling/get-started/get-started-sdk)