import React from 'react';
import './ControlButtons.css';
import { FaMicrophone, FaMicrophoneSlash, FaPhone, FaSpinner } from 'react-icons/fa';

const ControlButtons = ({ 
  isRecording, 
  isLoading, 
  isTutorSpeaking,
  onStartRecording, 
  onStopRecording, 
  onEndCall 
}) => {
  // Handler para o botão de microfone
  const handleMicButton = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="control-buttons">
      <button 
        className={`mic-button ${isRecording ? 'recording' : ''}`}
        onClick={handleMicButton}
        disabled={isLoading || isTutorSpeaking}
        title={isRecording ? 'Soltar para parar de falar' : 'Pressionar para falar'}
      >
        {isLoading ? (
          <FaSpinner className="loading-icon" />
        ) : isRecording ? (
          <FaMicrophoneSlash />
        ) : (
          <FaMicrophone />
        )}
        <span>
          {isLoading 
            ? 'Processando...' 
            : isRecording 
              ? 'Solte para parar' 
              : 'Pressione para falar'}
        </span>
      </button>

      <button 
        className="end-call-button"
        onClick={onEndCall}
        title="Encerrar chamada"
      >
        <FaPhone />
      </button>
    </div>
  );
};

export default ControlButtons;