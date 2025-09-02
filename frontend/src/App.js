import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import io from 'socket.io-client';
import Header from './components/Header';
import ConnectionPanel from './components/ConnectionPanel';
import CryptoPanel from './components/CryptoPanel';
import MessagePanel from './components/MessagePanel';
import StatusBar from './components/StatusBar';
import ChatSettings from './components/ChatSettings';
import { ApiService } from './services/api';
import './styles/custom.css';
import './styles/chat-settings.css';


function App() {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    lora_sender_connected: false,
    lora_receiver_connected: false,
    crypto_initialized: false,
    server_connected: false
  });
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [priority, setPriority] = useState('normal');
  const [filter, setFilter] = useState('all');
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [systemInfo, setSystemInfo] = useState({
    availablePorts: [],
    keyFingerprint: null,
    signalInfo: null
  });

  // Initialiser la connexion WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('⚪️ Connecté au serveur WebSocket');
      setConnectionStatus(prev => ({ ...prev, server_connected: true }));
    });

    newSocket.on('disconnect', () => {
      console.log('⚫️ Déconnecté du serveur WebSocket');
      setConnectionStatus(prev => ({ ...prev, server_connected: false }));
    });

    newSocket.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('message_received', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('history_cleared', () => {
      setMessages([]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Vérifier l'état du serveur périodiquement
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await ApiService.getHealth();
        setConnectionStatus(prev => ({
          ...prev,
          lora_sender_connected: health.lora_sender_connected,
          lora_receiver_connected: health.lora_receiver_connected,
          crypto_initialized: health.crypto_initialized
        }));
      } catch (error) {
        console.error('Erreur de vérification de santé:', error);
        setConnectionStatus(prev => ({
          ...prev,
          lora_sender_connected: false,
          lora_receiver_connected: false,
          crypto_initialized: false
        }));
      }
    };

    // Vérification initiale
    checkHealth();

    // Vérification périodique
    const interval = setInterval(checkHealth, 5000);

    return () => clearInterval(interval);
  }, []);

  // Charger les ports disponibles au démarrage
  useEffect(() => {
    const loadPorts = async () => {
      try {
        const response = await ApiService.getAvailablePorts();
        setSystemInfo(prev => ({ ...prev, availablePorts: response.ports }));
      } catch (error) {
        console.error('Erreur de chargement des ports:', error);
      }
    };

    loadPorts();
  }, []);

  // Charger l'historique des messages
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await ApiService.getMessageHistory();
        setMessages(response.messages);
      } catch (error) {
        console.error('Erreur de chargement de l\'historique:', error);
      }
    };

    loadHistory();
  }, []);

  const handleLoRaConnect = async (senderPort, receiverPort, baudrate) => {
    try {
      await ApiService.connectLoRa(senderPort, receiverPort, baudrate);
      setConnectionStatus(prev => ({
        ...prev,
        lora_sender_connected: true,
        lora_receiver_connected: true
      }));
      return true;
    } catch (error) {
      console.error('Erreur de connexion LoRa:', error);
      return false;
    }
  };

  const handleLoRaDisconnect = async () => {
    try {
      await ApiService.disconnectLoRa();
      setConnectionStatus(prev => ({
        ...prev,
        lora_sender_connected: false,
        lora_receiver_connected: false
      }));
      return true;
    } catch (error) {
      console.error('Erreur de déconnexion LoRa:', error);
      return false;
    }
  };

  const handleCryptoInit = async (password) => {
    try {
      const response = await ApiService.initCrypto(password);
      setConnectionStatus(prev => ({ ...prev, crypto_initialized: true }));
      setSystemInfo(prev => ({ ...prev, keyFingerprint: response.key_fingerprint }));
      return response;
    } catch (error) {
      console.error('Erreur d\'initialisation crypto:', error);
      throw error;
    }
  };

  const handleCryptoImport = async (keyB64) => {
    try {
      const response = await ApiService.importCryptoKey(keyB64);
      setConnectionStatus(prev => ({ ...prev, crypto_initialized: true }));
      setSystemInfo(prev => ({ ...prev, keyFingerprint: response.fingerprint }));
      return response;
    } catch (error) {
      console.error('Erreur d\'import de clé:', error);
      throw error;
    }
  };

  const handleCryptoExport = async () => {
    try {
      return await ApiService.exportCryptoKey();
    } catch (error) {
      console.error('Erreur d\'export de clé:', error);
      throw error;
    }
  };

  const handleSendMessage = async (message, priority) => {
    setIsSending(true);
    try {
      const result = await ApiService.sendMessageWithRetry(message, priority);
      
      // Retourner le résultat complet avec les logs pour que MessagePanel puisse les traiter
      return result;
    } catch (error) {
      console.error('Erreur d\'envoi de message:', error);
      
      // Laisser MessagePanel gérer l'affichage des erreurs avec les logs
      throw error;
    } finally {
       setIsSending(false);
     }
   };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await ApiService.clearMessageHistory();
      setMessages([]);
      return true;
    } catch (error) {
      console.error('Erreur de suppression de l\'historique:', error);
      return false;
    } finally {
      setIsClearing(false);
    }
  };

  const isFullyConnected = connectionStatus.lora_sender_connected &&
                          connectionStatus.lora_receiver_connected &&
                          connectionStatus.crypto_initialized;

  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Header
        connectionStatus={connectionStatus}
        keyFingerprint={systemInfo.keyFingerprint}
      />
      
      <ChatSettings 
         priority={priority}
         setPriority={setPriority}
         filter={filter}
         setFilter={setFilter}
         onClearHistory={handleClearHistory}
         isClearing={isClearing}
         messageCount={messages.length}
         isConnected={isFullyConnected}
         isFullWidth={isFullWidth}
         setIsFullWidth={setIsFullWidth}
       />

      <div className="main-content">
        <div className={`content-grid ${isFullWidth ? 'full-width-chat' : ''}`}>
          {/* Panneau de connexion - masqué en mode pleine largeur */}
          {!isFullWidth && (
            <div className="panel">
              <ConnectionPanel
                availablePorts={systemInfo.availablePorts}
                connectionStatus={connectionStatus}
                onConnect={handleLoRaConnect}
                onDisconnect={handleLoRaDisconnect}
              />

              <CryptoPanel
                connectionStatus={connectionStatus}
                keyFingerprint={systemInfo.keyFingerprint}
                onInit={handleCryptoInit}
                onImport={handleCryptoImport}
                onExport={handleCryptoExport}
              />
            </div>
          )}

          {/* Panneau de messages */}
          <div className="panel">
            <MessagePanel 
              messages={messages}
              isConnected={isFullyConnected}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearHistory}
              priority={priority}
              setPriority={setPriority}
              filter={filter}
              setFilter={setFilter}
              isSending={isSending}
              isClearing={isClearing}
            />
          </div>
        </div>

        <StatusBar
          connectionStatus={connectionStatus}
          messageCount={messages.length}
          signalInfo={systemInfo.signalInfo}
        />
      </div>
    </div>
  );
}

export default App;
