import React, { useState } from 'react';
import toast from 'react-hot-toast';

const CryptoPanel = ({ connectionStatus, keyFingerprint, onInit, onImport, onExport }) => {
  const [password, setPassword] = useState('');
  const [keyB64, setKeyB64] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportedKey, setExportedKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInit = async () => {
    if (!password.trim()) {
      toast.error('Veuillez saisir un mot de passe');
      return;
    }

    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsInitializing(true);
    try {
      const result = await onInit(password);
      toast.success('Chiffrement initialisé avec succès');
      setPassword('');
      setShowPassword(false);
    } catch (error) {
      toast.error(`Erreur d'initialisation ${error.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleImport = async () => {
    if (!keyB64.trim()) {
      toast.error('Veuillez saisir une clé à importer');
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(keyB64);
      toast.success('Clé importée avec succès');
      setKeyB64('');
      setShowImport(false);
    } catch (error) {
      toast.error(`Erreur d'import ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await onExport();
      setExportedKey(result.key_b64);
      setShowExport(true);
      toast.success('Clé exportée avec succès');
    } catch (error) {
      toast.error(`Erreur d'export ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copié dans le presse-papiers');
    } catch (error) {
      toast.error('Erreur de copie');
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(password);
    setShowPassword(true);
  };

  const isInitialized = connectionStatus.crypto_initialized;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Chiffrement
        </h2>
        <div className={`status-badge ${
          isInitialized ? 'status-connected' : 'status-disconnected'
        }`}>
          {isInitialized ? 'Initialisé' : 'Non initialisé'}
        </div>
      </div>

      {!isInitialized ? (
        <div className="form-section">
          {/* Initialisation avec mot de passe */}
          <div className="form-group">
            <h3 className="section-title">Nouvelle clé de chiffrement</h3>

            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe (min. 8 caractères)"
                className="form-input"
                style={{ paddingRight: '80px' }}
                disabled={isInitializing}
              />
              <div className="input-actions">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-icon"
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={generateSecurePassword}
                  className="btn-icon"
                  title="Générer un mot de passe sécurisé"
                >
                  <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              onClick={handleInit}
              disabled={!password.trim() || password.length < 8 || isInitializing}
              className={`btn btn-full ${
                password.trim() && password.length >= 8 && !isInitializing
                  ? 'btn-success'
                  : 'btn-disabled'
              }`}
            >
              {isInitializing ? (
                <div className="btn-loading">
                  <div className="loading-spinner"></div>
                  Initialisation
                </div>
              ) : (
                'Initialiser le chiffrement'
              )}
            </button>
          </div>

          {/* Séparateur */}
          <div className="divider">
            <span>ou</span>
          </div>

          {/* Import de clé */}
          <div className="form-group">
            <div className="section-header">
              <h3 className="section-title">Importer une clé existante</h3>
              <button
                onClick={() => setShowImport(!showImport)}
                className="btn-text"
              >
                {showImport ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            {showImport && (
              <div className="form-section">
                <textarea
                  value={keyB64}
                  onChange={(e) => setKeyB64(e.target.value)}
                  placeholder="Collez votre clé privée ici"
                  className="form-textarea"
                  disabled={isImporting}
                />
                <button
                  onClick={handleImport}
                  disabled={!keyB64.trim() || isImporting}
                  className={`btn btn-full ${
                    keyB64.trim() && !isImporting
                      ? 'btn-primary'
                      : 'btn-disabled'
                  }`}
                >
                  {isImporting ? (
                    <div className="btn-loading">
                      <div className="loading-spinner"></div>
                      Import en cours
                    </div>
                  ) : (
                    'Importer la clé'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="form-section">
          {/* Informations de la clé */}
          <div className="alert alert-success">
            <div className="alert-header">
              <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="alert-title">Chiffrement actif</span>
            </div>
            {keyFingerprint && (
              <div className="alert-content">
                <div className="fingerprint">
                  Empreinte: {keyFingerprint}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="form-group">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`btn btn-full ${
                isExporting ? 'btn-disabled' : 'btn-primary'
              }`}
            >
              {isExporting ? (
                <div className="btn-loading">
                  <div className="loading-spinner"></div>
                  Export en cours
                </div>
              ) : (
                'Exporter la clé'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal d'export */}
      {showExport && exportedKey && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  Clé de chiffrement exportée
                </h3>
                <button
                  onClick={() => setShowExport(false)}
                  className="btn-close"
                >
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="alert alert-warning">
                  <div className="alert-content">
                    <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="alert-text">
                      <strong>Important</strong> Gardez cette clé en sécurité. Elle est nécessaire pour déchiffrer vos messages.
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Clé de chiffrement (Base64)
                  </label>
                  <div className="input-group">
                    <textarea
                      value={exportedKey}
                      readOnly
                      rows={4}
                      className="form-textarea code-text"
                    />
                    <button
                      onClick={() => copyToClipboard(exportedKey)}
                      className="btn-icon btn-copy"
                      title="Copier"
                    >
                      <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoPanel;
