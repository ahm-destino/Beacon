import os
import zlib

tdx_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\rep\data\em1\theory\Agricultural Science\2009.tdx'

hw_ids = [
    "L1HF99L04XD",
    "PC19K7CY",
    "5CD2_E428_91A2_A656.",
    "BFEBFBFF000806EA",
    "FINALCLOSENESS",
    "iafsawii"
]

def final_boss_cracker():
    if not os.path.exists(tdx_path):
        print("Error: TDX file not found.")
        return

    with open(tdx_path, 'rb') as f:
        ciphertext = f.read(1024 * 64) # 64KB sample

    print("--- THE FINAL BOSS CRACKER (Force Unlock) ---")
    
    for hw_id in hw_ids:
        key = hw_id.encode('ascii', errors='ignore')
        
        # Test 1: Repeated XOR
        dec = bytes([ciphertext[i] ^ key[i % len(key)] for i in range(len(ciphertext))])
        
        # Look for XML or Zip headers
        if dec.startswith(b"PK\x03\x04") or b"<?xml" in dec or b"<subject" in dec:
            print(f"[!!!] SUCCESS! Unlocked with Key: {hw_id}")
            print(f"Format: {'Zip/Archive' if dec.startswith(b'PK') else 'XML Text'}")
            print(f"Sample Content: {dec[:200].decode('ascii', errors='ignore')}")
            return

        # Test 2: Index-Offset XOR (Very common in TestDriller)
        dec_off = bytes([ciphertext[i] ^ key[i % len(key)] ^ (i % 256) for i in range(len(ciphertext))])
        if dec_off.startswith(b"PK\x03\x04") or b"<?xml" in dec_off or b"<subject" in dec_off:
            print(f"[!!!] SUCCESS! Unlocked with Offset-XOR Key: {hw_id}")
            print(f"Sample Content: {dec_off[:200].decode('ascii', errors='ignore')}")
            return
            
        # Test 3: Standard Zlib Check (Try decompressing directly after XOR)
        try:
            unzipped = zlib.decompress(dec)
            if b"<" in unzipped or b"?" in unzipped:
                print(f"[!!!] SUCCESS! Unlocked with XOR+Zlib: {hw_id}")
                print(f"Sample: {unzipped[:200].decode('ascii', errors='ignore')}")
                return
        except: pass

    print("Still locked. Trying one last secret: reverse bit-shifting...")

if __name__ == "__main__":
    final_boss_cracker()
