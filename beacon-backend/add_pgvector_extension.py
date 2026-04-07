"""
add_pgvector_extension.py
==========================

Run this ONCE to enable pgvector in your PostgreSQL database.

LOCAL POSTGRESQL (e.g. development):
  - pgvector needs to be built from source on PostgreSQL 18 Windows.
  - This script will skip vector setup if pgvector is not available
    and use a TEXT-based fallback column instead for local dev.

CLOUD DATABASES (Neon, Supabase, Render):
  - pgvector is pre-installed on all these platforms.
  - Just run this script after setting up your production DATABASE_URL
    and it will work automatically.

USAGE:
  venv\\Scripts\\python.exe add_pgvector_extension.py
"""

from app import create_app, db
from sqlalchemy import text

def main():
    app = create_app()
    with app.app_context():
        print("Step 1: Checking if pgvector is available in PostgreSQL...")
        pgvector_available = False
        try:
            db.session.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            db.session.commit()
            pgvector_available = True
            print("  pgvector extension enabled!")
        except Exception as e:
            db.session.rollback()
            print(f"  pgvector not available on this PostgreSQL server.")
            print(f"  This is normal for local development on Windows.")
            print(f"  The system will use a text-based fallback for local dev.")
            print(f"  On your cloud database (Render/Neon/Supabase), this will work automatically.")

        if pgvector_available:
            print("\nStep 2: Adding vector embedding column...")
            try:
                db.session.execute(text("""
                    ALTER TABLE questions 
                    ADD COLUMN IF NOT EXISTS embedding vector(384);
                """))
                db.session.commit()
                print("  Column `embedding vector(384)` added!")
            except Exception as e:
                print(f"  Error: {e}")
                db.session.rollback()
                return

            print("\nStep 3: Creating vector similarity index...")
            try:
                db.session.execute(text("""
                    CREATE INDEX IF NOT EXISTS questions_embedding_idx
                    ON questions
                    USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
                """))
                db.session.commit()
                print("  Vector index created!")
            except Exception as e:
                print(f"  Warning: Could not create index: {e}")
                db.session.rollback()
        else:
            # Fallback: add a plain TEXT column to store serialized embeddings
            # This is used locally. On cloud, we switch to the real vector column.
            print("\nStep 2 (fallback): Adding text-based embedding column for local dev...")
            try:
                db.session.execute(text("""
                    ALTER TABLE questions 
                    ADD COLUMN IF NOT EXISTS embedding TEXT;
                """))
                db.session.commit()
                print("  Fallback column `embedding` added for local development.")
            except Exception as e:
                db.session.rollback()
                print(f"  Note: {e} (column may already exist)")

        print("\n=== Setup Complete ===")
        if pgvector_available:
            print("Full vector search is ready!")
        else:
            print("Local fallback mode is ready.")
            print("On your cloud DB, pgvector is pre-installed and will work automatically.")
        print("\nNext steps:")
        print("  1. Run: venv\\Scripts\\python.exe seed_from_json.py")
        print("  2. Run: venv\\Scripts\\python.exe generate_embeddings.py")

if __name__ == '__main__':
    main()
