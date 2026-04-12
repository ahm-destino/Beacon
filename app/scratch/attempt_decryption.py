import os
import binascii
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'

# Potential keys found in the binary
candidates = [
    "cbEA827387CHBMJN",
    "7CCMOKOOSJMROutZ",
    "87758544880429RY", # Part of a longer one
    "haOK68PUfmagbb", # Truncated 16?
    "8566BFBDFKPRRTXY",
    "00+1IPQXaflmdceb"
]

def try_decrypt():
    if not os.path.exists(gcont_path):
        print("gcont.txt not found")
        return

    with open(gcont_path, 'rb') as f:
        ciphertext = f.read(1024 * 16) # Read 16KB

    for key_str in candidates:
        key = key_str.encode('ascii')
        print(f"\n--- Trying Key: {key_str} ---")
        
        # Try different modes (CBC is most common in .NET)
        # We also need an IV. Often the IV is the first 16 bytes or the same as the key.
        iv_options = [key, b'\x00' * 16, ciphertext[:16]]
        
        for iv in iv_options:
            try:
                # AES-CBC
                cipher = AES.new(key, AES.MODE_CBC, iv)
                decrypted = cipher.decrypt(ciphertext)
                
                # Check for readable text
                # We look for common JSON/XML/text patterns
                if b'{"' in decrypted or b'<' in decrypted or b'Subject' in decrypted or b'Question' in decrypted:
                     print(f"SUCCESS with IV: {iv.hex()}")
                     print("Decrypted Sample:", decrypted[:200])
                     return
                
                # Try simple AES-ECB
                cipher_ecb = AES.new(key, AES.MODE_ECB)
                decrypted_ecb = cipher_ecb.decrypt(ciphertext)
                if b'{"' in decrypted_ecb or b'<' in decrypted_ecb:
                     print("SUCCESS with ECB")
                     print("Decrypted Sample:", decrypted_ecb[:200])
                     return

            except Exception:
                continue

    print("\nNo key worked in this simple run.")

if __name__ == "__main__":
    try_decrypt()
