# LoRa Secure Communication System

Un système de communication LoRa chiffré avec interface web moderne.

## Architecture

```
lora-secure-comm/
├── backend/          # API Python avec chiffrement AES
├── frontend/         # Interface React moderne
├── shared/           # Modules LoRa et utilitaires partagés
└── README.md
```

## Fonctionnalités

- 🔐 **Chiffrement AES-256** pour toutes les communications
- 🌐 **Interface web moderne** avec React
- 📡 **Communication LoRa** bidirectionnelle
- 🔑 **Gestion sécurisée des clés** de chiffrement
-  **Monitoring en temps réel** des messages
- 🛡️ **Authentification** et autorisation

## Installation

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Utilisation

1. Démarrer le backend sur le port 5000
2. Lancer le frontend sur le port 3000
3. Configurer les modules LoRa
4. Générer/importer les clés de chiffrement
5. Commencer la communication sécurisée

## Sécurité

- Chiffrement AES-256-GCM
- Échange de clés sécurisé
- Authentification des messages
- Protection contre les attaques de replay
# Lora-secure-emet-recp
