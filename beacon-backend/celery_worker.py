import os
from app import create_app, celery
from dotenv import load_dotenv

load_dotenv()

# Create the Flask app context for Celery
app = create_app(os.getenv('FLASK_CONFIG') or 'default')
app.app_context().push()

# This is the worker entry point
if __name__ == '__main__':
    # When running directly, we can start the worker here
    # However, usually we run via `celery -A celery_worker.celery worker`
    pass
