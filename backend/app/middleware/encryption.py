import base64
import logging
from cryptography.fernet import Fernet
from app.config import settings

logger = logging.getLogger(__name__)

class FieldEncryptor:
    def __init__(self):
        key = settings.DB_ENCRYPTION_KEY
        try:
            if isinstance(key, str):
                key = key.encode()
            # Fernet key must be 32 url-safe base64 bytes
            self.cipher = Fernet(key)
            self.enabled = settings.ENABLE_FIELD_ENCRYPTION
        except Exception as e:
            logger.warning(f"Encryption key invalid or not provided, generating fallback key for session. Error: {e}")
            fallback_key = Fernet.generate_key()
            self.cipher = Fernet(fallback_key)
            self.enabled = False

    def encrypt(self, text: str) -> str:
        if not text or not self.enabled:
            return text
        try:
            encrypted_bytes = self.cipher.encrypt(text.encode('utf-8'))
            return f"enc::{encrypted_bytes.decode('utf-8')}"
        except Exception as e:
            logger.error(f"Error encrypting field: {e}")
            return text

    def decrypt(self, text: str) -> str:
        if not text:
            return text
        if isinstance(text, str) and text.startswith("enc::"):
            try:
                raw_token = text.replace("enc::", "").encode('utf-8')
                decrypted_bytes = self.cipher.decrypt(raw_token)
                return decrypted_bytes.decode('utf-8')
            except Exception as e:
                logger.error(f"Error decrypting field: {e}")
                return text
        return text

encryptor = FieldEncryptor()
