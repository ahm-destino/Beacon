import json

def check_anomalies():
    with open('beacon_enriched_questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    qs = data.get('questions', [])
    
    total = len(qs)
    blank_qs = 0
    missing_opts = 0
    unknown_ans = 0
    
    subj_counts = {}
    
    for q in qs:
        subj = str(q.get('subject', '')).lower()
        subj_counts[subj] = subj_counts.get(subj, 0) + 1
        
        q_text = str(q.get('question_text', '')).strip()
        if not q_text or q_text.lower() == 'none':
            blank_qs += 1
            
        opts = q.get('options', {})
        if not opts or all(not v for v in opts.values()):
            missing_opts += 1
            
        ans = str(q.get('correct_answer', '')).strip().lower()
        if not ans or ans == 'unknown' or ans == 'none':
            unknown_ans += 1
            
    print("=== BEACON DATABASE ANOMALY REPORT ===")
    print(f"Total Questions Analyzed: {total:,}\n")
    
    print("--- POTENTIAL DATA ABNORMALITIES ---")
    print(f"1. Completely Blank Question Texts: {blank_qs:,}")
    print(f"2. Missing or Empty Options:        {missing_opts:,}")
    print(f"3. 'Unknown' Correct Answers:       {unknown_ans:,}")
    print(f"4. Total Scrape Errors/Unknowns:    {max(blank_qs, missing_opts, unknown_ans):,}\n")
    
    print("--- SUBJECT COUNTS (CHECK FOR ROGUE ENTRIES) ---")
    for s, count in sorted(subj_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   {s.upper().ljust(25)}: {count:,} questions")

if __name__ == '__main__':
    check_anomalies()
