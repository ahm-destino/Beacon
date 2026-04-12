import os
import zlib

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'
offset = 10166

# Candidates from our string extraction
candidates = [
    "FINALCLOSENESS",
    "iafsawii",
    "cbEA827387CHBMJN",
    "testdriller09037770483",
    "iafsawiiLimited!",
    "0123456789ABBSN12345678901234567"
]

def global_cracker():
    if not os.path.exists(gcont_path): return
    
    with open(gcont_path, 'rb') as f:
        f.seek(offset)
        compressed_data = f.read(65536)

    print("--- Global Vault Cracker (XOR + Zlib) ---")
    
    # Try all single-byte XORs
    for b_val in range(256):
        try:
            xor_data = bytes([b ^ b_val for b in compressed_data])
            dec = zlib.decompress(xor_data)
            print(f"[!!!] SUCCESS! Single-byte XOR Key: {b_val} (0x{b_val:02x})")
            print("Preview:", dec[:500].decode('ascii', errors='ignore'))
            return
        except: pass

    # Try all candidate strings as repeated XOR keys
    for cand in candidates:
        key = cand.encode('ascii')
        try:
            xor_data = bytes([compressed_data[i] ^ key[i % len(key)] for i in range(len(compressed_data))])
            dec = zlib.decompress(xor_data)
            print(f"[!!!] SUCCESS! Multi-byte XOR Key: {cand}")
            print("Preview:", dec[:500].decode('ascii', errors='ignore'))
            return
        except: pass

    print("Still locked. The scrambling might be mathematical.")

if __name__ == "__main__":
    global_cracker()
