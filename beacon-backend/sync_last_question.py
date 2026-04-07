import json

def get_last_question_sync():
    with open('beacon_enriched_questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', [])
    if not questions:
        print("No questions found.")
        return
        
    last_q = questions[-1]
    subj = last_q.get('subject')
    year = last_q.get('year')
    num = last_q.get('question_number')
    
    print(f"ACTUAL LAST QUESTION: {subj} {year} Q{num}")
    
    if 'metadata' not in data:
        data['metadata'] = {}
    if 'summary' not in data['metadata']:
        data['metadata']['summary'] = {}
        
    target = {'subject': subj, 'year': year, 'question_number': num}
    data['metadata']['summary']['last_question'] = target
    data['metadata']['summary']['current_processing'] = target
    
    with open('beacon_enriched_questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    print("Metadata synced successfully. Ready for fast-resume.")

if __name__ == '__main__':
    get_last_question_sync()
