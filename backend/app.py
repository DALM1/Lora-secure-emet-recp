from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import sys
import threading
import time
from datetime import datetime

# Ajouter le dossier shared au path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

from lora_module import LoRaDevice, list_available_ports, test_lora_connection
from crypto_utils import SecureCrypto, MessageValidator, generate_secure_password

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Variables globales
lora_sender = None
lora_receiver = None
crypto = None
validator = MessageValidator()
message_history = []
is_listening = False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de l'état du serveur"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'lora_sender_connected': lora_sender.is_connected if lora_sender else False,
        'lora_receiver_connected': lora_receiver.is_connected if lora_receiver else False,
        'crypto_initialized': crypto is not None
    })

@app.route('/api/ports', methods=['GET'])
def get_available_ports():
    """Obtenir la liste des ports série disponibles"""
    try:
        ports = list_available_ports()
        return jsonify({'ports': ports})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lora/connect', methods=['POST'])
def connect_lora():
    """Connecter les modules LoRa"""
    global lora_sender, lora_receiver

    try:
        data = request.get_json()
        sender_port = data.get('sender_port')
        receiver_port = data.get('receiver_port')
        baudrate = data.get('baudrate', 9600)

        if not sender_port or not receiver_port:
            return jsonify({'error': 'Ports manquants'}), 400

        # Connecter l'émetteur
        lora_sender = LoRaDevice(sender_port, baudrate)
        if not lora_sender.connect():
            return jsonify({'error': 'Impossible de connecter l\'émetteur'}), 500

        # Connecter le récepteur
        lora_receiver = LoRaDevice(receiver_port, baudrate)
        if not lora_receiver.connect():
            lora_sender.disconnect()
            return jsonify({'error': 'Impossible de connecter le récepteur'}), 500

        # Démarrer l'écoute
        start_listening()

        return jsonify({
            'message': 'Modules LoRa connectés avec succès',
            'sender_port': sender_port,
            'receiver_port': receiver_port
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lora/disconnect', methods=['POST'])
def disconnect_lora():
    """Déconnecter les modules LoRa"""
    global lora_sender, lora_receiver, is_listening

    try:
        is_listening = False

        # Reset des modules avant déconnexion
        if lora_sender and lora_sender.is_connected:
            try:
                lora_sender._send_command("ATZ")  # Commande de reset
                time.sleep(0.5)  # Attendre le reset
            except Exception as reset_error:
                print(f"Erreur reset émetteur: {reset_error}")
            lora_sender.disconnect()
            lora_sender = None

        if lora_receiver and lora_receiver.is_connected:
            try:
                lora_receiver._send_command("ATZ")  # Commande de reset
                time.sleep(0.5)  # Attendre le reset
            except Exception as reset_error:
                print(f"Erreur reset récepteur: {reset_error}")
            lora_receiver.disconnect()
            lora_receiver = None

        return jsonify({'message': 'Modules LoRa déconnectés et réinitialisés'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crypto/init', methods=['POST'])
def init_crypto():
    """Initialiser le système de chiffrement"""
    global crypto

    try:
        data = request.get_json()
        password = data.get('password')

        if not password:
            # Générer un mot de passe aléatoire
            password = generate_secure_password()

        crypto = SecureCrypto(password=password)

        return jsonify({
            'message': 'Chiffrement initialisé',
            'key_fingerprint': crypto.get_key_fingerprint(),
            'generated_password': password if not data.get('password') else None
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crypto/export', methods=['GET'])
def export_crypto_key():
    """Exporter la clé de chiffrement"""
    if not crypto:
        return jsonify({'error': 'Chiffrement non initialisé'}), 400

    try:
        return jsonify({
            'key': crypto.export_key(),
            'fingerprint': crypto.get_key_fingerprint()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crypto/import', methods=['POST'])
def import_crypto_key():
    """Importer une clé de chiffrement"""
    global crypto

    try:
        data = request.get_json()
        key_b64 = data.get('key')

        if not key_b64:
            return jsonify({'error': 'Clé manquante'}), 400

        crypto = SecureCrypto.import_key(key_b64)

        return jsonify({
            'message': 'Clé importée avec succès',
            'fingerprint': crypto.get_key_fingerprint()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/send', methods=['POST'])
def send_message():
    """Envoyer un message chiffré"""
    if not lora_sender or not lora_sender.is_connected:
        return jsonify({'error': 'Émetteur LoRa non connecté'}), 400

    if not crypto:
        return jsonify({'error': 'Chiffrement non initialisé'}), 400

    try:
        data = request.get_json()
        message = data.get('message', '')
        priority = data.get('priority', 'normal')

        if not message:
            return jsonify({'error': 'Message vide'}), 400

        # Métadonnées
        metadata = {
            'sender': 'web_interface',
            'priority': priority,
            'timestamp': int(time.time())
        }

        # Chiffrer le message
        encrypted_data = crypto.encrypt_message(message, metadata)

        # Envoyer via LoRa
        success = lora_sender.send_data(encrypted_data)

        if success:
            # Ajouter à l'historique
            message_entry = {
                'id': len(message_history) + 1,
                'message': message,
                'direction': 'sent',
                'timestamp': datetime.now().isoformat(),
                'metadata': metadata,
                'encrypted_size': len(encrypted_data)
            }
            message_history.append(message_entry)

            # Notifier via WebSocket
            socketio.emit('message_sent', message_entry)

            return jsonify({
                'message': 'Message envoyé avec succès',
                'encrypted_size': len(encrypted_data)
            })
        else:
            return jsonify({'error': 'Échec de l\'envoi'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/history', methods=['GET'])
def get_message_history():
    """Obtenir l'historique des messages"""
    return jsonify({'messages': message_history})

@app.route('/api/messages/clear', methods=['POST'])
def clear_message_history():
    """Effacer l'historique des messages"""
    global message_history
    message_history = []
    socketio.emit('history_cleared')
    return jsonify({'message': 'Historique effacé'})

@app.route('/api/messages/stats', methods=['GET'])
def get_message_stats():
    """Obtenir les statistiques des messages"""
    sent_count = len([msg for msg in message_history if msg['direction'] == 'sent'])
    received_count = len([msg for msg in message_history if msg['direction'] == 'received'])

    return jsonify({
        'total_messages': len(message_history),
        'sent_messages': sent_count,
        'received_messages': received_count,
        'connection_status': {
            'sender_connected': lora_sender is not None and lora_sender.is_connected,
            'receiver_connected': lora_receiver is not None and lora_receiver.is_connected,
            'crypto_initialized': crypto is not None
        }
    })

def start_listening():
    """Démarrer l'écoute des messages LoRa"""
    global is_listening

    if is_listening:
        return

    is_listening = True

    def listen_loop():
        global is_listening
        print("🎧 Thread d'écoute LoRa démarré")

        while is_listening and lora_receiver and lora_receiver.is_connected:
            try:
                # Recevoir des données
                encrypted_data = lora_receiver.receive_data(timeout=1.0)

                if encrypted_data:
                    print(f"📡 Données reçues: {len(encrypted_data)} bytes")
                    if crypto:
                        try:
                            # Déchiffrer le message
                            message, metadata = crypto.decrypt_message(encrypted_data)
                            print(f"🔓 Message déchiffré: {message}")

                            # Valider le message
                            if validator.validate_message(message, metadata):
                                # Ajouter à l'historique
                                message_entry = {
                                    'id': len(message_history) + 1,
                                    'message': message,
                                    'direction': 'received',
                                    'timestamp': datetime.now().isoformat(),
                                    'metadata': metadata,
                                    'encrypted_size': len(encrypted_data),
                                    'signal_info': lora_receiver.get_signal_info()
                                }
                                message_history.append(message_entry)
                                print(f"⚪️ Message ajouté à l'historique: {message}")

                                # Notifier via WebSocket
                                socketio.emit('message_received', message_entry)

                        except Exception as decrypt_error:
                            print(f"⚫️ Erreur de déchiffrement: {decrypt_error}")
                    else:
                        print("⚠️ Crypto non initialisé")

            except Exception as e:
                if is_listening:  # Ne pas afficher l'erreur si on arrête volontairement
                    print(f"⚫️ Erreur d'écoute: {e}")
                time.sleep(0.1)

    # Démarrer le thread d'écoute
    listen_thread = threading.Thread(target=listen_loop, daemon=True)
    listen_thread.start()

@socketio.on('connect')
def handle_connect():
    """Gestion de la connexion WebSocket"""
    emit('connected', {'message': 'Connecté au serveur LoRa'})

@socketio.on('disconnect')
def handle_disconnect():
    """Gestion de la déconnexion WebSocket"""
    print('Client déconnecté')

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

    print(f" Serveur LoRa sécurisé démarré sur le port {port}")
    print(f"📡 Interface web: http://localhost:{port}")

    socketio.run(app, host='0.0.0.0', port=port, debug=debug)
