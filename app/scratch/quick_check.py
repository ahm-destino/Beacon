import os
import zlib
from Crypto.Cipher import AES

p = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\gcont.txt'
key = b'cbEA827387CHBMJN'
iv = b'0123456789ABBSN1'

def check():
    if not os.path.exists(p):
        print("Master file not found.")
        return
        
    with open(p, 'rb') as f:
        data = f.read(1024 * 16) # Read a larger sample
        
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(data)
    
    # 1. Show Hex Preview
    print(f"DECRYPTED HEX PREVIEW: {decrypted[:64].hex(' ')}")

    # 2. Try Zlib
    print("Attempting Zlib Decompression...")
    for offset in range(32):
        try:
            unzipped = zlib.decompress(decrypted[offset:], -zlib.MAX_WBITS)
            print(f"!!! SUCCESS AT OFFSET {offset} (Raw Deflate) !!!")
            print(f"Unzipped: {unzipped[:200].decode('utf-8', errors='ignore')}")
            return
        except: pass
        try:
            unzipped = zlib.decompress(decrypted[offset:])
            print(f"!!! SUCCESS AT OFFSET {offset} (Standard Zlib) !!!")
            print(f"Unzipped: {unzipped[:200].decode('utf-8', errors='ignore')}")
            return
        except: pass

if __name__ == "__main__":
    check()
