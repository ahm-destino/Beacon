from app import create_app
from app.extensions import db
from app.models import Question
from app.utils.question_validation import is_question_valid

app = create_app()
with app.app_context():
    subjects = db.session.query(Question.subject).distinct().all()
    print(f"{'Subject':<20} | {'Total':<8} | {'Valid':<8} | {'Invalid':<8}")
    print("-" * 50)
    for (sub,) in subjects:
        if not sub: continue
        all_q = Question.query.filter_by(subject=sub).all()
        total = len(all_q)
        valid = sum(1 for q in all_q if is_question_valid(q))
        invalid = total - valid
        print(f"{sub:<20} | {total:<8} | {valid:<8} | {invalid:<8}")
