import React, { useState, useEffect, useRef } from 'react';
import './VideoCall.css';
import ChatBubble from './ChatBubble';
import ControlButtons from './ControlButtons';
import agoraService from '../services/agoraService';
import { processChatAudio } from '../services/apiService';

// Avatar placeholder
const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="35" r="25" fill="%234285f4"/><rect x="25" y="65" width="50" height="35" rx="5" fill="%234285f4"/></svg>';

// Avatar do tutor (tente importar, mas use fallback se falhar)
let tutorAvatar = DEFAULT_AVATAR;
try {
  // Tente carregar a imagem diretamente
  tutorAvatar = require('../assets/tutor-avatar.png');
} catch (error) {
  console.warn('Erro ao carregar avatar, usando fallback');
}

const VideoCall = ({ agoraConfig, onEndCall }) => {
  const localVideoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false); // Esta linha estava faltando
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [audioRecorder, setAudioRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const audioPlayerRef = useRef(null);

  // Efeito para inicializar a chamada quando o componente é montado
  useEffect(() => {
    const initCall = async () => {
      try {
        setIsLoading(true);
        // Inicializar Agora SDK
        const { appId, channel, token, uid } = agoraConfig;
        await agoraService.join(appId, channel, token, uid);
        
        // Exibir vídeo local
        const { videoTrack } = agoraService.getLocalTracks();
        if (videoTrack && localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
        
        setIsConnected(true);
        setIsLoading(false);
        
        // Adicionar mensagem inicial do tutor
        setChatMessages([
          {
            sender: 'tutor',
            text: 'Ciao! Sono il tuo tutor di italiano. Come posso aiutarti oggi?',
            timestamp: new Date()
          }
        ]);
        
        // Reproduzir mensagem inicial
        const welcomeMessage = new SpeechSynthesisUtterance('Ciao! Sono il tuo tutor di italiano. Come posso aiutarti oggi?');
        welcomeMessage.lang = 'it-IT';
        speechSynthesis.speak(welcomeMessage);
      } catch (error) {
        console.error('Erro ao iniciar videochamada:', error);
        setIsLoading(false);
      }
    };
    
    if (agoraConfig) {
      initCall();
    }
    
    // Cleanup ao desmontar o componente
    return () => {
      agoraService.leave();
      if (audioRecorder) {
        audioRecorder.stop();
      }
    };
  }, [agoraConfig]);

  // Inicializar gravador de áudio
  useEffect(() => {
    const initAudioRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setAudioChunks((chunks) => [...chunks, event.data]);
          }
        };
        
        mediaRecorder.onstop = handleAudioRecordingStopped;
        
        setAudioRecorder(mediaRecorder);
      } catch (error) {
        console.error('Erro ao inicializar gravador de áudio:', error);
      }
    };
    
    initAudioRecorder();
  }, []);

  // Processar a gravação de áudio quando parada
  const handleAudioRecordingStopped = async () => {
    if (audioChunks.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // Criar blob de áudio a partir dos chunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Adicionar mensagem do usuário (inicialmente vazia até recebermos a transcrição)
      const userMessageIndex = chatMessages.length;
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'user', 
          text: '...', // Será atualizado com a transcrição
          timestamp: new Date() 
        }
      ]);
      
      // Enviar áudio para processamento
      const response = await processChatAudio(audioBlob);
      
      // Atualizar mensagem do usuário com a transcrição
      setChatMessages(prev => {
        const updated = [...prev];
        updated[userMessageIndex] = {
          ...updated[userMessageIndex],
          text: response.userText
        };
        return updated;
      });
      
      // Adicionar resposta do tutor
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'tutor',
          text: response.tutorText,
          timestamp: new Date()
        }
      ]);
      
      // Reproduzir áudio da resposta
      const audioBase64 = response.tutorAudio;
      const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const audioResponse = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioResponse);
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.onplay = () => setIsTutorSpeaking(true);
        audioPlayerRef.current.onended = () => {
          setIsTutorSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audioPlayerRef.current.play();
      }
      
      // Limpar chunks de áudio para próxima gravação
      setAudioChunks([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      setIsLoading(false);
      
      // Adicionar mensagem de erro do tutor
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'tutor',
          text: 'Mi dispiace, c\'è stato un problema. Puoi riprovare?',
          timestamp: new Date()
        }
      ]);
    }
  };

  // Iniciar gravação de áudio
  const startRecording = () => {
    if (audioRecorder && !isRecording && !isLoading) {
      setAudioChunks([]);
      audioRecorder.start();
      setIsRecording(true);
    }
  };

  // Parar gravação de áudio
  const stopRecording = () => {
    if (audioRecorder && isRecording) {
      audioRecorder.stop();
      setIsRecording(false);
    }
  };

  // Encerrar a chamada
  const handleEndCall = () => {
    agoraService.leave();
    if (onEndCall) onEndCall();
  };

  return (
    <div className="video-call-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <div className="video-area">
        <div className="tutor-side">
          <div className="tutor-avatar-container">
            <img 
              src={tutorAvatar} 
              alt="Tutor de Italiano" 
              className={`tutor-avatar ${isTutorSpeaking ? 'speaking' : ''}`}
              onError={(e) => {
                console.log('Erro ao carregar avatar, usando fallback');
                e.target.onerror = null;
                e.target.src = DEFAULT_AVATAR;
              }}
            />
            {chatMessages.length > 0 && chatMessages[chatMessages.length - 1].sender === 'tutor' && (
              <ChatBubble 
                message={chatMessages[chatMessages.length - 1]} 
                type="tutor"
              />
            )}
          </div>
        </div>
        
        <div className="user-side">
          <div className="local-video-container" ref={localVideoRef}></div>
          {chatMessages.length > 0 && 
           chatMessages[chatMessages.length - 1].sender === 'user' && 
           chatMessages[chatMessages.length - 1].text !== '...' && (
            <ChatBubble 
              message={chatMessages[chatMessages.length - 1]} 
              type="user"
            />
          )}
        </div>
      </div>
      
      <div className="chat-history">
        {chatMessages.map((msg, index) => (
          <ChatBubble key={index} message={msg} type={msg.sender} />
        ))}
      </div>
      
      <ControlButtons 
        isRecording={isRecording}
        isLoading={isLoading}
        isTutorSpeaking={isTutorSpeaking}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onEndCall={handleEndCall}
      />
      
      <audio ref={audioPlayerRef} style={{ display: 'none' }}></audio>
    </div>
  );
};

export default VideoCall;