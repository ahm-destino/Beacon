import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def wipe_database():
    """
    DANGER: This script will drop all tables in the connected database.
    Use with extreme caution.
    """
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found in environment or .env file.")
        return

    # Security check to ensure it doesn't run on production unless explicitly intended
    confirm = input(f"Are you sure you want to WIPE the database at {db_url.split('@')[-1]}? (type 'YES' to confirm): ")
    if confirm != 'YES':
        print("Operation cancelled.")
        return

    engine = create_engine(db_url)
    
    # Tables to drop in order of dependencies (or just drop everything)
    # The safest way is to drop everything and let migrations recreate it.
    
    try:
        with engine.connect() as conn:
            print("Stopping all active connections and dropping tables...")
            # Drop all tables using a schema-wide wipe (PostgreSQL)
            conn.execute(text("""
                DROP SCHEMA public CASCADE;
                CREATE SCHEMA public;
                GRANT ALL ON SCHEMA public TO postgres;
                GRANT ALL ON SCHEMA public TO public;
            """))
            conn.commit()
            print("SUCCESS: All tables have been dropped and public schema reset.")
            print("Next time you deploy on Render, the migrations will recreate the tables and re-seed the data.")
            
    except Exception as e:
        print(f"Error during wipe: {e}")

if __name__ == "__main__":
    wipe_database()
