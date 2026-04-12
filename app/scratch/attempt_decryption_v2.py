import os
import binascii
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'

# These are the high-value candidates we just found
candidates = [
    "FINALCLOSENESS",
    "iafsawii",
    "cbEA827387CHBMJN",
    "testdriller09037770483",
    "iafsawiiLimited!",
    "0123456789ABBSN12345678901234567"
]

def attempt_decryption():
    if not os.path.exists(gcont_path):
        print("Error: gcont.txt not found.")
        return

    with open(gcont_path, 'rb') as f:
        ciphertext = f.read(4096) # Read enough for a header check

    print("--- Starting Decryption Lab (Final Phase) ---")
    
    for c in candidates:
        # Most of these are strings, but we need 16-byte keys for AES
        # If shorter, they often pad with nulls or repeat
        key_bytes = c.encode('ascii')
        if len(key_bytes) < 16:
            key_bytes = key_bytes.ljust(16, b'\x00')
        elif len(key_bytes) > 16:
            key_bytes = key_bytes[:16]

        iv = b'\x00' * 16 # Common default IV
        
        try:
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
            decrypted = cipher.decrypt(ciphertext)
            
            # Look for structured data or the SQLite signature
            if b"SQLite" in decrypted or b"origquesno" in decrypted or b"Question" in decrypted:
                print(f"[SUCCESS] UNLOCKED WITH KEY: {c}")
                print(f"Sample Decrypted Data: {decrypted[:200].hex(' ')}")
                return
            
            # Also try simple XOR for the legacy TestDriller versions
            xor_key = c.encode('ascii')
            xor_dec = bytes([ciphertext[i] ^ xor_key[i % len(xor_key)] for i in range(len(ciphertext))])
            if b"SQLite" in xor_dec or b"Question" in xor_dec or b"origquesno" in xor_dec:
                 print(f"[SUCCESS] UNLOCKED WITH XOR KEY: {c}")
                 print(f"Sample XOR Decrypted Data: {xor_dec[:100].decode('ascii', errors='ignore')}")
                 return
                 
        except Exception:
            pass

    print("Lab complete. Standard keys failed. Calculating machine-derived key...")

if __name__ == "__main__":
    attempt_decryption()
