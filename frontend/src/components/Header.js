import React, { useState } from 'react';
import { ApiService } from '../services/api';
import toast from 'react-hot-toast';

const Header = ({ connectionStatus, keyFingerprint }) => {
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSystemInfo = async () => {
    if (showSystemInfo) {
      setShowSystemInfo(false);
      return;
    }

    setLoading(true);
    try {
      const info = await ApiService.getSystemInfo();
      setSystemInfo(info);
      setShowSystemInfo(true);
    } catch (error) {
      toast.error('Erreur lors de la récupération des informations système');
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusColor = () => {
    const { server_connected, lora_sender_connected, lora_receiver_connected, crypto_initialized } = connectionStatus;
    
    if (server_connected && lora_sender_connected && lora_receiver_connected && crypto_initialized) {
      return 'status-connected';
    } else if (server_connected) {
      return 'status-warning';
    } else {
      return 'status-disconnected';
    }
  };

  const getConnectionStatusText = () => {
    const { server_connected, lora_sender_connected, lora_receiver_connected, crypto_initialized } = connectionStatus;
    
    if (!server_connected) {
      return 'Serveur déconnecté';
    } else if (lora_sender_connected && lora_receiver_connected && crypto_initialized) {
      return 'Système opérationnel';
    } else if (lora_sender_connected && lora_receiver_connected) {
      return 'LoRa connecté - Crypto requis';
    } else if (crypto_initialized) {
      return 'Crypto initialisé - LoRa requis';
    } else {
      return 'Configuration requise';
    }
  };

  return (
    <>
      <div className="header">
        <div className="header-content">
          {/* Logo et titre */}
          <div className="header-brand">
            <div className="header-logo">
              📡
            </div>
            <div className="header-text">
              <h1 className="header-title">
                LoRa Secure Communication
              </h1>
              <p className="header-subtitle">
                Communication chiffrée longue portée
              </p>
            </div>
          </div>

          {/* Indicateurs de statut */}
          <div className="header-status">
            {/* Empreinte de clé */}
            {keyFingerprint && (
              <div className="status-indicator header-key-indicator">
                <div className="status-dot status-connected"></div>
                <span className="fingerprint">
                  Clé: {keyFingerprint.substring(0, 8)}...
                </span>
              </div>
            )}

            {/* Statut de connexion */}
            <div className="status-indicator header-connection-indicator">
              <div className={`status-dot ${getConnectionStatusColor()}`}></div>
              <span className="status-text">
                {getConnectionStatusText()}
              </span>
            </div>

            {/* Bouton d'informations système */}
            <button
              onClick={handleSystemInfo}
              disabled={loading}
              className="btn-icon header-info-btn"
              title="Informations système"
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        
        {/* Indicateurs détaillés */}
        <div style={{
          marginTop: 'var(--spacing-md)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--spacing-sm)'
        }}>
          <div className={`status-indicator ${
            connectionStatus.server_connected ? 'status-connected' : 'status-disconnected'
          }`} style={{
            background: connectionStatus.server_connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: connectionStatus.server_connected ? '#065f46' : '#991b1b'
          }}>
            <div className="status-dot" style={{
              background: connectionStatus.server_connected ? '#10b981' : '#ef4444'
            }}></div>
            <span className="text-sm font-medium">Serveur</span>
          </div>

          <div className={`status-indicator ${
            connectionStatus.lora_sender_connected ? 'status-connected' : ''
          }`} style={{
            background: connectionStatus.lora_sender_connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            color: connectionStatus.lora_sender_connected ? '#065f46' : 'rgba(255, 255, 255, 0.7)'
          }}>
            <div className="status-dot" style={{
              background: connectionStatus.lora_sender_connected ? '#10b981' : '#94a3b8'
            }}></div>
            <span className="text-sm font-medium">Émetteur</span>
          </div>

          <div className={`status-indicator ${
            connectionStatus.lora_receiver_connected ? 'status-connected' : ''
          }`} style={{
            background: connectionStatus.lora_receiver_connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            color: connectionStatus.lora_receiver_connected ? '#065f46' : 'rgba(255, 255, 255, 0.7)'
          }}>
            <div className="status-dot" style={{
              background: connectionStatus.lora_receiver_connected ? '#10b981' : '#94a3b8'
            }}></div>
            <span className="text-sm font-medium">Récepteur</span>
          </div>

          <div className={`status-indicator ${
            connectionStatus.crypto_initialized ? 'status-connected' : ''
          }`} style={{
            background: connectionStatus.crypto_initialized ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            color: connectionStatus.crypto_initialized ? '#065f46' : 'rgba(255, 255, 255, 0.7)'
          }}>
            <div className="status-dot" style={{
              background: connectionStatus.crypto_initialized ? '#10b981' : '#94a3b8'
            }}></div>
            <span className="text-sm font-medium">Chiffrement</span>
          </div>
        </div>
      </div>

      {/* Modal d'informations système */}
      {showSystemInfo && systemInfo && (
        <div className="modal-overlay">
          <div className="modal-content system-info-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                Informations Système
              </h3>
              <button
                onClick={() => setShowSystemInfo(false)}
                className="modal-close-btn"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="system-info-grid">
                <div className="system-info-section">
                  <h4 className="system-info-title">Système</h4>
                  <div className="system-info-details">
                    <div>OS: {systemInfo.os || 'N/A'}</div>
                    <div>Python: {systemInfo.python_version || 'N/A'}</div>
                    <div>Uptime: {systemInfo.uptime || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="system-info-section">
                  <h4 className="system-info-title">Mémoire</h4>
                  <div className="system-info-details">
                    <div>Utilisée: {systemInfo.memory_usage || 'N/A'}</div>
                    <div>Disponible: {systemInfo.memory_available || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              {systemInfo.ports && systemInfo.ports.length > 0 && (
                <div className="system-info-section">
                  <h4 className="system-info-title">Ports Série</h4>
                  <div className="ports-list">
                    {systemInfo.ports.map((port, index) => (
                      <div key={index} className="port-item">
                        {port}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;