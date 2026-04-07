"""
Migration script to create all new Beacon tables.
Run this to create flashcards, literature, and performance tracking tables.
"""
import os
import sys

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from sqlalchemy import text

def create_tables():
    """Create all new tables."""
    app = create_app()
    
    with app.app_context():
        # Create all tables that don't exist yet
        db.create_all()
        
        print("SUCCESS: All tables created successfully!")
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        expected_tables = [
            'flashcard_decks',
            'flashcards', 
            'flashcard_reviews',
            'literature_texts',
            'literature_chapters',
            'user_literature_progress',
            'literature_past_questions',
            'topic_performances',
            'concept_confidences',
            'study_events',
            'challenge_answers'
        ]
        
        print("\nTable Status:")
        for table in expected_tables:
            status = "OK" if table in tables else "MISSING"
            print(f"  {table}: {status}")
        
        # Show all tables
        print(f"\nTotal tables in database: {len(tables)}")
        
        return True

if __name__ == '__main__':
    try:
        create_tables()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
