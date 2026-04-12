import os
from Crypto.Cipher import AES

# Target: Agricultural Science 2009.tdx
tdx_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\rep\data\em1\theory\Agricultural Science\2009.tdx'
key = b'cbEA827387CHBMJN'

def try_decrypt(iv):
    if not os.path.exists(tdx_path):
        return None
        
    with open(tdx_path, 'rb') as f:
        ciphertext = f.read(1024 * 16) # Read a larger chunk
        
    try:
        cipher = AES.new(key, AES.MODE_CBC, iv)
        plaintext = cipher.decrypt(ciphertext)
        return plaintext
    except Exception as e:
        return str(e)

import zlib

def main():
    print("--- TDX VAULT BREAKER LAB ---")
    
    # Test 1: Zero IV
    p1 = try_decrypt(b'\x00' * 16)
    
    print("Attempting Zlib Decompression on Decrypted Data...")
    
    # Try different offsets and modes (Standard vs Raw Deflate)
    for offset in range(32): # Sometimes there is a small header
        try:
            chunk = p1[offset:]
            # Try raw deflate (no zlib/gzip headers)
            unzipped = zlib.decompress(chunk, -zlib.MAX_WBITS)
            print(f"!!! SUCCESS AT OFFSET {offset} (Raw Deflate) !!!")
            print(f"Content: {unzipped[:200].decode('utf-8', errors='ignore')}")
            return
        except: pass
        
        try:
            chunk = p1[offset:]
            # Try standard zlib
            unzipped = zlib.decompress(chunk)
            print(f"!!! SUCCESS AT OFFSET {offset} (Standard Zlib) !!!")
            print(f"Content: {unzipped[:200].decode('utf-8', errors='ignore')}")
            return
        except: pass

    print("Still no readable XML. Trying XOR on the AES output next.")

if __name__ == "__main__":
    main()
