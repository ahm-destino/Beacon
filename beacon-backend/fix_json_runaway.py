import json
import shutil

SUBJECTS = [
    'english', 'mathematics', 'physics', 'chemistry', 'biology',
    'accounting', 'geography', 'economics', 'commerce', 'crs',
    'government', 'agricultural-science', 'history', 'literature-in-english',
    'civic-education', 'yoruba', 'hausa', 'igbo', 'french', 'arabic'
]

def main():
    with open('beacon_enriched_questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = data.get('questions', [])
    gov_idx = SUBJECTS.index('government')

    new_questions = []
    for q in questions:
        s = q.get('subject')
        y = q.get('year')
        num = q.get('question_number')
        if s not in SUBJECTS:
            continue
        s_idx = SUBJECTS.index(s)
        
        if s_idx > gov_idx:
            continue
        if s_idx == gov_idx and y > 2017:
            continue
        if s_idx == gov_idx and y == 2017 and num >= 1:
            continue
        
        new_questions.append(q)

    shutil.copy2('beacon_enriched_questions.json', 'beacon_enriched_questions.json.bak2')

    data['questions'] = new_questions
    data['metadata']['summary']['current_processing'] = {'subject': 'government', 'year': 2017, 'question_number': 1}
    if new_questions:
        last = new_questions[-1]
        data['metadata']['summary']['last_question'] = {'subject': last['subject'], 'year': last['year'], 'question_number': last['question_number']}

    with open('beacon_enriched_questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f'Truncated questions from {len(questions)} to {len(new_questions)}.')

if __name__ == '__main__':
    main()
