import os

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'
pool_offset = 19411466
pool_size = 101790
xor_key = 170

def extract_all():
    try:
        with open(exe_path, 'rb') as f:
            f.seek(pool_offset)
            pool = f.read(pool_size)
            
        print(f"--- Master String Extractor ---")
        print(f"Descrambling pool with key {xor_key}...")
        
        # Descramble the entire pool
        descrambled = bytes([pool[i] ^ xor_key ^ (i % 256) for i in range(pool_size)])
        
        # We need to find strings. 
        # In .NET Eazfuscator, strings are usually stored length-prefixed or null-terminated.
        # But looking at the brute force, they seem to be concatenated UTF-8.
        
        # Search for interesting keywords in the entire descrambled pool
        keywords = [b"Password", b"Key", b"IV", b"Decrypt", b"sqlite", b"iaf", b"sawii"]
        
        found_anything = False
        for kw in keywords:
            pos = descrambled.find(kw)
            if pos != -1:
                # Extract surrounding context
                start = max(0, pos - 20)
                end = min(len(descrambled), pos + 50)
                context = descrambled[start:end].decode('ascii', errors='ignore')
                print(f"[FOUND] {kw.decode()}: ...{context}...")
                found_anything = True
                
        # Also, check the specific offsets provided by the user
        s1 = descrambled[26262:26262+4].decode('ascii', errors='ignore')
        s2 = descrambled[26266:26266+10].decode('ascii', errors='ignore')
        print(f"\n[KEY CANDIDATE 1] (Offset 26262): {s1}")
        print(f"[KEY CANDIDATE 2] (Offset 26266): {s2}")

        # Let's see some other strings around that area
        print("\n[POOL CONTEXT around 26262]:", descrambled[26250:26350].decode('ascii', errors='ignore'))

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_all()
