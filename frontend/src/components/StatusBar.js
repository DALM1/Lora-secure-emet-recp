import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

const StatusBar = ({ connectionStatus, messageCount, signalInfo }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStats, setSystemStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Charger les statistiques système périodiquement
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await ApiService.getMessageStats();
        setSystemStats(stats);
      } catch (error) {
        console.error('Erreur de chargement des statistiques:', error);
      }
    };

    // Chargement initial
    loadStats();

    // Mise à jour périodique
    const interval = setInterval(loadStats, 10000); // Toutes les 10 secondes

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConnectionStatusText = () => {
    const { server_connected, lora_sender_connected, lora_receiver_connected, crypto_initialized } = connectionStatus;
    
    if (!server_connected) {
      return { text: 'Serveur déconnecté', color: 'text-red-600' };
    }
    
    const connectedCount = [lora_sender_connected, lora_receiver_connected, crypto_initialized].filter(Boolean).length;
    
    if (connectedCount === 3) {
      return { text: 'Système opérationnel', color: 'text-green-600' };
    } else if (connectedCount > 0) {
      return { text: `Configuration partielle (${connectedCount}/3)`, color: 'text-yellow-600' };
    } else {
      return { text: 'Configuration requise', color: 'text-gray-600' };
    }
  };

  const statusInfo = getConnectionStatusText();

  return (
    <>
      <footer className="status-bar">
        <div className="status-bar-container">
          <div className="status-bar-content">
            {/* Statut de connexion */}
            <div className="status-bar-left">
              <div className="status-item">
                <div className={`status-indicator ${
                  connectionStatus.server_connected ? 'status-indicator-connected' : 'status-indicator-disconnected'
                }`}></div>
                <span className={`status-text ${statusInfo.color.replace('text-', 'text-color-')}`}>
                  {statusInfo.text}
                </span>
              </div>
              
              {/* Compteur de messages */}
              <div className="status-item status-messages">
                <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{messageCount} messages</span>
              </div>
              
              {/* Informations de signal */}
              {signalInfo && (
                <div className="status-item status-signal">
                  <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  <span>RSSI: {signalInfo.rssi}dBm</span>
                  {signalInfo.snr && <span>SNR: {signalInfo.snr}</span>}
                </div>
              )}
            </div>

            {/* Partie droite */}
            <div className="status-bar-right">
              {/* Statistiques système */}
              {systemStats && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="status-stats-btn"
                >
                  <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>
                    {systemStats.total_sent || 0} envoyés, {systemStats.total_received || 0} reçus
                  </span>
                </button>
              )}
              
              {/* Heure actuelle */}
              <div className="status-item status-time">
                <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="status-time-text">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
          
          {/* Détails étendus */}
          {showDetails && systemStats && (
            <div className="status-details">
              <div className="status-stats-grid">
                <div className="status-stat-item">
                  <div className="status-stat-indicator status-stat-sent"></div>
                  <span>Messages envoyés: {systemStats.total_sent || 0}</span>
                </div>
                <div className="status-stat-item">
                  <div className="status-stat-indicator status-stat-received"></div>
                  <span>Messages reçus: {systemStats.total_received || 0}</span>
                </div>
                <div className="status-stat-item">
                  <div className="status-stat-indicator status-stat-errors"></div>
                  <span>Erreurs: {systemStats.total_errors || 0}</span>
                </div>
                <div className="status-stat-item">
                  <div className="status-stat-indicator status-stat-uptime"></div>
                  <span>Uptime: {systemStats.uptime || 'N/A'}</span>
                </div>
              </div>
              
              {systemStats.last_activity && (
                <div className="status-last-activity">
                  Dernière activité: {new Date(systemStats.last_activity).toLocaleString('fr-FR')}
                </div>
              )}
            </div>
          )}
        </div>
      </footer>
      
      {/* Indicateur de connexion flottant pour mobile */}
      <div className="mobile-status-indicator">
        <div className={`mobile-status-badge ${
          connectionStatus.server_connected && 
          connectionStatus.lora_sender_connected && 
          connectionStatus.lora_receiver_connected && 
          connectionStatus.crypto_initialized
            ? 'mobile-status-connected'
            : connectionStatus.server_connected
            ? 'mobile-status-partial'
            : 'mobile-status-disconnected'
        }`}>
          <div className="mobile-status-content">
            <div className="mobile-status-pulse"></div>
            <span>
              {connectionStatus.server_connected && 
               connectionStatus.lora_sender_connected && 
               connectionStatus.lora_receiver_connected && 
               connectionStatus.crypto_initialized
                ? 'Connecté'
                : connectionStatus.server_connected
                ? 'Partiel'
                : 'Déconnecté'
              }
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatusBar;