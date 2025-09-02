import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Configuration pour le développement
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 LoRa Secure Communication - Mode Développement');
  console.log('📡 Backend API:', process.env.REACT_APP_API_URL || 'http://localhost:5000');
}

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
  console.error('Erreur globale:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejetée:', event.reason);
});

// Créer le root de l'application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendu de l'application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker pour PWA (optionnel)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Fonction utilitaire pour le debugging
if (process.env.NODE_ENV === 'development') {
  window.debugLoRa = {
    version: '1.0.0',
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    buildTime: new Date().toISOString()
  };
}