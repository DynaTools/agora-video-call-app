const OpenAI = require('openai');

// Inicializa cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcreve áudio para texto usando OpenAI Whisper
 * @param {Buffer} audioBuffer - Buffer do arquivo de áudio
 * @param {Object} options - Opções adicionais (language, etc)
 * @returns {Promise<String>} Texto transcrito
 */
async function transcribeAudio(audioBuffer, options = {}) {
  try {
    // Criar um arquivo temporário com o áudio
    const file = await openai.files.create({
      file: audioBuffer,
      purpose: 'audio-transcription',
    });

    // Transcrever o áudio
    const transcription = await openai.audio.transcriptions.create({
      file: file.id,
      model: "whisper-1",
      language: options.language, // Opcional, pode ser 'pt', 'it', etc.
      // Se não for especificado, o Whisper detecta automaticamente o idioma
    });

    // Remover o arquivo temporário
    await openai.files.del(file.id);

    return transcription.text;
  } catch (error) {
    console.error('Erro na transcrição de áudio:', error);
    throw new Error(`Falha na transcrição: ${error.message}`);
  }
}

/**
 * Gera resposta do tutor em italiano usando GPT
 * @param {String} userMessage - Mensagem do usuário (em qualquer idioma)
 * @param {Array} messageHistory - Histórico de mensagens (opcional)
 * @returns {Promise<String>} Resposta em italiano
 */
async function generateTutorResponse(userMessage, messageHistory = []) {
  try {
    // Construir o contexto da conversa
    const messages = [
      {
        role: "system",
        content: "Você é um tutor virtual de língua italiana. Sua função é conversar com o usuário somente em italiano, ajudando-o a praticar e aprender. Mesmo que o usuário fale em português ou outro idioma, responda sempre em italiano simples e claro. Explique termos em italiano se necessário, e incentive o usuário a continuar praticando. Seja paciente, educativo e amigável."
      },
      // Adicionar histórico de mensagens se existir
      ...messageHistory,
      // Adicionar a mensagem atual do usuário
      { role: "user", content: userMessage }
    ];

    // Chamar a API da OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Ou gpt-4 se preferir maior qualidade
      messages: messages,
      temperature: 0.7,
      max_tokens: 300, // Limitar tamanho da resposta para reduzir custos
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao gerar resposta do tutor:', error);
    throw new Error(`Falha na geração de resposta: ${error.message}`);
  }
}

/**
 * Converte texto em fala usando OpenAI TTS
 * @param {String} text - Texto em italiano para converter em áudio
 * @returns {Promise<Buffer>} Buffer do áudio gerado
 */
async function textToSpeech(text) {
  try {
    // Chamar a API de TTS da OpenAI
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Modelo padrão de TTS
      voice: "alloy", // Voz a ser usada (outras opções: echo, fable, onyx, nova, shimmer)
      input: text,
    });

    // Converter o stream para buffer
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