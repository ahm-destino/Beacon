import os
import zlib

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'
offset = 10166

def extract_zlib():
    if not os.path.exists(gcont_path): return
    
    with open(gcont_path, 'rb') as f:
        f.seek(offset)
        # Read a chunk that might be a complete zlib stream
        compressed_data = f.read(65536) 

    print(f"--- Zlib Extraction Lab (Offset {offset}) ---")
    
    try:
        # attempt to decompress the stream
        # zlib.decompress will stop at the end of the stream
        decompressed = zlib.decompress(compressed_data)
        print("[!!!] DECOMPRESSION SUCCESSFUL [!!!]")
        print("-" * 30)
        # Show first 500 characters of the result
        print(decompressed[:1000].decode('ascii', errors='ignore'))
        print("-" * 30)
    except Exception as e:
        print(f"Decompression failed: {e}")
        # Sometimes there's a small XOR before compression
        # Let's try XOR with 170 (our key from earlier)
        try:
            xor_data = bytes([b ^ 170 for b in compressed_data])
            decompressed = zlib.decompress(xor_data)
            print("[!!!] DECOMPRESSION SUCCESSFUL (with XOR 170) [!!!]")
            print(decompressed[:1000].decode('ascii', errors='ignore'))
        except:
            print("XOR 170 Decompression also failed.")

if __name__ == "__main__":
    extract_zlib()
