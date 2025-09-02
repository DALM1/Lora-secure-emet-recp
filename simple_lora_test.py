#!/usr/bin/env python3
"""
Test simple de connexion aux modules LoRa
"""

import sys
import os
import serial
import time

# Ajouter le dossier shared au path
sys.path.append(os.path.join(os.path.dirname(__file__), 'shared'))

from lora_module import list_available_ports

def test_simple_connection():
    """Test simple de connexion série"""
    print("🚀 Test Simple de Connexion LoRa")
    print("=" * 40)

    # Lister les ports
    ports = list_available_ports()
    print("\n📡 Ports série disponibles:")
    for i, port in enumerate(ports, 1):
        if isinstance(port, dict):
            print(f"  {i}. {port['name']} ({port['port']}) - {port['hwid']}")

    # Trouver les ports LoRa
    lora_ports = []
    for port in ports:
        if isinstance(port, dict):
            if 'CP2102N' in port.get('name', '') or 'usbserial' in port.get('port', ''):
                lora_ports.append(port['port'])

    print(f"\n🔍 Ports LoRa détectés: {len(lora_ports)}")
    for port in lora_ports:
        print(f"  - {port}")

    if len(lora_ports) < 2:
        print("⚫️ Au moins 2 modules LoRa requis")
        return False

    # Test de connexion simple
    for i, port in enumerate(lora_ports[:2]):
        print(f"\n📡 Test connexion sur {port}...")
        try:
            # Connexion série simple
            ser = serial.Serial(port, 9600, timeout=2)
            print(f"⚪️ Connexion série réussie sur {port}")

            # Test d'écriture simple
            ser.write(b"AT\r\n")
            time.sleep(0.1)

            # Lecture de la réponse
            response = ser.read(100)
            if response:
                print(f" Réponse reçue: {response}")
            else:
                print("📭 Aucune réponse reçue")

            ser.close()
            print(f"⚪️ Test terminé pour {port}")

        except Exception as e:
            print(f"⚫️ Erreur sur {port}: {e}")

    return True

if __name__ == "__main__":
    test_simple_connection()
