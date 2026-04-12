import json
import os

gcont_path = r'c:\Users\LENOVO\Beacon - Revamp\app\gcont.txt'
tokenizer_path = r'C:\Program Files (x86)\IAF SAWII\DTW Tutorials SSCE 2026\app\ml\tokenizer.json'

def full_translate():
    if not os.path.exists(gcont_path) or not os.path.exists(tokenizer_path):
        print("Required files missing.")
        return
        
    with open(tokenizer_path, 'r') as f:
        tk_data = json.load(f)
        idx_to_word = tk_data.get("indexToWord", {})

    with open(gcont_path, 'rb') as f:
        # We'll scan for long sequences of valid tokens
        data = f.read(1024 * 100) # Read 100KB sample

    print("--- FIRST GOLDMINE SAMPLES ---")
    
    current_sentence = []
    found_count = 0
    
    for b in data:
        word = idx_to_word.get(str(b))
        if word:
            if word == "[END]":
                if len(current_sentence) > 5:
                    print(f"\nQUESTION {found_count}:")
                    print(" ".join(current_sentence))
                    found_count += 1
                current_sentence = []
                if found_count >= 5: break
            elif word != "[START]":
                current_sentence.append(word)
        else:
            if len(current_sentence) > 0:
                current_sentence.append("<?>")
                
    if found_count == 0:
        print("No full sentences found in this chunk.")

if __name__ == "__main__":
    full_translate()
