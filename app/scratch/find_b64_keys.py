import re
import base64

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def find_b64():
    try:
        with open(exe_path, 'rb') as f:
            data = f.read()
            
        print(f"Scanning {exe_path} for potential Base64 keys...")
        
        # Look for Base64 sequences (longer ones are more likely to be keys)
        # B64 characters: A-Za-z0-9+/ and ending with =
        pattern = re.compile(b'[A-Za-z0-9+/]{16,44}={0,2}')
        candidates = set()
        
        for match in pattern.finditer(data):
            s = match.group().decode('ascii', errors='ignore')
            # Filter out common false positives
            if any(c.isdigit() for c in s) and any(c.isupper() for c in s) and any(c.islower() for c in s):
                candidates.add(s)
        
        # Sort by length
        sorted_candidates = sorted(list(candidates), key=len, reverse=True)
        
        print(f"Found {len(sorted_candidates)} candidates.")
        for c in sorted_candidates[:50]:
            print(f"[{len(c)}] {c}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_b64()
