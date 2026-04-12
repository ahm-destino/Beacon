from app import create_app, db
from app.models.question import Question

app = create_app()
with app.app_context():
    print("=== SUBJECT COUNTS ===")
    subjects = db.session.query(Question.subject).distinct().all()
    for s in subjects:
        name = s[0]
        count = Question.query.filter_by(subject=name).count()
        print(f"{name}: {count}")

    print("\n=== GOVT SAMPLE ===")
    govt = Question.query.filter_by(subject='Government').limit(3).all()
    for q in govt:
        print(f"- ID: {q.id} | TEXT: {q.question_text[:100]}...")

    print("\n=== BIOLOGY SAMPLE ===")
    bio = Question.query.filter_by(subject='Biology').limit(3).all()
    for q in bio:
        print(f"- ID: {q.id} | TEXT: {q.question_text[:100]}...")

    print("\n=== PHYSICS SAMPLE ===")
    phys = Question.query.filter_by(subject='Physics').limit(3).all()
    for q in phys:
        print(f"- ID: {q.id} | TEXT: {q.question_text[:100]}...")
