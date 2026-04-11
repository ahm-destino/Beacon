
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        db.session.commit()
        print("pgvector extension enabled successfully.")
    except Exception as e:
        print(f"Error enabling pgvector: {e}")
