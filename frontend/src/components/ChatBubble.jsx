import React from 'react';
import './ChatBubble.css';

const ChatBubble = ({ message, type }) => {
  const { text, timestamp } = message;
  
  // Formatar hora da mensagem
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={`chat-bubble ${type}-bubble`}>
      <div className="bubble-content">
        <p className="bubble-text">{text}</p>
        <span className="bubble-time">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
};

export default ChatBubble;