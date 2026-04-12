import re

exe_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def extract_strings():
    try:
        with open(exe_path, 'rb') as f:
            data = f.read()
            
        # Extract sequences of printable characters (ASCII)
        strings = re.findall(b'[ -~]{4,}', data)
        
        keywords = [b'tdx', b'gcont', b'key', b'cipher', b'secret', b'password', b'adbase', b'decrypt', b'encrypt']
        found = []
        
        for s in strings:
            if any(k in s.lower() for k in keywords):
                found.append(s.decode('ascii', errors='ignore'))
                
        print(f"Total relevant strings found: {len(found)}")
        for i, s in enumerate(set(found)):
            if i < 50: # Limit output
                print(s)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_strings()
