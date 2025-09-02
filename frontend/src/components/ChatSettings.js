import React from 'react';

const ChatSettings = ({
  priority,
  setPriority,
  filter,
  setFilter,
  onClearHistory,
  isClearing,
  messageCount,
  isConnected,
  isFullWidth,
  setIsFullWidth
}) => {
  const handleClear = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      return;
    }
    await onClearHistory();
  };

  return (
    <div className="chat-settings">
      <div className="chat-settings-container">
        {/* Section Priorité */}
        <div className="setting-group">
          <label className="setting-label">
            <svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Priorité
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="setting-select"
            disabled={!isConnected}
          >
            <option value="low">Basse</option>
            <option value="normal">Normale</option>
            <option value="high">Haute</option>
          </select>
        </div>

        {/* Section Filtre */}
        <div className="setting-group">
          <label className="setting-label">
            <svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            Filtre
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="setting-select"
          >
            <option value="all">Tous ({messageCount})</option>
            <option value="sent">Envoyés</option>
            <option value="received">Reçus</option>
          </select>
        </div>

        {/* Section Actions */}
        <div className="setting-group">
          <button
            onClick={() => setIsFullWidth(!isFullWidth)}
            className="setting-button setting-button-primary"
            title={isFullWidth ? "Mode normal" : "Mode pleine largeur"}
          >
            <svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullWidth ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
            {isFullWidth ? "Mode normal" : "Pleine largeur"}
          </button>

          <button
            onClick={handleClear}
            disabled={isClearing || messageCount === 0}
            className="setting-button setting-button-danger"
            title="Effacer l'historique"
          >
            {isClearing ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Effacer l'historique
              </>
            )}
          </button>
        </div>

        {/* Indicateur de statut */}
        <div className="setting-group">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className={`status-dot ${isConnected ? 'status-dot-connected' : 'status-dot-disconnected'}`}></div>
            <span className="status-text">
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;
