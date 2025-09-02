#!/usr/bin/env python3
"""
Script de test pour la communication LoRa chiffrée
Ce script teste la communication entre les modules LoRa avec chiffrement AES
"""

import sys
import os
import time
import threading
from datetime import datetime

# Ajouter le dossier shared au path
sys.path.append(os.path.join(os.path.dirname(__file__), 'shared'))

from lora_module import LoRaDevice, list_available_ports
from crypto_utils import SecureCrypto, test_crypto

def test_lora_communication():
    """
    Test complet de la communication LoRa chiffrée
    """
    print("⚪️ Test de Communication LoRa Chiffrée")
    print("=" * 50)

    # 1. Lister les ports disponibles
    print("\n📡 Ports série disponibles")
    ports = list_available_ports()
    for i, port in enumerate(ports):
        if isinstance(port, dict):
            print(f"  {i+1}. {port['name']} ({port['port']}) - {port['hwid']}")
        else:
            print(f"  {i+1}. {port}")

    if len(ports) < 2:
        print("⚫️ Erreur: Au moins 2 ports série sont nécessaires pour le test")
        return False

    # 2. Test du système de chiffrement
    print("\n⚪️ Test du système de chiffrement")
    try:
        test_crypto()
    except Exception as e:
        print(f"⚫️ Erreur de chiffrement: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    print("⚪️ Système de chiffrement OK")

    # 3. Initialisation du chiffrement
    print("\n🔑 Initialisation du chiffrement...")
    crypto = SecureCrypto(password="lora_secure_2024")
    print(f"Empreinte de clé: {crypto.get_key_fingerprint()}")

    # 4. Configuration des modules LoRa
    # Utiliser les ports LoRa détectés (CP2102N)
    lora_ports = []
    for port in ports:
        if isinstance(port, dict):
            # Vérifier si c'est un port CP2102N (module LoRa)
            if 'CP2102N' in port.get('name', '') or 'usbserial' in port.get('port', ''):
                lora_ports.append(port['port'])

    if len(lora_ports) < 2:
        print(f"⚫️ Erreur: Au moins 2 modules LoRa requis, trouvés: {len(lora_ports)}")
        print("Ports LoRa détectés:")
        for port in lora_ports:
            print(f"  - {port}")
        return False

    sender_port = lora_ports[0]
    receiver_port = lora_ports[1]

    print(f"\n⚪️ Configuration émetteur sur {sender_port}")
    print(f"⚪️ Configuration récepteur sur {receiver_port}")

    sender = LoRaDevice(sender_port)
    receiver = LoRaDevice(receiver_port)

    try:
        # Connexion des modules
        if not sender.connect(sender_port):
            print(f"⚫️ Impossible de connecter l'émetteur sur {sender_port}")
            return False
        print("⚪️ Émetteur connecté")

        if not receiver.connect(receiver_port):
            print(f"⚫️ Impossible de connecter le récepteur sur {receiver_port}")
            sender.disconnect()
            return False
        print("⚪️ Récepteur connecté")

        # 5. Test de communication
        print("\n📡 Test de communication chiffrée...")

        # Messages de test
        test_messages = [
            "Hello LoRa World!",
            "Test de chiffrement AES-256",
            "Communication sécurisée établie ⚪️",
            "Message avec émojis",
            "Test de message plus long pour vérifier la capacité de transmission des données chiffrées"
        ]

        received_messages = []

        def message_receiver():
            """Thread pour recevoir les messages"""
            for _ in range(len(test_messages)):
                try:
                    encrypted_data = receiver.receive_data(timeout=10)
                    if encrypted_data:
                        # Déchiffrer le message
                        decrypted_message = crypto.decrypt_message(encrypted_data)
                        if decrypted_message:
                            received_messages.append(decrypted_message)
                            print(f"⚪️ Reçu {decrypted_message}")
                        else:
                            print("⚫️ Échec du déchiffrement")
                    else:
                        print("⚪️ Timeout - Aucun message reçu")
                except Exception as e:
                    print(f"⚫️ Erreur de réception: {e}")

        # Démarrer le thread de réception
        receiver_thread = threading.Thread(target=message_receiver)
        receiver_thread.start()

        # Attendre un peu avant d'envoyer
        time.sleep(2)

        # Envoyer les messages de test
        for i, message in enumerate(test_messages):
            print(f"📤 Envoi {i+1}/{len(test_messages)}: {message}")

            # Chiffrer le message
            encrypted_data = crypto.encrypt_message(message)
            if encrypted_data:
                success = sender.send_data(encrypted_data)
                if success:
                    print(f"⚪️ Message {i+1} envoyé avec succès")
                else:
                    print(f"⚫️ Échec envoi message {i+1}")
            else:
                print(f"⚫️ Échec chiffrement message {i+1}")

            time.sleep(3)  # Attendre entre les envois

        # Attendre la fin de la réception
        receiver_thread.join(timeout=30)

        # 6. Vérification des résultats
        print("\n Résultats du test")
        print(f"Messages envoyés {len(test_messages)}")
        print(f"Messages reçus {len(received_messages)}")

        success_rate = len(received_messages) / len(test_messages) * 100
        print(f"Taux de succès {success_rate:.1f}%")

        if success_rate >= 80:
            print("⚪️ Test de communication réussi")
            return True
        else:
            print("⚠️ Test de communication partiellment réussi")
            return False

    except Exception as e:
        print(f"⚫️ Erreur durant le test {e}")
        return False

    finally:
        # Nettoyage
        print("\n⚪️ Nettoyage")
        sender.disconnect()
        receiver.disconnect()
        print("⚪️ Modules déconnectés")

def main():
    """
    Fonction principale
    """
    print(f"Début du test: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        success = test_lora_communication()

        print("\n" + "=" * 50)
        if success:
            print("⚪️ TEST GLOBAL RÉUSSI")
            print("Le système de communication LoRa chiffrée fonctionne correctement.")
        else:
            print("⚫️ TEST GLOBAL ÉCHOUÉ")
            print("Vérifiez les connexions et la configuration des modules LoRa.")

    except KeyboardInterrupt:
        print("\n⏹ Test interrompu par l'utilisateur")
    except Exception as e:
        print(f"\n💥 Erreur critique {e}")

    print(f"\nFin du test {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
