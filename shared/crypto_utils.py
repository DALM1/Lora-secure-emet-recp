from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256
import base64
import json
import hashlib
import time
from typing import Tuple, Dict, Any

class SecureCrypto:
    """Classe pour gérer le chiffrement/déchiffrement sécurisé"""

    def __init__(self, password: str = None, key: bytes = None):
        if key:
            self.key = key
        elif password:
            # Dériver une clé à partir du mot de passe
            salt = b'lora_secure_salt_2024'  # En production, utiliser un salt aléatoire
            self.key = PBKDF2(password, salt, 32, count=100000, hmac_hash_module=SHA256)
        else:
            # Générer une clé aléatoire
            self.key = get_random_bytes(32)

    def encrypt_message(self, plaintext: str, metadata: Dict[str, Any] = None) -> bytes:
        """Chiffrer un message avec métadonnées"""
        # Préparer le payload
        payload = {
            "message": plaintext,
            "timestamp": int(time.time()),
            "metadata": metadata or {}
        }

        # Convertir en JSON puis en bytes
        json_data = json.dumps(payload, ensure_ascii=False).encode('utf-8')

        # Générer un nonce aléatoire
        nonce = get_random_bytes(12)

        # Chiffrer avec AES-GCM
        cipher = AES.new(self.key, AES.MODE_GCM, nonce=nonce)
        ciphertext, auth_tag = cipher.encrypt_and_digest(json_data)

        # Combiner nonce + auth_tag + ciphertext
        encrypted_data = nonce + auth_tag + ciphertext

        return encrypted_data

    def decrypt_message(self, encrypted_data: bytes) -> Tuple[str, Dict[str, Any]]:
        """Déchiffrer un message et extraire les métadonnées"""
        try:
            # Extraire les composants
            nonce = encrypted_data[:12]
            auth_tag = encrypted_data[12:28]
            ciphertext = encrypted_data[28:]

            # Déchiffrer
            cipher = AES.new(self.key, AES.MODE_GCM, nonce=nonce)
            json_data = cipher.decrypt_and_verify(ciphertext, auth_tag)

            # Parser le JSON
            payload = json.loads(json_data.decode('utf-8'))

            return payload["message"], payload.get("metadata", {})

        except Exception as e:
            raise Exception(f"Erreur de déchiffrement: {e}")

    def generate_key_pair(self) -> Tuple[str, str]:
        """Générer une paire de clés (publique/privée) pour l'échange"""
        # Pour simplifier, on utilise des clés symétriques
        # En production, utiliser RSA ou ECDH
        private_key = get_random_bytes(32)
        public_key = hashlib.sha256(private_key).digest()

        return (
            base64.b64encode(public_key).decode('ascii'),
            base64.b64encode(private_key).decode('ascii')
        )

    def get_key_fingerprint(self) -> str:
        """Obtenir l'empreinte de la clé actuelle"""
        return hashlib.sha256(self.key).hexdigest()[:16]

    def export_key(self) -> str:
        """Exporter la clé en base64"""
        return base64.b64encode(self.key).decode('ascii')

    @classmethod
    def import_key(cls, key_b64: str) -> 'SecureCrypto':
        """Importer une clé depuis base64"""
        key = base64.b64decode(key_b64.encode('ascii'))
        return cls(key=key)

class MessageValidator:
    """Classe pour valider l'intégrité des messages"""

    def __init__(self):
        self.seen_messages = set()
        self.max_age = 300  # 5 minutes

    def validate_message(self, message: str, metadata: Dict[str, Any]) -> bool:
        """Valider un message (anti-replay, fraîcheur)"""
        # Vérifier l'âge du message
        timestamp = metadata.get("timestamp", 0)
        current_time = int(time.time())

        if current_time - timestamp > self.max_age:
            return False

        # Vérifier les doublons (anti-replay)
        message_hash = hashlib.sha256(f"{message}{timestamp}".encode()).hexdigest()

        if message_hash in self.seen_messages:
            return False

        self.seen_messages.add(message_hash)

        # Nettoyer les anciens hashes
        if len(self.seen_messages) > 1000:
            self.seen_messages.clear()

        return True

def generate_secure_password(length: int = 16) -> str:
    """Générer un mot de passe sécurisé"""
    import string
    import secrets

    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def test_crypto():
    """Tester les fonctions de chiffrement"""
    # Test basique
    crypto = SecureCrypto(password="test123")

    message = "Hello, LoRa World!"
    metadata = {"sender": "device_1", "priority": "high"}

    # Chiffrer
    encrypted = crypto.encrypt_message(message, metadata)
    print(f"Message chiffré: {len(encrypted)} bytes")

    # Déchiffrer
    decrypted_msg, decrypted_meta = crypto.decrypt_message(encrypted)
    print(f"Message déchiffré: {decrypted_msg}")
    print(f"Métadonnées: {decrypted_meta}")

    # Vérifier
    assert message == decrypted_msg
    assert metadata["sender"] == decrypted_meta["sender"]

    print("⚪️ Test de chiffrement réussi!")

if __name__ == "__main__":
    test_crypto()
