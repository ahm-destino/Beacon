from app import create_app, db
from app.models import Question

app = create_app()
with app.app_context():
    total_q = Question.query.count()
    active_q = Question.query.filter_by(is_active=True).count()
    approved_q = Question.query.filter_by(is_approved=True).count()
    both_q = Question.query.filter_by(is_active=True, is_approved=True).count()
    
    print(f"Total Questions: {total_q}")
    print(f"Active Questions: {active_q}")
    print(f"Approved Questions: {approved_q}")
    print(f"Active & Approved Questions: {both_q}")
    
    if total_q > 0:
        sample = Question.query.first()
        print(f"Sample Question: {sample.text[:50]}...")
        print(f"  Exam: {sample.exam_type}, Subject: {sample.subject}")
