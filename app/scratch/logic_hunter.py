import os

p = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def logic_hunter():
    if not os.path.exists(p): return
    data = open(p, 'rb').read()
    
    # We found .tdx at 20215581 in the #US heap
    # In .NET, the ldstr instruction (0x72) takes a token that points to this string.
    # The token is usually the offset in the #US heap + 0x70000000
    
    print("--- LOGIC INTERSECTION HUNTER ---")
    
    # Search for common .NET method call patterns near file operations
    # We are looking for 0x72 (ldstr) and 0x28 (call) or 0x6F (callvirt)
    
    # First, let's look for the call signature for File::ReadAllBytes
    # It's an external call. We'll search for the method token for it indirectly.
    
    # Another approach: Search for any code containing XOR logic near .tdx
    tdx_pos = data.find('.tdx'.encode('utf-16le'))
    if tdx_pos != -1:
        # Scan the method body area (usually much earlier than metadata)
        print(f"Targeting .tdx string at {tdx_pos}")
        
    # Test for XOR loops (ldloc, ldloc, xor, stelem.i1)
    # Byte pattern: 11 XX 11 YY 61 9C
    import re
    xor_pattern = re.compile(b'\x11.\x11.\x61\x9c', re.DOTALL)
    xor_matches = list(xor_pattern.finditer(data))
    
    print(f"Found {len(xor_matches)} potential XOR decryption loops.")
    for m in xor_matches[:5]:
        print(f"Loop found at {m.start()}")

if __name__ == "__main__":
    logic_hunter()
