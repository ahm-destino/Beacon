import os

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'
pool_offset = 19411466
pool_size = 101790
xor_key = 170

def master_crack():
    try:
        with open(exe_path, 'rb') as f:
            f.seek(pool_offset)
            pool = f.read(pool_size)
            
        desc = bytes([pool[i] ^ xor_key ^ (i % 256) for i in range(pool_size)])
        
        # Split into strings. Even though they are concatenated, 
        # let's look for interesting non-trash characters.
        print("--- EXTRACTED SECRET STRINGS ---")
        
        # Look for 16-character candidates (Common AES keys)
        import re
        candidates = re.findall(b'[a-zA-Z0-9!@#$%%^&*()]{16,32}', desc)
        for cand in set(candidates):
            print(f"[CANDIDATE]: {cand.decode('ascii', errors='ignore')}")

        # Also search for "Password=" or "PRAGMA"
        if b"PRAGMA" in desc:
            print("[INFO] Found PRAGMA in pool!")
        if b"Password=" in desc:
            print("[INFO] Found Password= in pool!")

        # Let's check for the key I found earlier cbEA827387CHBMJN again
        # and see if it's used with anything.
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    master_crack()
