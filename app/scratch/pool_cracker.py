import os

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'
pool_offset = 19411466
pool_size = 101790

def brute_pool():
    try:
        with open(exe_path, 'rb') as f:
            f.seek(pool_offset)
            pool = f.read(pool_size)
            
        print(f"--- Pool Brute-Force Lab ---")
        print(f"Testing the first 64 bytes of the pool...")
        
        sample = pool[:64]
        
        # Test 1: Simple XOR with a fixed byte
        for xor_val in range(256):
            decoded = bytes([b ^ xor_val for b in sample])
            # Check if it looks like ASCII (mostly letters/numbers)
            printable_count = sum(1 for b in decoded if 32 <= b <= 126)
            if printable_count > 40: # If > 60% is printable
                print(f"\n[FOUND] Potential XOR Key: {xor_val} (0x{xor_val:02x})")
                print("Decoded Sample:", decoded.decode('ascii', errors='ignore'))
                
        # Test 2: Double XOR or Index-based XOR (Common in .NET)
        # byte[i] ^ key ^ i
        for xor_val in range(256):
            decoded = bytes([pool[i] ^ xor_val ^ (i % 256) for i in range(64)])
            printable_count = sum(1 for b in decoded if 32 <= b <= 126)
            if printable_count > 40:
                print(f"\n[FOUND] Potential Index-XOR Key: {xor_val}")
                print("Decoded Sample:", decoded.decode('ascii', errors='ignore'))

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    brute_pool()
