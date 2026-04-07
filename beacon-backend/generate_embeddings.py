"""
generate_embeddings.py
======================

ONE-TIME script to generate vector embeddings for all questions in the database.

HOW IT WORKS:
  1. Loads the free local AI model 'all-MiniLM-L6-v2' (~90MB, downloaded once)
  2. For every Question in the DB that has no embedding yet, it:
     a. Combines the question text + topic + subject into one string
     b. Passes it through the model to get 384 numbers (a vector)
     c. Saves those 384 numbers back to the Question's `embedding` column
  3. Does this in batches of 100 to avoid memory issues

After this script completes, the RAG search in the AI Tutor will work.
You NEVER need to run this again unless you add a large new batch of questions.

USAGE:
  venv\\Scripts\\python.exe generate_embeddings.py
"""

import os
import sys
import time

# Bootstrap Flask app context so we can use the DB models
from app import create_app, db
from app.models import Question

def main():
    app = create_app()
    with app.app_context():

        # Step 1: Load the embedding model
        print("Loading embedding model 'all-MiniLM-L6-v2'...")
        print("(This will download ~90MB the very first time — please wait)\n")
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Model loaded successfully!\n")
        except ImportError:
            print("ERROR: sentence-transformers is not installed.")
            print("Run: venv\\Scripts\\pip.exe install sentence-transformers==3.0.1")
            sys.exit(1)

        # Step 2: Check how many questions already have embeddings
        total = Question.query.count()
        already_done = Question.query.filter(Question.embedding.isnot(None)).count()
        remaining = total - already_done

        print(f"Total questions in database : {total:,}")
        print(f"Already have embeddings     : {already_done:,}")
        print(f"Still need embeddings       : {remaining:,}\n")

        if remaining == 0:
            print("All questions already have embeddings! Nothing to do.")
            return

        # Step 3: Process in batches of 100
        batch_size = 100
        processed = 0
        start_time = time.time()

        # Only fetch questions without an embedding
        questions_to_process = Question.query.filter(
            Question.embedding.is_(None)
        ).all()

        print(f"Starting embedding generation for {len(questions_to_process):,} questions...\n")

        for i in range(0, len(questions_to_process), batch_size):
            batch = questions_to_process[i:i + batch_size]

            # Build the text to embed for each question.
            # We combine subject + topic + question text so the vector captures
            # the full academic context, not just the raw question wording.
            texts = []
            for q in batch:
                combined = f"{q.subject or ''} {q.topic or ''}: {q.question_text or ''}".strip()
                texts.append(combined)

            # Generate embeddings for the entire batch at once (faster than one by one)
            embeddings = model.encode(
                texts,
                normalize_embeddings=True,  # normalise so cosine similarity = dot product
                show_progress_bar=False,
                batch_size=32,
            )

            # Save back to DB
            import json
            for q, emb in zip(batch, embeddings):
                try:
                    # If using pgvector, it expects a list
                    q.embedding = emb.tolist()
                except Exception:
                    # If using the local text fallback, store it as a JSON string
                    q.embedding = json.dumps(emb.tolist())

            db.session.commit()
            processed += len(batch)

            # Progress report
            elapsed = time.time() - start_time
            rate = processed / elapsed if elapsed > 0 else 0
            eta = (remaining - processed) / rate if rate > 0 else 0
            print(
                f"  [{processed:,}/{remaining:,}] "
                f"Rate: {rate:.0f} q/s | "
                f"ETA: {eta/60:.1f} min"
            )

        total_time = time.time() - start_time
        print(f"\nDone! Generated embeddings for {processed:,} questions in {total_time/60:.1f} minutes.")
        print("The RAG-powered AI Tutor is now ready to use.")

if __name__ == '__main__':
    main()
