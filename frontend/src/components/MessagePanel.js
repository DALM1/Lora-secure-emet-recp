import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const MessagePanel = ({ 
  messages, 
  isConnected, 
  onSendMessage, 
  onClearHistory, 
  priority, 
  setPriority, 
  filter, 
  setFilter,
  isSending,
  isClearing 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  const handleSend = async () => {
    if (!newMessage.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    if (!isConnected) {
      toast.error('Système non connecté');
      return;
    }

    try {
      const result = await onSendMessage(newMessage.trim(), priority);
      setNewMessage('');
      
      // Afficher les logs détaillés si disponibles
      if (result && result.logs && result.logs.length > 0) {
        const successLogs = result.logs.filter(log => log.level === 'success');
        const errorLogs = result.logs.filter(log => log.level === 'error');
        
        if (result.attempt > 1) {
          toast.success(`Message envoyé après ${result.attempt} tentative(s)`);
        } else {
          toast.success('Message envoyé');
        }
        
        // Afficher un résumé des logs en cas de retry
        if (errorLogs.length > 0 && successLogs.length > 0) {
          console.log('📊 Logs détaillés d\'envoi:', result.logs);
        }
      } else {
        toast.success('Message envoyé');
      }
    } catch (error) {
      // Afficher les logs détaillés en cas d'erreur
      if (error.logs && error.logs.length > 0) {
        console.error('📊 Logs détaillés d\'échec:', error.logs);
        
        const attempts = error.logs.filter(log => log.message.includes('Tentative')).length;
        if (attempts > 1) {
          toast.error(`Échec après ${attempts} tentative(s): ${error.message}`);
        } else {
          toast.error(`Erreur d'envoi: ${error.message}`);
        }
      } else {
         toast.error(`Erreur d'envoi: ${error.message}`);
       }
     }
   };



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true;
    if (filter === 'sent') return msg.direction === 'sent';
    if (filter === 'received') return msg.direction === 'received';
    return true;
  });

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="panel message-panel">
      {/* En-tête */}
      <div className="panel-header">
        <div className="panel-header-content">
          <h2 className="panel-title">
            <svg className="panel-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
            <span className="message-count">
              {filteredMessages.length}
            </span>
          </h2>


        </div>
      </div>

      {/* Zone de messages */}
      <div className="messages-container">
        {filteredMessages.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="empty-state-title">Aucun message</p>
            <p className="empty-state-description">
              {!isConnected
                ? 'Connectez le système pour commencer à échanger des messages'
                : 'Envoyez votre premier message chiffré'
              }
            </p>
          </div>
        ) : (
          filteredMessages.map((message, index) => (
            <div
              key={index}
              className={`message-wrapper ${message.direction === 'sent' ? 'message-sent' : 'message-received'}`}
            >
              <div className={`message-bubble ${
                message.direction === 'sent'
                  ? 'message-bubble-sent'
                  : 'message-bubble-received'
              }`}>
                <div className="message-header">
                  <span className={`message-direction ${
                    message.direction === 'sent' ? 'message-direction-sent' : 'message-direction-received'
                  }`}>
                    {message.direction === 'sent' ? 'Envoyé' : 'Reçu'}
                  </span>

                  {message.metadata?.priority && message.metadata.priority !== 'normal' && (
                    <div className={`priority-badge ${
                      message.direction === 'sent' ? 'priority-badge-sent' : `priority-badge-${message.metadata.priority}`
                    }`}>
                      {getPriorityIcon(message.metadata.priority)}
                      <span className="priority-text">{message.metadata.priority}</span>
                    </div>
                  )}
                </div>

                <p className="message-content">
                  {message.message}
                </p>

                <div className="message-footer">
                  <span className={`message-timestamp ${
                    message.direction === 'sent' ? 'message-timestamp-sent' : 'message-timestamp-received'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </span>

                  {message.signal_info && (
                    <div className={`message-signal ${
                      message.direction === 'sent' ? 'message-signal-sent' : 'message-signal-received'
                    }`}>
                      RSSI: {message.signal_info.rssi}dBm
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="message-input-section">
        <div className="message-input-container">
          <div className="message-input-wrapper">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Tapez votre message (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)" : "Connectez le système pour envoyer des messages"}
              className="message-textarea"
              disabled={isSending || !isConnected}
              rows={1}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending || !isConnected}
            className={`btn send-btn ${
              newMessage.trim() && !isSending && isConnected
                ? 'btn-primary'
                : 'btn-disabled'
            }`}
          >
            {isSending ? (
              <div className="btn-loading">
                <div className="loading-spinner loading-spinner-white"></div>
              </div>
            ) : (
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {!isConnected && (
          <div className="alert alert-warning connection-warning">
            <div className="alert-content">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Connectez les modules LoRa et initialisez le chiffrement pour envoyer des messages.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagePanel;
