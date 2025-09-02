import axios from 'axios';

// Configuration de base pour axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Augmenté à 30 secondes pour la connexion LoRa
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les réponses d'erreur
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erreur API:', error);
    
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const message = error.response.data?.error || error.response.data?.message || 'Erreur serveur';
      throw new Error(message);
    } else if (error.request) {
      // La requête a été faite mais pas de réponse
      throw new Error('Impossible de contacter le serveur');
    } else {
      // Erreur dans la configuration de la requête
      throw new Error('Erreur de configuration de la requête');
    }
  }
);

export class ApiService {
  // ===== SANTÉ DU SYSTÈME =====
  
  /**
   * Vérifier l'état de santé du serveur
   */
  static async getHealth() {
    const response = await api.get('/api/health');
    return response.data;
  }

  /**
   * Obtenir la liste des ports série disponibles
   */
  static async getAvailablePorts() {
    const response = await api.get('/api/ports');
    return response.data;
  }

  // ===== CONNEXION LORA =====
  
  /**
   * Connecter les modules LoRa
   */
  static async connectLoRa(senderPort, receiverPort, baudrate = 9600) {
    const response = await api.post('/api/lora/connect', {
      sender_port: senderPort,
      receiver_port: receiverPort,
      baudrate: baudrate
    });
    return response.data;
  }

  /**
   * Déconnecter les modules LoRa
   */
  static async disconnectLoRa() {
    const response = await api.post('/api/lora/disconnect');
    return response.data;
  }

  /**
   * Obtenir les informations de signal LoRa
   */
  static async getSignalInfo() {
    const response = await api.get('/api/lora/signal');
    return response.data;
  }

  // ===== CRYPTOGRAPHIE =====
  
  /**
   * Initialiser le système de chiffrement avec un mot de passe
   */
  static async initCrypto(password) {
    const response = await api.post('/api/crypto/init', {
      password: password
    });
    return response.data;
  }

  /**
   * Exporter la clé de chiffrement
   */
  static async exportCryptoKey() {
    const response = await api.get('/api/crypto/export');
    return response.data;
  }

  /**
   * Importer une clé de chiffrement
   */
  static async importCryptoKey(keyB64) {
    const response = await api.post('/api/crypto/import', {
      key_b64: keyB64
    });
    return response.data;
  }

  /**
   * Obtenir l'empreinte de la clé actuelle
   */
  static async getCryptoFingerprint() {
    const response = await api.get('/api/crypto/fingerprint');
    return response.data;
  }

  // ===== MESSAGES =====
  
  /**
   * Envoyer un message via LoRa
   */
  static async sendMessage(message, priority = 'normal') {
    const response = await api.post('/api/messages/send', {
      message: message,
      priority: priority
    });
    return response.data;
  }

  /**
   * Envoyer un message avec système de retry pour les messages de priorité basse
   */
  static async sendMessageWithRetry(message, priority = 'normal', maxRetries = 3, retryDelay = 2000) {
    let lastError;
    const logs = [];
    const startTime = new Date();
    
    // Log initial
    logs.push({
      timestamp: startTime,
      level: 'info',
      message: `Début d'envoi - Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}" - Priorité: ${priority} - Tentatives max: ${maxRetries}`
    });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const attemptStartTime = new Date();
      
      try {
        logs.push({
          timestamp: attemptStartTime,
          level: 'info',
          message: `Tentative ${attempt}/${maxRetries} - Envoi en cours...`
        });
        
        const result = await this.sendMessage(message, priority);
        
        const attemptEndTime = new Date();
        const attemptDuration = attemptEndTime - attemptStartTime;
        
        logs.push({
          timestamp: attemptEndTime,
          level: 'success',
          message: `Tentative ${attempt}/${maxRetries} réussie en ${attemptDuration}ms`
        });
        
        // Si c'est le premier essai ou si le message est de priorité haute/normale, retourner immédiatement
        if (attempt === 1 || priority !== 'low') {
          return { success: true, data: result, attempt, logs };
        }
        
        return { success: true, data: result, attempt, logs };
      } catch (error) {
        lastError = error;
        const attemptEndTime = new Date();
        const attemptDuration = attemptEndTime - attemptStartTime;
        
        logs.push({
          timestamp: attemptEndTime,
          level: 'error',
          message: `Tentative ${attempt}/${maxRetries} échouée en ${attemptDuration}ms - Erreur: ${error.message}`
        });
        
        console.warn(`Tentative ${attempt}/${maxRetries} échouée pour message priorité ${priority}:`, error.message);
        
        // Si ce n'est pas le dernier essai et que c'est un message de priorité basse, attendre avant de réessayer
        if (attempt < maxRetries && priority === 'low') {
          const waitTime = retryDelay * attempt;
          logs.push({
            timestamp: new Date(),
            level: 'info',
            message: `Attente de ${waitTime}ms avant la prochaine tentative...`
          });
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (priority !== 'low') {
          // Pour les messages de priorité normale/haute, ne pas faire de retry
          const finalError = new Error(error.message);
          finalError.logs = logs;
          throw finalError;
        }
      }
    }
    
    // Toutes les tentatives ont échoué
    const endTime = new Date();
    const totalDuration = endTime - startTime;
    
    logs.push({
      timestamp: endTime,
      level: 'error',
      message: `Échec définitif après ${maxRetries} tentatives en ${totalDuration}ms`
    });
    
    const finalError = new Error(`Échec de l'envoi après ${maxRetries} tentatives: ${lastError.message}`);
    finalError.logs = logs;
    throw finalError;
  }

  /**
   * Obtenir l'historique des messages
   */
  static async getMessageHistory(limit = 100) {
    const response = await api.get('/api/messages/history', {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Effacer l'historique des messages
   */
  static async clearMessageHistory() {
    const response = await api.delete('/api/messages/history');
    return response.data;
  }

  /**
   * Obtenir les statistiques des messages
   */
  static async getMessageStats() {
    const response = await api.get('/api/messages/stats');
    return response.data;
  }

  // ===== UTILITAIRES =====
  
  /**
   * Tester la connexion API
   */
  static async testConnection() {
    try {
      const response = await api.get('/api/health');
      return {
        success: true,
        data: response.data,
        latency: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les informations système
   */
  static async getSystemInfo() {
    const response = await api.get('/api/system/info');
    return response.data;
  }

  /**
   * Redémarrer le système
   */
  static async restartSystem() {
    const response = await api.post('/api/system/restart');
    return response.data;
  }
}

// Fonctions utilitaires pour la gestion des erreurs
export const handleApiError = (error, defaultMessage = 'Une erreur est survenue') => {
  if (error.response) {
    return error.response.data?.error || error.response.data?.message || defaultMessage;
  } else if (error.request) {
    return 'Impossible de contacter le serveur';
  } else {
    return error.message || defaultMessage;
  }
};

// Fonction pour formater les réponses API
export const formatApiResponse = (response) => {
  return {
    success: response.success || true,
    data: response.data || response,
    message: response.message || 'Opération réussie',
    timestamp: new Date().toISOString()
  };
};

// Configuration pour les WebSockets
export const WEBSOCKET_CONFIG = {
  url: API_BASE_URL,
  options: {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 10
  }
};

export default api;