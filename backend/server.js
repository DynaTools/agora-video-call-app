require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Importação das rotas
const agoraTokenRoutes = require('./routes/agoraToken');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug de variáveis de ambiente
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Porta:', PORT);
console.log('CODESPACE_NAME:', process.env.CODESPACE_NAME);
console.log('GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:', process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN);
console.log('AGORA_APP_ID presente:', !!process.env.AGORA_APP_ID);
console.log('OPENAI_API_KEY presente:', !!process.env.OPENAI_API_KEY);

// Configuração do CORS para Codespaces
let corsOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Adicionar origin do Codespaces se estiver em ambiente Codespaces
if (process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
  const codespaceOrigin = `https://${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;
  corsOrigins.push(codespaceOrigin);
  console.log('Adicionando origin do Codespaces para CORS:', codespaceOrigin);
}

const corsOptions = {
  origin: corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Rotas da API
app.use('/api/agora-token', agoraTokenRoutes);
app.use('/api/chat', chatRoutes);

// Verificação de saúde do servidor
app.get('/api/health', (req, res) => {
  console.log('Health check solicitado');
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    env: process.env.NODE_ENV,
    port: PORT,
    corsOrigins: corsOrigins
  });
});

// Servindo arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS configurado para: ${corsOrigins.join(', ')}`);
});