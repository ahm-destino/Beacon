import os

p = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def hunt():
    if not os.path.exists(p): return
    data = open(p, 'rb').read()
    
    print(f"--- LOGIC INTERSECTION HUNTER ---")
    print(f"Binary Size: {len(data)}")
    
    # We found ReadAllBytes string at 20064916
    # Now find MemberRef entries pointing to this name
    # The MemberRef table is in the metadata.
    
    target = b'ReadAllBytes'
    pos = data.find(target)
    if pos != -1:
        print(f"Confirmed 'ReadAllBytes' metadata tag at {pos}")
        
    # Search for common .NET method call patterns (0x28 is CALL)
    # This is a bit advanced without a full parser, but we can look for specific byte sequences nearby
    
    # Let's try to find the Decryption salt "testdriller" in the code area
    salt = b'testdriller'
    s_pos = data.find(salt)
    if s_pos != -1:
        print(f"Potential decryption salt found at {s_pos}")
        print(f"Salt Context: {data[max(0, s_pos-50):s_pos+50].hex(' ')}")

if __name__ == "__main__":
    hunt()
