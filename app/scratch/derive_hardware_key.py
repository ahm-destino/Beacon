import subprocess
import os

def get_hw_info(cmd):
    try:
        output = subprocess.check_output(cmd, shell=True).decode().strip().split('\n')
        if len(output) > 1:
            return output[1].strip()
    except:
        return None
    return None

def main():
    print("--- Hardware Key Derivation Lab ---")
    
    ids = {
        "Baseboard": get_hw_info('wmic baseboard get serialnumber'),
        "BIOS": get_hw_info('wmic bios get serialnumber'),
        "Disk": get_hw_info('wmic diskdrive get serialnumber'),
        "CPU": get_hw_info('wmic cpu get processorid')
    }
    
    for name, val in ids.items():
        print(f"{name} ID: {val}")

    p = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\rep\mconf.tdl'
    if not os.path.exists(p):
        print(f"Error: {p} not found.")
        return
        
    vault_data = open(p, 'rb').read()
    print(f"\nVault Header: {vault_data[:16].hex(' ')}")
    
    # Simple XOR check for the first few bytes
    for name, val in ids.items():
        if val and val != "To be filled by O.E.M.":
            # Test different combinations
            xor_byte = vault_data[0] ^ ord(val[0])
            print(f"Potential XOR against {name}: 0x{xor_byte:02x}")

if __name__ == "__main__":
    main()
