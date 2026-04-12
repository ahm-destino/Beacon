import struct

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def extract_strings_at_offsets():
    try:
        # We need to find where the string pool starts in the binary.
        # Based on our analysis, let's look for known strings.
        with open(exe_path, 'rb') as f:
            data = f.read()
            
        print(f"--- DTW Goldmine Extractor ---")
        print(f"Reading {len(data)} bytes from EXE...")
        
        # Candidate 1: 4 chars at 26262
        # Candidate 2: 10 chars at 26266
        
        # Since I don't know the EXACT offset of the POOL in the binary yet,
        # I will search for the bytes of the strings I found earlier.
        # String 'cbEA827387CHBMJN' was found earlier.
        
        known_key = b"cbEA827387CHBMJN"
        find_pos = data.find(known_key)
        
        if find_pos != -1:
            print(f"POW! Found the string pool at binary offset: {find_pos}")
            
            # Now let's try to extract the strings around it
            # The user said String 1656 is at 26262, len 4.
            # If cbEA827387CHBMJN is one of them, we can find the others.
            
            # For now, let's just print a chunk of the raw pool
            pool_start = find_pos - 100
            pool_end = find_pos + 500
            readable_pool = data[pool_start:pool_end]
            
            print("\n--- Raw Strings in the Vault ---")
            # Filter for printable chars
            readable = "".join([chr(c) if 32 <= c <= 126 else "." for c in readable_pool])
            print(readable)
            
            # Try to find common passwords like 'iaf', 'sawii'
            if b"IAF" in data:
                 print(f"\nFound 'IAF' at offset: {data.find(b'IAF')}")
            if b"SAWII" in data:
                 print(f"Found 'SAWII' at offset: {data.find(b'SAWII')}")

        else:
            print("String pool not found with direct search. Running deep scan...")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_strings_at_offsets()
