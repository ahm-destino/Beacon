import os
from Crypto.Cipher import AES

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'
key_candidates = [
    b"cbEA827387CHBMJN", 
    b"iafsawii" * 2,
    b"iafswaiiafsawii",
    b"iafsawiiLimited!" # Just guessing variations
]

def unlock_vault():
    if not os.path.exists(gcont_path): return
    with open(gcont_path, 'rb') as f:
        ciphertext = f.read(1024 * 64)

    print(f"--- The Vault Opener ---")
    
    for key in key_candidates:
        # We need an IV. Common ones: First 16 bytes, block of nulls, or the key itself.
        iv_options = [ciphertext[:16], b'\x00' * 16, key[:16]]
        
        for iv in iv_options:
            if len(iv) != 16: continue
            try:
                cipher = AES.new(key, AES.MODE_CBC, iv)
                dec = cipher.decrypt(ciphertext)
                
                # Check for SQLite header: "SQLite format 3"
                if b"SQLite" in dec:
                    print(f"\n[!!!] GOLDMINE UNLOCKED [!!!]")
                    print(f"Key: {key.decode()}, IV: {iv.hex()}")
                    print(f"Found SQLite Database Signature!")
                    return
                
                # Check for JSON/XML
                if b"Question" in dec or b"origquesno" in dec:
                    print(f"\n[!!!] GOLDMINE UNLOCKED [!!!]")
                    print(f"Key: {key.decode()}, IV: {iv.hex()}")
                    print("Sample:", dec[:200])
                    return
            except: pass

    # If AES fails, try simple XOR with the keys
    for xk in [b"iafsawii", b"cbEA827387CHBMJN"]:
        dec = bytes([ciphertext[i] ^ xk[i % len(xk)] for i in range(len(ciphertext))])
        if b"SQLite" in dec or b"Question" in dec:
            print(f"\n[!!!] GOLDMINE UNLOCKED with XOR [!!!]")
            print(f"XOR Key: {xk.decode()}")
            return

    print("Still locked. Trying machine-specific derivation...")

if __name__ == "__main__":
    unlock_vault()
