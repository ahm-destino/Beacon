import json
import os

def check_counts():
    path = 'beacon_enriched_questions.json'
    if not os.path.exists(path):
        print("File not found")
        return
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    counts = {}
    for q in data.get('questions', []):
        s = q.get('subject')
        counts[s] = counts.get(s, 0) + 1
    
    print(json.dumps(counts, indent=2))

if __name__ == "__main__":
    check_counts()
