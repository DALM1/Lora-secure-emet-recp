import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ConnectionPanel = ({ availablePorts, connectionStatus, onConnect, onDisconnect }) => {
  const [senderPort, setSenderPort] = useState('');
  const [receiverPort, setReceiverPort] = useState('');
  const [baudrate, setBaudrate] = useState('9600');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-sélectionner les ports si disponibles
  useEffect(() => {
    if (availablePorts.length >= 2 && !senderPort && !receiverPort) {
      setSenderPort(availablePorts[0]);
      setReceiverPort(availablePorts[1]);
    } else if (availablePorts.length === 1 && !senderPort) {
      setSenderPort(availablePorts[0]);
    }
  }, [availablePorts, senderPort, receiverPort]);

  const handleConnect = async () => {
    if (!senderPort || !receiverPort) {
      toast.error('Veuillez sélectionner les ports émetteur et récepteur');
      return;
    }

    if (senderPort === receiverPort) {
      toast.error('Les ports émetteur et récepteur doivent être différents');
      return;
    }

    setIsConnecting(true);
    try {
      const success = await onConnect(senderPort, receiverPort, parseInt(baudrate));
      if (success) {
        toast.success('Modules LoRa connectés avec succès');
      }
    } catch (error) {
      toast.error(`Erreur de connexion: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const success = await onDisconnect();
      if (success) {
        toast.success('Modules LoRa déconnectés');
      }
    } catch (error) {
      toast.error(`Erreur de déconnexion: ${error.message}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = connectionStatus.lora_sender_connected && connectionStatus.lora_receiver_connected;
  const canConnect = availablePorts.length >= 2 && senderPort && receiverPort && senderPort !== receiverPort;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          Connexion LoRa
        </h2>
        <div className={`status-badge ${
          isConnected ? 'status-connected' : 'status-disconnected'
        }`}>
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </div>
      </div>

      {!isConnected ? (
        <div className="form-section">
          {/* Sélection des ports */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Port Émetteur
              </label>
              <select
                value={senderPort}
                onChange={(e) => setSenderPort(e.target.value)}
                className="form-select"
                disabled={isConnecting}
              >
                <option value="">Sélectionner un port...</option>
                {availablePorts.map((port, index) => {
                  const portValue = typeof port === 'string' ? port : port.port;
                  const portLabel = typeof port === 'string' ? port : (port.name && port.name !== 'n/a' ? `${port.name} (${port.port})` : port.port);
                  return (
                    <option key={`sender-${portValue}-${index}`} value={portValue} disabled={portValue === receiverPort}>
                      {portLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Port Récepteur
              </label>
              <select
                value={receiverPort}
                onChange={(e) => setReceiverPort(e.target.value)}
                className="form-select"
                disabled={isConnecting}
              >
                <option value="">Sélectionner un port...</option>
                {availablePorts.map((port, index) => {
                  const portValue = typeof port === 'string' ? port : port.port;
                  const portLabel = typeof port === 'string' ? port : (port.name && port.name !== 'n/a' ? `${port.name} (${port.port})` : port.port);
                  return (
                    <option key={`receiver-${portValue}-${index}`} value={portValue} disabled={portValue === senderPort}>
                      {portLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Options avancées */}
          <div className="form-group">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn-text"
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem'
              }}
            >
              <svg className={`icon-sm transform transition-transform ${
                showAdvanced ? 'rotate-90' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                marginRight: 'var(--spacing-xs)'
              }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Options avancées
            </button>
            
            {showAdvanced && (
              <div style={{
                marginTop: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                background: 'var(--surface-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div className="form-group">
                  <label className="form-label">
                    Baudrate
                  </label>
                  <select
                    value={baudrate}
                    onChange={(e) => setBaudrate(e.target.value)}
                    className="form-select"
                    disabled={isConnecting}
                  >
                    <option value="9600">9600 (Recommandé)</option>
                    <option value="19200">19200</option>
                    <option value="38400">38400</option>
                    <option value="57600">57600</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Messages d'aide */}
          {availablePorts.length === 0 && (
            <div className="alert alert-warning">
              <div className="alert-content">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="alert-text">
                  Aucun port série détecté. Vérifiez que vos modules LoRa sont connectés.
                </span>
              </div>
            </div>
          )}

          {availablePorts.length === 1 && (
            <div className="alert alert-info">
              <div className="alert-content">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="alert-text">
                  Un seul port détecté. Vous avez besoin de deux modules LoRa pour la communication.
                </span>
              </div>
            </div>
          )}

          {/* Bouton de connexion */}
          <button
            onClick={handleConnect}
            disabled={!canConnect || isConnecting}
            className={`btn btn-full ${
              canConnect && !isConnecting
                ? 'btn-primary'
                : 'btn-disabled'
            }`}
          >
            {isConnecting ? (
              <div className="btn-loading">
                <div className="loading-spinner"></div>
                Connexion en cours...
              </div>
            ) : (
              'Connecter les modules LoRa'
            )}
          </button>
        </div>
      ) : (
        <div className="form-section">
          {/* Informations de connexion */}
          <div className="alert alert-success">
            <div className="alert-header">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="alert-title">Modules connectés</span>
            </div>
            <div className="connection-info">
              <div>Émetteur: {typeof senderPort === 'string' ? senderPort : senderPort?.port || senderPort}</div>
              <div>Récepteur: {typeof receiverPort === 'string' ? receiverPort : receiverPort?.port || receiverPort}</div>
              <div>Baudrate: {baudrate}</div>
            </div>
          </div>

          {/* Bouton de déconnexion */}
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className={`btn btn-full ${
              isDisconnecting ? 'btn-disabled' : 'btn-danger'
            }`}
          >
            {isDisconnecting ? (
              <div className="btn-loading">
                <div className="loading-spinner"></div>
                Déconnexion...
              </div>
            ) : (
              'Déconnecter'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;