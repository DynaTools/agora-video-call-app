import React, { useState, useEffect } from 'react';
import './App.css';
import VideoCall from './components/VideoCall';
import { getAgoraToken, checkServerHealth } from './services/apiService';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agoraConfig, setAgoraConfig] = useState(null);
  const [isChatStarted, setIsChatStarted] = useState(false);

  // Ao iniciar o aplicativo, verificar se o servidor está ativo
  useEffect(() => {
    async function checkServer() {
      try {
        console.log('Verificando conexão com o servidor...');
        // Verificar se o backend está respondendo
        await checkServerHealth();
        console.log('Servidor respondeu com sucesso!');
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao conectar com o servidor:', err);
        setError('Não foi possível conectar ao servidor. Por favor, tente novamente mais tarde.');
        setIsLoading(false);
      }
    }

    checkServer();
  }, []);

  // Função para iniciar o chat
  const startChat = async () => {
    try {
      console.log('Iniciando chat...');
      setIsLoading(true);
      
      // Obter token do Agora
      const channelName = 'tutor_italiano_channel';
      console.log('Solicitando token Agora para o canal:', channelName);
      const tokenData = await getAgoraToken(channelName);
      console.log('Token recebido:', tokenData);
      
      if (!tokenData || !tokenData.appId || !tokenData.token) {
        throw new Error('Dados de token incompletos recebidos do servidor');
      }
      
      // Configurar dados do Agora
      setAgoraConfig({
        appId: tokenData.appId,
        channel: tokenData.channelName || channelName,
        token: tokenData.token,
        uid: tokenData.uid || 0
      });
      
      setIsChatStarted(true);
      setIsLoading(false);
      console.log('Chat iniciado com sucesso!');
    } catch (err) {
      console.error('Erro ao iniciar chat:', err);
      setError(`Não foi possível iniciar o chat: ${err.message || 'Erro desconhecido'}`);
      setIsLoading(false);
    }
  };

  // Função para encerrar o chat
  const endChat = () => {
    console.log('Encerrando chat...');
    setIsChatStarted(false);
    setAgoraConfig(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Tutor Italiano IA</h1>
        <p className="app-subtitle">Pratique italiano com um tutor virtual inteligente</p>
      </header>

      <main className="app-main">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </button>
          </div>
        ) : !isChatStarted ? (
          <div className="welcome-container">
            <div className="welcome-content">
              <h2>Bem-vindo ao Tutor Italiano IA</h2>
              <p>
                Converse em tempo real com um tutor virtual que sempre responde em italiano,
                mesmo quando você fala em português ou outro idioma.
                <br /><br />
                Perfeito para praticar sua compreensão e pronúncia em italiano!
              </p>
              <div className="instructions">
                <h3>Como funciona:</h3>
                <ol>
                  <li>Clique em "Iniciar Conversa" para começar.</li>
                  <li>Permita acesso à sua câmera e microfone quando solicitado.</li>
                  <li>Fale em qualquer idioma e o tutor sempre responderá em italiano.</li>
                  <li>Pressione o botão de microfone para falar com o tutor.</li>
                </ol>
              </div>
              <button 
                className="start-chat-button"
                onClick={startChat}
              >
                Iniciar Conversa
              </button>
            </div>
          </div>
        ) : (
          <VideoCall
            agoraConfig={agoraConfig}
            onEndCall={endChat}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Desenvolvido com tecnologia Agora.io e OpenAI</p>
      </footer>
    </div>
  );
}

export default App;