import os

hw_ids = [
    "L1HF99L04XD",
    "PC19K7CY",
    "5CD2_E428_91A2_A656.",
    "BFEBFBFF000806EA"
]

p = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\rep\mconf.tdl'

def vault_breaker():
    if not os.path.exists(p): return
    data = open(p, 'rb').read()

    print("--- Hardware Vault Breaker Lab ---")
    
    for hw_id in hw_ids:
        key = hw_id.encode('ascii')
        dec = bytes([data[i] ^ key[i % len(key)] for i in range(len(data))])
        
        # Check for readable patterns
        if any(kw in dec for kw in [b"License", b"Activated", b"User", b"2022", b"2023", b"2024", b"2025", b"2026"]):
            print(f"[!!!] SUCCESS! UNLOCKED VAULT WITH HW_ID: {hw_id}")
            print(f"Decrypted Content: {dec.decode('ascii', errors='ignore')[:300]}")
            return
            
        # Try XOR with offset (Common in older TestDriller versions)
        dec_off = bytes([data[i] ^ key[i % len(key)] ^ (i % 256) for i in range(len(data))])
        if any(kw in dec_off for kw in [b"License", b"Activated", b"User", b"2022", b"2023", b"2024", b"2025", b"2026"]):
            print(f"[!!!] SUCCESS! UNLOCKED WITH OFFSET-XOR AND HW_ID: {hw_id}")
            print(f"Decrypted Content: {dec_off.decode('ascii', errors='ignore')[:300]}")
            return

    print("No direct match. Trying rolling XOR...")

if __name__ == "__main__":
    vault_breaker()
