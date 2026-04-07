import json

def check_latest():
    with open('beacon_enriched_questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    qs = data.get('questions', [])
    print("=== LIVE PROOF THE SCRAPER IS GETTING REAL DATA ===")
    
    for i, q in enumerate(qs[-3:]):
        print(f"\n[{q.get('subject', '').upper()} - YEAR {q.get('year')} - QUESTION {q.get('question_number')}]")
        print(f"TEXT: {str(q.get('question_text', ''))[:150]}")
        print("OPTIONS:")
        opts = q.get('options', {})
        for k, v in opts.items():
            print(f"  {k}: {v}")
        if q.get('passage'):
            print(f"PASSAGE SNIPPET: {str(q.get('passage'))[:50]}...")
            
    print(f"\nTOTAL DATABASE SIZE: {len(qs)} questions saved!")

if __name__ == '__main__':
    check_latest()
