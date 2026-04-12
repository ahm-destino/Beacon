import os

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'
pool_offset = 19411466
pool_size = 101790
xor_key = 170

def search_pool():
    try:
        with open(exe_path, 'rb') as f:
            f.seek(pool_offset)
            pool = f.read(pool_size)
            
        desc = bytes([pool[i] ^ xor_key ^ (i % 256) for i in range(pool_size)])
        
        targets = [b"gcont", b"database", b".tdx", b"SQLite", b"PRAGMA", b"Password"]
        
        print("--- Deep Search results ---")
        for target in targets:
            pos = 0
            while True:
                pos = desc.find(target, pos)
                if pos == -1: break
                # Get context
                start = max(0, pos - 10)
                end = min(len(desc), pos + 40)
                context = desc[start:end].decode('ascii', errors='ignore')
                print(f"[FOUND] Offset {pos}: ...{context}...")
                pos += 1
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_pool()
