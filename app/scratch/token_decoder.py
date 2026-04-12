import json
import os

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'
tokenizer_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\ml\tokenizer.json'

def token_decode():
    if not os.path.exists(gcont_path) or not os.path.exists(tokenizer_path):
        print("Required files missing.")
        return
        
    with open(tokenizer_path, 'r') as f:
        tk_data = json.load(f)
        idx_to_word = tk_data.get("indexToWord", {})

    with open(gcont_path, 'rb') as f:
        # Read a sample chunk. Let's assume tokens are 1 or 2 bytes.
        data = f.read(1000)

    print("--- Token Decoder Laboratory ---")
    
    # Try interpreting as 1-byte tokens (Simple)
    decoded_1 = "".join([idx_to_word.get(str(b), "?") for b in data[:100]])
    print(f"Sample (1-byte tokens): {decoded_1}")
    
    # Try interpreting as 2-byte little endian (Common in .NET)
    decoded_2 = []
    for i in range(0, len(data) - 1, 2):
        token_id = data[i] + (data[i+1] << 8)
        decoded_2.append(idx_to_word.get(str(token_id), "?"))
    
    print(f"Sample (2-byte tokens): {''.join(decoded_2[:100])}")

if __name__ == "__main__":
    token_decode()
