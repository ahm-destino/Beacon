import os
import zlib

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'

def structure_scan():
    if not os.path.exists(gcont_path): return
    
    with open(gcont_path, 'rb') as f:
        data = f.read(1024 * 128) # Read 128KB

    print("--- Structure Scan Report ---")
    
    # Check 1: Entropy (Is it compressed or encrypted?)
    # Compressed data has high entropy but recognizable headers sometimes.
    # Check for Zlib header (0x78 0x9C or 0x78 0xDA)
    for i in range(len(data) - 2):
        if data[i] == 0x78 and (data[i+1] == 0x9c or data[i+1] == 0xda):
            print(f"[FOUND] Potential Zlib Header at offset {i}")
            
    # Check 2: Byte Distribution
    counts = {}
    for b in data[:1000]:
        counts[b] = counts.get(b, 0) + 1
    
    # If a single byte or pattern is very frequent, it might be an XOR key
    most_freq = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]
    print(f"Top 5 bytes: {most_freq}")
    
    # Test: XOR with current most frequent byte (hoping it's 0x00 or space)
    for b_val, _ in most_freq:
        xor_test = bytes([b ^ b_val for b in data[:100]])
        if b"SQL" in xor_test or b"{" in xor_test or b"[" in xor_test:
            print(f"[!!!] POTENTIAL XOR KEY FOUND: {b_val} (0x{b_val:02x})")
            print(f"Sample: {xor_test.decode('ascii', errors='ignore')}")

if __name__ == "__main__":
    structure_scan()
