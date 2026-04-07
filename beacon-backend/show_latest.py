import json

def show_progress():
    with open('beacon_enriched_questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    qs = data.get('questions', [])
    if len(qs) >= 3:
        for q in qs[-3:]:
            subj = q.get('subject')
            year = q.get('year')
            num = q.get('question_number')
            text = str(q.get('question_text', ''))[:60].replace('\n', ' ')
            print(f"-> {subj} {year} Q{num}: {text}...")
    else:
        print("Not enough questions yet.")

if __name__ == '__main__':
    show_progress()
