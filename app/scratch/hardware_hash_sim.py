import hashlib

hw_id = "L1HF99L04XD" # Baseboard
salts = [
    "cbEA827387CHBMJN",
    "FINALCLOSENESS",
    "iafsawii",
    "testdriller09037770483",
    "8BB128F9-10B4-4666-AE6D-76B3182B67C5"
]

def hash_simulator():
    print("--- Hardware Hash Simulation Lab ---")
    for salt in salts:
        # Try different mixing strategies
        combos = [
            hw_id + salt,
            salt + hw_id,
            hashlib.md5(hw_id.encode()).hexdigest()[:16],
            hashlib.md5((hw_id + salt).encode()).hexdigest(),
        ]
        
        for i, combo in enumerate(combos):
            print(f"Candidate {salt[:5]}_{i}: {combo[:32]}")

if __name__ == "__main__":
    hash_simulator()
