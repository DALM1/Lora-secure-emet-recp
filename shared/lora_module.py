from serial import Serial
import serial.tools.list_ports
from threading import Thread, Event
from time import sleep
import time
import struct

class LoRaDevice:
    """Classe pour gérer un module LoRa"""
    
    def __init__(self, port: str, baudrate: int = 9600):
        self.port = port
        self.baudrate = baudrate
        self.serial: Serial = None
        self.is_connected = False
        
    def connect(self, timeout: float = 1.0) -> bool:
        """Connecter au module LoRa"""
        try:
            self.serial = Serial(self.port, self.baudrate, timeout=timeout)
            self.serial.write("\r\n".encode("ascii"))
            sleep(0.05)  # Réduit le délai d'attente
            
            # Marquer comme connecté avant les tests de communication
            self.is_connected = True
            
            # Test de communication avec timeouts réduits
            self._send_command("AT", timeout=0.5)
            self._send_command("AT+MODE=TEST", timeout=0.5)
            self._send_command("AT+TEST=rfcfg,865.125,sf7,125,14,15,14,on,off,off", timeout=1.0)
            
            return True
            
        except Exception as e:
            print(f"Erreur de connexion LoRa: {e}")
            self.is_connected = False
            if hasattr(self, 'serial') and self.serial and self.serial.is_open:
                self.serial.close()
            return False
    
    def disconnect(self):
        """Déconnecter le module LoRa"""
        if self.serial and self.serial.is_open:
            self.serial.close()
        self.is_connected = False
    
    def _send_command(self, cmd: str, timeout: float = None) -> str:
        """Envoyer une commande AT et recevoir la réponse"""
        if not self.is_connected or not self.serial:
            raise Exception("Module LoRa non connecté")
            
        # Envoyer la commande
        self.serial.write((cmd + "\r\n").encode("ascii"))
        
        # Recevoir la réponse
        response = self.serial.read_until(b"\r\n").decode("ascii", errors="ignore")[:-2]
        
        # Vérifier les erreurs
        if "ERROR" in response:
            raise Exception(f"Erreur LoRa: {response}")
            
        return response
    
    def send_data(self, data: bytes) -> bool:
        """Envoyer des données via LoRa"""
        try:
            hex_data = data.hex().upper()
            self._send_command(f'AT+TEST=TXLRPKT,"{hex_data}"')
            return True
        except Exception as e:
            print(f"Erreur d'envoi: {e}")
            return False
    
    def receive_data(self, timeout: float = 1.0) -> bytes:
        """Recevoir des données via LoRa"""
        try:
            # Mettre le module en mode réception continue
            self._send_command("AT+TEST=RXLRPKT")
            
            # Attendre les données avec timeout
            self.serial.timeout = timeout
            
            # Lire jusqu'à trouver une ligne avec des données
            start_time = time.time()
            while time.time() - start_time < timeout:
                try:
                    line = self.serial.read_until(b"\r\n").decode("ascii", errors="ignore").strip()
                    
                    # Chercher les lignes contenant des données reçues
                    if "+TEST: RX" in line and '"' in line:
                        # Extraire les données hexadécimales
                        start = line.find('"') + 1
                        end = line.rfind('"')
                        if start > 0 and end > start:
                            hex_data = line[start:end]
                            if hex_data:  # Vérifier que les données ne sont pas vides
                                return bytes.fromhex(hex_data)
                    
                except Exception as read_error:
                    continue
                    
            return b""  # Timeout atteint
            
        except Exception as e:
            print(f"Erreur de réception: {e}")
            return b""
    
    def get_signal_info(self) -> dict:
        """Obtenir les informations du signal (RSSI, SNR)"""
        # Cette information est généralement dans les métadonnées de réception
        # Pour l'instant, retourner des valeurs par défaut
        return {
            "rssi": -50,
            "snr": 10,
            "frequency": 865.125
        }

def list_available_ports() -> list:
    """Lister les ports série disponibles"""
    ports = []
    devices = serial.tools.list_ports.comports()
    
    for device in devices:
        ports.append({
            "port": device.device,
            "name": device.description,
            "hwid": device.hwid
        })
    
    return sorted(ports, key=lambda x: x["port"])

def test_lora_connection(port: str, baudrate: int = 9600) -> bool:
    """Tester la connexion à un module LoRa"""
    device = LoRaDevice(port, baudrate)
    success = device.connect()
    device.disconnect()
    return success