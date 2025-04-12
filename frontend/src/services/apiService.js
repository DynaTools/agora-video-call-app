import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const checkServerHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar saúde do servidor:', error);
    throw error;
  }
};

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

export const processChatAudio = async (audioBlob, messageHistory = []) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    if (messageHistory.length > 0) {
      formData.append('messageHistory', JSON.stringify(messageHistory));
    }

    const response = await axios.post(`${API_BASE_URL}/chat`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao processar áudio do chat:', error);
    throw error;
  }
};

const apiService = {
  getAgoraToken,
  processChatAudio,
  checkServerHealth
};

export default apiService;