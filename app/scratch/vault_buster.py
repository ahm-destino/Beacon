import os
from Crypto.Cipher import AES

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'

# These are the high-value candidates we just found
candidates = [
    "FINALCLOSENESS",
    "iafsawii",
    "cbEA827387CHBMJN",
    "testdriller09037770483",
    "0123456789ABBSN12345678901234567"
]

def vault_buster():
    if not os.path.exists(gcont_path):
        print("Error: gcont.txt not found.")
        return

    with open(gcont_path, 'rb') as f:
        ciphertext = f.read(65536) # Read first 64KB

    print("--- Vault Buster Laboratory ---")
    
    for c in candidates:
        key_bytes = c.encode('ascii')
        # Standard AES keys must be 16, 24, or 32 bytes
        # We'll try common padding/truncation
        if len(key_bytes) < 16: key_bytes = key_bytes.ljust(16, b'\x00')
        elif 16 < len(key_bytes) < 24: key_bytes = key_bytes.ljust(24, b'\x00')
        elif 24 < len(key_bytes) < 32: key_bytes = key_bytes.ljust(32, b'\x00')
        else: key_bytes = key_bytes[:32]

        iv = b'\x00' * 16 # Test null IV
        try:
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
            dec = cipher.decrypt(ciphertext)
            if b"origquesno" in dec or b"SQLite" in dec or b"Question" in dec:
                print(f"[!!!] SUCCESS! UNLOCKED WITH: {c}")
                print(f"Data Preview: {dec[:200].decode('ascii', errors='ignore')}")
                return
        except: pass

        # Try XOR (TestDriller often uses custom XOR)
        xor_key = c.encode('ascii')
        dec_xor = bytes([ciphertext[i] ^ xor_key[i % len(xor_key)] for i in range(len(ciphertext))])
        if b"origquesno" in dec_xor or b"Question" in dec_xor or b"SQLite" in dec_xor:
            print(f"[!!!] SUCCESS (XOR)! UNLOCKED WITH: {c}")
            print(f"Data Preview: {dec_xor[:200].decode('ascii', errors='ignore')}")
            return

    print("Still locked. Analyzing for machine-dependent bytes...")

if __name__ == "__main__":
    vault_buster()
