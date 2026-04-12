import os

p = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\TestDriller.exe'

def scan_binary():
    if not os.path.exists(p):
        print("Binary not found.")
        return
        
    data = open(p, 'rb').read()
    print(f"Binary Size: {len(data)}")
    
    target = b'ReadAllBytes'
    pos = data.find(target)
    
    if pos != -1:
        print(f"Found '{target.decode()}' string ref at {pos}")
        ctx = data[max(0, pos-200):pos+200].hex(' ')
        print(f"Hex Context: {ctx}")
    else:
        print(f"Reference to '{target.decode()}' not found.")

if __name__ == "__main__":
    scan_binary()
