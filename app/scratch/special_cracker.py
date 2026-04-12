import os

tdx_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\rep\data\em1\theory\Agricultural Science\2009.tdx'

# Our top candidate keys from the pool
keys = [
    "cbEA827387CHBMJN",
    "FINALCLOSENESS",
    "iafsawii",
    "testdriller09037770483"
]

def special_cracker():
    if not os.path.exists(tdx_path): return
    with open(tdx_path, 'rb') as f:
        ciphertext = f.read(1024 * 32) # 32KB

    print("--- TESTDRILLER SPECIAL CRACKER (Rolling XOR) ---")
    
    for k in keys:
        key = k.encode('ascii')
        # TestDriller Rolling XOR: char ^ key_byte ^ pos
        dec = bytes([ciphertext[i] ^ key[i % len(key)] ^ (i % 256) for i in range(len(ciphertext))])
        
        if any(kw in dec for kw in [b"<?xml", b"<subject", b"<Question", b"<question"]):
            print(f"[!!!] SUCCESS! Unlocked Agricultural Science with Rolling XOR and Key: {k}")
            print(f"Sample: {dec[:500].decode('ascii', errors='ignore')}")
            return

    print("Rolling XOR failed. Trying Bit-Reverse + XOR...")

if __name__ == "__main__":
    special_cracker()
