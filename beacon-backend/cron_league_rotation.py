import os
import sys

# Add the project root to the path so we can import 'app'
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.services.league_service import process_weekly_rotation

# Initialize the Flask context so Database models and db.session actually work.
app = create_app()

def run_rotation():
    print("🚀 Starting weekly league rotation via Cron...")
    with app.app_context():
        try:
            # We call the core function synchronously instead of dispatching via celery.delay()
            process_weekly_rotation()
            print("✅ Weekly league rotation completed successfully.")
        except Exception as e:
            print(f"❌ Error during weekly league rotation: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    run_rotation()
