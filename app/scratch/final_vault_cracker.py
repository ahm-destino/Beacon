import os

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def crack_the_vault():
    try:
        with open(exe_path, 'rb') as f:
            data = f.read()

        print(f"--- Vault Cracker ---")
        print(f"Searching for 101,790 byte logic pool...")

        # We look for the start of the byte array the user pasted
        # Bytes: 137, 156, 205, 158, 203, 152, 201, 142, 196, 197
        pattern = bytes([137, 156, 205, 158, 203, 152, 201, 142, 196, 197])
        
        pool_pos = data.find(pattern)
        if pool_pos == -1:
            print("Pool pattern not found in binary. Trying alternative search...")
            return

        print(f"Found Pool at offset: {pool_pos}")
        
        # The pool array starts here
        pool = data[pool_pos:pool_pos + 101790]
        
        # Offsets from the user:
        # \u2025\u202C() -> (1656, 26262, 4)
        # \u2025\u202D() -> (1657, 26266, 10)
        
        string1_raw = pool[26262:26262+4]
        string2_raw = pool[26266:26266+10]
        
        # The code used: Encoding.UTF8.GetString(...)
        # Wait, the bytes looked large (137, 156...). 
        # Usually these are XORed or shifted before UTF8 decoding.
        
        print("\n--- Extracted Strings at Offsets ---")
        print(f"Offset 26262 (4 chars): {string1_raw.hex(' ')}")
        print(f"Offset 26266 (10 chars): {string2_raw.hex(' ')}")
        
        # Attempt simple descrambling (shift often used in these)
        # We need the descramble method '6' from the user's snippet.
        # It just did: Encoding.UTF8.GetString(8BB...4, A_1, A_2)
        # BUT... the bytes provided by the user are clearly not plain ASCII (all > 127).
        
        # I'll try to find the descramble logic.
        # In many Eazfuscator versions, you XOR with a sequence.
        
        # Let's try to decode the first 7-char strings from the user's snippet
        # \u00A0() -> (0, 0, 7)
        # Raw bytes from user for start: 137, 156, 205, 158, 203, 152, 201
        
        s0_raw = bytes([137, 156, 205, 158, 203, 152, 201])
        print(f"String 0 raw: {s0_raw.hex(' ')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    crack_the_vault()
