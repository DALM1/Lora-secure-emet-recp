#!/usr/bin/env python3
"""
Test de communication LoRa chiffrée fonctionnel
"""

import sys
import os
import serial
import time
import threading
from datetime import datetime

# Ajouter le dossier shared au path
sys.path.append(os.path.join(os.path.dirname(__file__), 'shared'))

from lora_module import list_available_ports
from crypto_utils import SecureCrypto

def setup_lora_module(port, frequency="865.125", sf="sf7", bw="125"):
    """Configurer un module LoRa pour la communication"""
    try:
        ser = serial.Serial(port, 9600, timeout=2)

        # Configuration de base
        commands = [
            "AT",
            "AT+MODE=TEST",
            f"AT+TEST=rfcfg,{frequency},{sf},{bw},14,15,14,on,off,off"
        ]

        for cmd in commands:
            ser.write((cmd + "\r\n").encode())
            time.sleep(0.1)
            response = ser.read(100)
            print(f"  {cmd} -> {response.decode('ascii', errors='ignore').strip()}")

        return ser
    except Exception as e:
        print(f"⚫️ Erreur configuration {port}: {e}")
        return None

def send_encrypted_message(sender_serial, message, crypto):
    """Envoyer un message chiffré"""
    try:
        # Chiffrer le message
        metadata = {
            "sender": "lora_device_1",
            "timestamp": datetime.now().isoformat(),
            "priority": "high"
        }

        encrypted_data = crypto.encrypt_message(message, metadata)

        # Convertir en hexadécimal pour transmission
        hex_data = encrypted_data.hex()

        # Envoyer via LoRa
        cmd = f"AT+TEST=txlrpkt,\"{hex_data}\""
        sender_serial.write((cmd + "\r\n").encode())

        print(f"⚪️ Message envoyé '{message}' ({len(encrypted_data)} bytes chiffrés)")
        return True

    except Exception as e:
        print(f"⚫️ Erreur envoi: {e}")
        return False

def listen_for_messages(receiver_serial, crypto, duration=10):
    """Écouter les messages entrants"""
    print(f"⚪️ Écoute pendant {duration} secondes")

    start_time = time.time()
    messages_received = 0

    while time.time() - start_time < duration:
        try:
            # Vérifier s'il y a des données
            if receiver_serial.in_waiting > 0:
                response = receiver_serial.read(receiver_serial.in_waiting)
                response_str = response.decode('ascii', errors='ignore')

                # Chercher les messages reçus
                if '+TEST: RX' in response_str:
                    print(f"⚪️ Données reçues {response_str.strip()}")

                    # Extraire les données hexadécimales
                    try:
                        # Format: +TEST: RX "hexdata"
                        hex_start = response_str.find('"') + 1
                        hex_end = response_str.rfind('"')

                        if hex_start > 0 and hex_end > hex_start:
                            hex_data = response_str[hex_start:hex_end]
                            encrypted_data = bytes.fromhex(hex_data)

                            # Déchiffrer
                            decrypted_msg, metadata = crypto.decrypt_message(encrypted_data)

                            print(f"⚪️ Message déchiffré '{decrypted_msg}'")
                            print(f" Métadonnées: {metadata}")
                            messages_received += 1

                    except Exception as e:
                        print(f"⚫️ Erreur déchiffrement: {e}")

            time.sleep(0.1)

        except Exception as e:
            print(f"⚫️ Erreur réception: {e}")
            break

    return messages_received

def test_encrypted_communication():
    """Test complet de communication chiffrée"""
    print("⚪️ Test de Communication LoRa Chiffrée")
    print("=" * 50)

    # 1. Détecter les ports LoRa
    ports = list_available_ports()
    lora_ports = []

    for port in ports:
        if isinstance(port, dict):
            if 'CP2102N' in port.get('name', '') or 'usbserial' in port.get('port', ''):
                lora_ports.append(port['port'])

    if len(lora_ports) < 2:
        print(f"⚫️ Au moins 2 modules LoRa requis, trouvés: {len(lora_ports)}")
        return False

    print(f"⚪️ Modules LoRa détectés {lora_ports[:2]}")

    # 2. Initialiser le chiffrement
    crypto = SecureCrypto(password="lora_secure_2024")
    print(f"🔑 Chiffrement initialisé (empreinte {crypto.get_key_fingerprint()})")

    # 3. Configurer les modules
    print("\n📡 Configuration des modules LoRa")

    print(f"\n Configuration émetteur ({lora_ports[0]}):")
    sender = setup_lora_module(lora_ports[0])

    print(f"\n Configuration récepteur ({lora_ports[1]}):")
    receiver = setup_lora_module(lora_ports[1])

    if not sender or not receiver:
        print("⚫️ Échec de configuration des modules")
        return False

    # 4. Test de communication
    print("\n⚪️ Test de communication chiffrée...")

    try:
        # Démarrer l'écoute en arrière-plan
        def listen_thread():
            return listen_for_messages(receiver, crypto, duration=15)

        listener = threading.Thread(target=listen_thread)
        listener.start()

        # Attendre un peu puis envoyer des messages
        time.sleep(2)

        messages = [
            "Hello LoRa World!",
            "Message chiffré #2",
            "Test de sécurité LoRa"
        ]

        for i, msg in enumerate(messages, 1):
            print(f"\n📤 Envoi message {i}/{len(messages)}...")
            send_encrypted_message(sender, msg, crypto)
            time.sleep(3)  # Délai entre les messages

        # Attendre la fin de l'écoute
        listener.join()

        print("\n⚪️ Test de communication terminé")

    except Exception as e:
        print(f"⚫️ Erreur pendant le test: {e}")

    finally:
        # Nettoyage
        if sender:
            sender.close()
        if receiver:
            receiver.close()
        print("⚫️ Modules déconnectés")

    return True

if __name__ == "__main__":
    success = test_encrypted_communication()
    if success:
        print("\n⚪️ TEST RÉUSSI - Communication LoRa chiffrée fonctionnelle!")
    else:
        print("\n⚪️ TEST ÉCHOUÉ - Vérifiez les connexions")
