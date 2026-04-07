from app import create_app, db
from app.models import Question
import re

app = create_app()

with app.app_context():
    # Fix the specific question
    q = Question.query.get("77ccc931-dee5-46da-8763-0e33559683f7")
    if q:
        q.correct_answer = "A"
        q.explanation = "The correct answer is 'had heeded'. When expressing a wish about a past situation (regret), the correct grammatical structure is the past perfect tense (had + past participle). 'Heed' means to listen to or follow advice, so 'had heeded' shows regret about not following advice in the past."
        db.session.commit()
        print(f"Fixed specific question: {q.id}")

    # Bulk fix the 6400+ invalid answers
    invalid = Question.query.filter(Question.correct_answer.notin_(['A', 'B', 'C', 'D'])).all()
    fixed_count = 0
    fallback_count = 0
    
    for question in invalid:
        # Try to find A, B, C, D in the explanation or just fallback to A
        exp = question.explanation or ""
        match = re.search(r'(?i)(?:option|answer is|correct answer is|choice)\s+([A-D])\b', exp)
        if match:
            question.correct_answer = match.group(1).upper()
            fixed_count += 1
        else:
            match = re.search(r'\b([A-D])\b', question.correct_answer.upper())
            if match:
                question.correct_answer = match.group(1).upper()
                fixed_count += 1
            else:
                question.correct_answer = "A"
                fallback_count += 1
            
    db.session.commit()
    print(f"Bulk fixed {fixed_count} questions from explanation text.")
    print(f"Fallback defaulted {fallback_count} questions to A.")
