import axios from 'axios';

// Base URL para as chamadas de API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Cliente Axios com configuração base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos (processamento de áudio pode demorar)
});

/**
 * Obtém um token para o Agora RTC
 * @param {String} channelName - Nome do canal 
 * @param {Number} uid - ID do usuário (opcional)
 * @returns {Promise} Resposta com token e detalhes
 */
export const getAgoraToken = async (channelName, uid = 0) => {
  try {
    const response = await apiClient.get('/agora-token', {
      params: { channelName, uid }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao obter token Agora:', error);
    throw error;
  }
};

/**
 * Envia áudio para processamento e obtém resposta do tutor
 * @param {Blob} audioBlob - Arquivo de áudio gravado
 * @param {Array} messageHistory - Histórico de mensagens (opcional)
 * @returns {Promise} Resposta com texto e áudio do tutor
 */
export const processChatAudio = async (audioBlob, messageHistory = []) => {
  try {
    // Criar FormData para enviar o arquivo
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    // Adicionar histórico de mensagens se existir
    if (messageHistory.length > 0) {
      formData.append('messageHistory', JSON.stringify(messageHistory));
    }

    // Configuração específica para upload de arquivo
    const response = await axios.post(`${API_BASE_URL}/chat`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 segundos para processamento completo
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao processar áudio do chat:', error);
    throw error;
  }
};

/**
 * Verifica a saúde/status do servidor
 * @returns {Promise} Status do servidor
 */
export const checkServerHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar saúde do servidor:', error);
    throw error;
  }
};

export default {
  getAgoraToken,
  processChatAudio,
  checkServerHealth
};