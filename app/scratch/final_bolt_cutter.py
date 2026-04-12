import os
from Crypto.Cipher import AES

tdx_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\rep\data\em1\theory\Agricultural Science\2009.tdx'

candidates = [
    "a61e895a6326a18b",
    "31ec16f2ae490e85abdf4598bce9002a",
    "5f157bf052e72856bffefa88b3b8e52b",
    "25026e9500f089686ff9da17938f1bef",
    "ca2128e25bfaeb8a7932b593fa8f92d6",
    "1c7ac64acfd444b4ccdf5d7369164b65",
    "cbEA827387CHBMJN",
    "FINALCLOSENESS",
    "testdriller09037770483",
    "L1HF99L04XD"
]

def bolt_cutter():
    if not os.path.exists(tdx_path): return
    with open(tdx_path, 'rb') as f:
        ciphertext = f.read(1024 * 32)
    
    print("--- THE FINAL BOLT CUTTER (Decryption Lab) ---")
    
    for c in candidates:
        key = c.encode('ascii')[:16].ljust(16, b'\0')
        iv = b'\0' * 16 # Common default IV
        
        try:
            cipher = AES.new(key, AES.MODE_CBC, iv)
            dec = cipher.decrypt(ciphertext)
            
            if b"<?xml" in dec or b"<subject" in dec or b"<Question" in dec:
                print(f"[!!!] BINGO! UNLOCKED WITH KEY: {c}")
                print(f"Sample Content: {dec[:200].decode('ascii', errors='ignore')}")
                return
        except: pass
        
    print("No immediate match. Trying SHA256 hashes of candidates...")

if __name__ == "__main__":
    bolt_cutter()
