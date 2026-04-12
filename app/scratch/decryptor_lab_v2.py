import os
import zlib
import gzip
from Crypto.Cipher import AES

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'
candidates = ["cbEA827387CHBMJN", "7CCMOKOOSJMROutZ"]

def try_advanced_decrypt():
    if not os.path.exists(gcont_path): return
    with open(gcont_path, 'rb') as f:
        ciphertext = f.read(1024 * 64) # 64KB for better context

    for key_str in candidates:
        key = key_str.encode('ascii')
        iv_options = [key, b'\x00' * 16, ciphertext[:16]]
        
        for iv in iv_options:
            try:
                # 1. Try AES-CBC
                cipher = AES.new(key, AES.MODE_CBC, iv)
                raw_dec = cipher.decrypt(ciphertext)
                
                # 2. Try Decompressing the result (Zlib/Deflate)
                # Skip some bytes in case there's a custom header
                for skip in range(0, 16):
                    try:
                        decompressed = zlib.decompress(raw_dec[skip:], -zlib.MAX_WBITS) # Raw deflate
                        if b'Question' in decompressed or b'Subject' in decompressed or b'{' in decompressed:
                            print(f"SUCCESS! Key: {key_str}, IV: {iv.hex()}, Skip: {skip}")
                            print("Sample:", decompressed[:300])
                            return
                    except: pass
                    
                    try:
                        decompressed = zlib.decompress(raw_dec[skip:]) # Standard zlib
                        if b'Question' in decompressed or b'Subject' in decompressed:
                            print(f"SUCCESS! Key: {key_str}, IV: {iv.hex()}, Method: Zlib")
                            return
                    except: pass

            except Exception: pass

    # 3. Try XOR (very common for "scrambled" text)
    # Most common XOR is with a fixed key like 'IAF' or 'SAWII'
    xor_keys = [b"IAF", b"SAWII", b"DTW"]
    for xk in xor_keys:
        dec = bytes([ciphertext[i] ^ xk[i % len(xk)] for i in range(len(ciphertext))])
        if b"Question" in dec or b"Subject" in dec:
             print(f"SUCCESS with XOR Key: {xk.decode()}")
             print("Sample:", dec[:200])
             return

    print("No matches in Lab 2.0. Looking for more keys...")

if __name__ == "__main__":
    try_advanced_decrypt()
