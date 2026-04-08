from app import create_app, db
from app.models import Question
import json
import os

def seed_from_json():
    app = create_app()
    with app.app_context():
        file_path = 'beacon_enriched_questions.json'
        
        if not os.path.exists(file_path):
            print(f"Error: Could not find {file_path}")
            return
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        questions_list = data.get('questions', [])
        print(f"Starting import of {len(questions_list)} questions...")
        
        # Determine current DB count to avoid duplicate massive imports
        existing_count = Question.query.count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} questions. Skipping seed to prevent duplicates.")
            return
            
        batch_size = 500
        count = 0
        
        for idx, q_data in enumerate(questions_list):
            if q_data.get('enrichment_status') == 'pending':
                continue # Skip un-enriched questions
                
            # Formatting the text with instruction and passage if they exist
            full_text = []
            
            instruction = str(q_data.get('instruction', '')).strip()
            if instruction and instruction.lower() != 'none':
                full_text.append(f"**Instruction:** {instruction}")
                
            passage = str(q_data.get('passage', '')).strip()
            if passage and passage.lower() != 'none':
                full_text.append(f"**Passage:** {passage}\n")
                
            q_text = str(q_data.get('question_text', '')).strip()
            if q_text and q_text.lower() != 'none':
                full_text.append(q_text)
                
            final_question_text = "\n\n".join(full_text)
            
            options = q_data.get('options', {})
            
            # Make sure we have the required fields to avoid DB errors
            if not final_question_text or not q_data.get('correct_answer'):
                continue
                
            q = Question(
                source='SCRAPED',
                exam_type='JAMB', # <== HERE: WE EXPLICITLY SET IT TO JAMB
                subject=q_data.get('subject', 'Unknown').capitalize()[:50],
                topic=str(q_data.get('topic', 'General'))[:100],
                subtopic=str(q_data.get('subtopic', ''))[:100],
                year=q_data.get('year'),
                difficulty=q_data.get('difficulty', 'Medium'),
                question_text=final_question_text,
                option_a=str(options.get('option_a') or options.get('A') or options.get('a') or ''),
                option_b=str(options.get('option_b') or options.get('B') or options.get('b') or ''),
                option_c=str(options.get('option_c') or options.get('C') or options.get('c') or ''),
                option_d=str(options.get('option_d') or options.get('D') or options.get('d') or ''),
                # Ensure the correct answer fits in the 1-character DB column
                correct_answer=str(q_data.get('correct_answer', 'A')).strip()[:1].upper(),
                explanation=str(q_data.get('explanation', '')),
                common_mistake=str(q_data.get('common_mistake', '')),
                is_approved=True,
                is_active=True
            )
            
            db.session.add(q)
            count += 1
            
            # Commit in batches so we don't blow up the memory
            if count % batch_size == 0 % batch_size:
                db.session.commit()
                print(f"Committed {count} questions...")
                
        # Commit any remaining questions
        db.session.commit()
        print(f"Successfully seeded {count} enriched JAMB questions into the database!")

if __name__ == "__main__":
    seed_from_json()
