const express = require('express');
const router = express.Router();
const multer = require('multer');
const { transcribeAudio, generateTutorResponse, textToSpeech } = require('../services/openaiServices');

// Configuração do multer para processar uploads de áudio
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

/**
 * @route   POST /api/chat
 * @desc    Processa áudio do usuário e retorna resposta do tutor
 * @access  Public (para este demo)
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de áudio fornecido' });
    }

    // 1. Transcrição de fala para texto
    console.log('Iniciando transcrição do áudio...');
    const audioBuffer = req.file.buffer;
    const userText = await transcribeAudio(audioBuffer, {
      language: req.body.language // Opcional, o usuário pode fornecer o idioma
    });
    console.log('Texto transcrito:', userText);

    // 2. Geração de resposta em italiano pelo modelo GPT
    console.log('Gerando resposta do tutor...');
    // Opcionalmente, podemos receber histórico de conversa do cliente
    const messageHistory = req.body.messageHistory ? JSON.parse(req.body.messageHistory) : [];
    const tutorResponse = await generateTutorResponse(userText, messageHistory);
    console.log('Resposta gerada:', tutorResponse);

    // 3. Síntese de voz (texto para fala)
    console.log('Convertendo texto em áudio...');
    const audioResponseBuffer = await textToSpeech(tutorResponse);

    // 4. Enviar resposta ao cliente
    const response = {
      userText: userText,        // O que o usuário disse (transcrito)
      tutorText: tutorResponse,  // Resposta do tutor em texto
      // Convertendo buffer para base64 para enviar no JSON
      tutorAudio: audioResponseBuffer.toString('base64')
    };

    res.json(response);
    console.log('Resposta enviada com sucesso');
  } catch (error) {
    console.error('Erro ao processar chat:', error);
    res.status(500).json({ 
      error: 'Falha ao processar a mensagem',
      message: error.message 
    });
  }
});

module.exports = router;