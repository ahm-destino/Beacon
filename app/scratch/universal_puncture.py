import os
from Crypto.Cipher import AES

# Target: Agricultural Science 2009.tdx
tdx_file = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\rep\data\em1\theory\Agricultural Science\2009.tdx'
key_str = "cbEA827387CHBMJN"
key = key_str.encode('ascii')

def universal_puncture():
    if not os.path.exists(tdx_file): return
    
    with open(tdx_file, 'rb') as f:
        ciphertext = f.read(1024 * 16) # Read 16KB sample
        
    print(f"--- UNIVERSAL PUNCTURE: TRADING KEY {key_str} ---")
    
    # Test 1: Key as Key, 16 zeros as IV
    try:
        cipher = AES.new(key, AES.MODE_CBC, b'\x00' * 16)
        plaintext = cipher.decrypt(ciphertext)
        if b"<?xml" in plaintext or b"<subject" in plaintext:
            print("!!! BINGO! Key + Zero IV worked!")
            print(f"Sample: {plaintext[:100].decode('utf-8', errors='ignore')}")
            return
    except: pass

    # Test 2: Key as Key, Key as IV
    try:
        cipher = AES.new(key, AES.MODE_CBC, key)
        plaintext = cipher.decrypt(ciphertext)
        if b"<?xml" in plaintext or b"<subject" in plaintext:
            print("!!! BINGO! Key + Self IV worked!")
            print(f"Sample: {plaintext[:100].decode('utf-8', errors='ignore')}")
            return
    except: pass

    print("No immediate XML lock-pop. The data might be Zlib compressed.")

if __name__ == "__main__":
    universal_puncture()
