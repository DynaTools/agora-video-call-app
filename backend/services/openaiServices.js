const OpenAI = require('openai');
const fs = require('fs');

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcreve áudio para texto usando OpenAI Whisper
 * @param {Buffer} audioBuffer - Buffer do arquivo de áudio
 * @param {Object} options - Opções de transcrição (ex: idioma)
 * @returns {Promise<String>} - Texto transcrito
 */
async function transcribeAudio(audioBuffer, options = {}) {
  try {
    // Salvar buffer em arquivo temporário
    const tempFilePath = `./temp_audio_${Date.now()}.webm`;
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    // Criar arquivo para upload
    const file = fs.createReadStream(tempFilePath);
    
    // Chamar API de transcrição
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: options.language || null, // Opcional: 'it' para italiano, 'pt' para português
    });
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempFilePath);
    
    return transcription.text;
  } catch (error) {
    console.error('Erro na transcrição:', error);
    throw new Error(`Falha ao transcrever áudio: ${error.message}`);
  }
}

/**
 * Gera resposta do tutor virtual em italiano
 * @param {String} userText - Texto do usuário
 * @param {Array} messageHistory - Histórico de mensagens anteriores
 * @returns {Promise<String>} - Resposta do tutor
 */
async function generateTutorResponse(userText, messageHistory = []) {
  try {
    // Montar histórico de mensagens para contexto
    const messages = [
      {
        role: 'system',
        content: `Você é um tutor de italiano amigável e paciente. 
        Sempre responda em italiano, mesmo que a pergunta seja feita em outro idioma. 
        Mantenha respostas concisas (máximo 3 frases) e adaptadas ao nível básico/intermediário.
        Corrija erros gramaticais e de vocabulário de forma gentil.
        Se apropriado, inclua a tradução de palavras-chave para ajudar no aprendizado.`
      },
      // Incluir histórico de conversa anterior para contexto
      ...messageHistory.map(msg => ({
        role: msg.sender === 'tutor' ? 'assistant' : 'user',
        content: msg.text
      })),
      // Adicionar mensagem atual do usuário
      { role: 'user', content: userText }
    ];

    // Gerar resposta
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    throw new Error(`Falha ao gerar resposta: ${error.message}`);
  }
}

/**
 * Converte texto para áudio usando TTS da OpenAI
 * @param {String} text - Texto para conversão
 * @returns {Promise<Buffer>} - Buffer do áudio gerado
 */
async function textToSpeech(text) {
  try {
    // Chamar API de TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
      speed: 0.9, // Um pouco mais lento para melhor compreensão
    });
    
    // Obter buffer de resposta
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('Erro na síntese de voz:', error);
    throw new Error(`Falha na síntese de voz: ${error.message}`);
  }
}

module.exports = {
  transcribeAudio,
  generateTutorResponse,
  textToSpeech
};