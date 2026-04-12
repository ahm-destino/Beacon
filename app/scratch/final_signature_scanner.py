import os

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def final_scan():
    if not os.path.exists(exe_path):
        print("Error: Exe not found.")
        return

    with open(exe_path, 'rb') as f:
        data = f.read()

    print(f"--- Binary Signature Report ({len(data)} bytes) ---")
    
    # Check for SQLCipher symbols
    targets = [b"sqlite3_key", b"sqlite3_rekey", b"PRAGMA key", b"SetPassword"]
    for t in targets:
        pos = data.find(t)
        if pos != -1:
            print(f"[FOUND] '{t.decode()}' at offset {pos}")
            # Get 50 bytes of context
            context = data[pos:pos+100].hex(' ')
            print(f"Context (Hex): {context}")

    # Check for known .NET encryption namespaces
    if b"System.Security.Cryptography" in data:
        print("[INFO] Found Cryptography namespace.")

if __name__ == "__main__":
    final_scan()
