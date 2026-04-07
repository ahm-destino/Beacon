from app import create_app, db
from app.models import Question
import uuid

def seed_questions():
    app = create_app()
    with app.app_context():
        print("Seeding questions...")
        
        # Check if already seeded to avoid duplicates
        if Question.query.count() > 0:
            print("Database already has questions. Skipping seed.")
            return

        questions = [
            # ENGLISH
            {
                "exam_type": "JAMB",
                "subject": "English",
                "topic": "Comprehension",
                "question_text": "Which of the following is a synonym for 'meticulous'?",
                "option_a": "Careless",
                "option_b": "Thorough",
                "option_c": "Fast",
                "option_d": "Angry",
                "correct_answer": "B",
                "explanation": "Meticulous means showing great attention to detail; very careful and precise."
            },
            {
                "exam_type": "JAMB",
                "subject": "English",
                "topic": "Lexis and Structure",
                "question_text": "Choose the option that is opposite in meaning to the underlined word: The manager was **adamant** about the new policy.",
                "option_a": "Flexible",
                "option_b": "Firm",
                "option_c": "Unyielding",
                "option_d": "Serious",
                "correct_answer": "A",
                "explanation": "Adamant means refusing to be persuaded or to change one's mind. Flexible is the opposite."
            },
            # MATHEMATICS
            {
                "exam_type": "JAMB",
                "subject": "Mathematics",
                "topic": "Algebra",
                "question_text": "Solve for x: 2x + 5 = 15",
                "option_a": "5",
                "option_b": "10",
                "option_c": "7.5",
                "option_d": "20",
                "correct_answer": "A",
                "explanation": "2x = 15 - 5 => 2x = 10 => x = 5."
            },
            {
                "exam_type": "JAMB",
                "subject": "Mathematics",
                "topic": "Trigonometry",
                "question_text": "What is the value of sin(90 degrees)?",
                "option_a": "0",
                "option_b": "0.5",
                "option_c": "1",
                "option_d": "-1",
                "correct_answer": "C",
                "explanation": "The sine of 90 degrees in a unit circle is 1."
            },
            # PHYSICS
            {
                "exam_type": "JAMB",
                "subject": "Physics",
                "topic": "Mechanics",
                "question_text": "What is the unit of Force?",
                "option_a": "Watt",
                "option_b": "Joule",
                "option_c": "Newton",
                "option_d": "Pascal",
                "correct_answer": "C",
                "explanation": "Newton (N) is the SI unit for force."
            },
            {
                "exam_type": "JAMB",
                "subject": "Physics",
                "topic": "Optics",
                "question_text": "The speed of light in a vacuum is approximately:",
                "option_a": "3 x 10^5 m/s",
                "option_b": "3 x 10^8 m/s",
                "option_c": "3 x 10^10 m/s",
                "option_d": "3 x 10^6 m/s",
                "correct_answer": "B",
                "explanation": "Light travels at approximately 300,000,000 meters per second."
            },
            # CHEMISTRY
            {
                "exam_type": "JAMB",
                "subject": "Chemistry",
                "topic": "Atomic Structure",
                "question_text": "What is the atomic number of Carbon?",
                "option_a": "12",
                "option_b": "6",
                "option_c": "14",
                "option_d": "8",
                "correct_answer": "B",
                "explanation": "Carbon has 6 protons, so its atomic number is 6."
            },
            {
                "exam_type": "JAMB",
                "subject": "Chemistry",
                "topic": "Acids and Bases",
                "question_text": "Which of the following has a pH less than 7?",
                "option_a": "Pure water",
                "option_b": "Lemon juice",
                "option_c": "Baking soda",
                "option_d": "Bleach",
                "correct_answer": "B",
                "explanation": "Acids have a pH less than 7. Lemon juice contains citric acid."
            }
        ]

        for q_data in questions:
            q = Question(
                source='PAST_PAPER',
                exam_type=q_data['exam_type'],
                subject=q_data['subject'],
                topic=q_data['topic'],
                question_text=q_data['question_text'],
                option_a=q_data['option_a'],
                option_b=q_data['option_b'],
                option_c=q_data['option_c'],
                option_d=q_data['option_d'],
                correct_answer=q_data['correct_answer'],
                explanation=q_data['explanation'],
                is_approved=True,
                is_active=True
            )
            db.session.add(q)
        
        db.session.commit()
        print(f"Successfully seeded {len(questions)} questions!")

if __name__ == "__main__":
    seed_questions()
