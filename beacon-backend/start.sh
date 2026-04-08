#!/usr/bin/env bash

echo "Starting Celery background worker..."
# Start the Celery worker in the background (&)
# Limited to 1 concurrency to save memory on Render's 512MB free tier
celery -A celery_worker.celery worker --loglevel=info --concurrency=1 &

echo "Starting Gunicorn web server..."
# Start the Gunicorn web server in the foreground
# Using 1 worker and 1 thread for absolute minimum memory footprint on 512MB RAM
gunicorn run:app --bind 0.0.0.0:$PORT --workers 1 --threads 1
