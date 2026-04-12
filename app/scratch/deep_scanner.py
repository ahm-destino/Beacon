import re
import base64

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def deep_scan():
    try:
        with open(exe_path, 'rb') as f:
            data = f.read()
            
        print(f"Scanning {exe_path} ({len(data)} bytes)...")
        
        # 1. Look for Base64-like strings (potential keys)
        # Typically 24 or 32 characters ending with = or ==
        b64_pattern = re.compile(b'[A-Za-z0-9+/]{10,}=+')
        b64_candidates = [m.group().decode() for m in b64_pattern.finditer(data)]
        
        # 2. Look for common .NET Hardcoded Keys (16, 24, 32 Byte strings)
        # We look for printable ASCII strings of exactly these lengths
        lengths = [8, 16, 24, 32]
        ascii_candidates = []
        for l in lengths:
            pat = re.compile(b'[ -~]{' + str(l).encode() + b'}')
            ascii_candidates.extend([m.group().decode() for m in pat.finditer(data)])
            
        # 3. Filter and report
        all_candidates = set(b64_candidates + ascii_candidates)
        
        # Keywords that often appear near keys
        keywords = ['iaf', 'sawii', 'test', 'drill', 'dtw', 'pass', 'sec', 'crypt']
        
        refined = []
        for c in all_candidates:
            if any(k in c.lower() for k in keywords):
                refined.append(c)
            elif len(c) in [16, 24, 32]: # Structure-based priority
                refined.append(c)
                
        print(f"Found {len(refined)} potential candidates.")
        for c in sorted(refined, key=len):
             print(f"[{len(c)}] {c}")
             
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    deep_scan()
