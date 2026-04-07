"""
Script to DELETE destinoboss@gmail.com from database.
Uses CASCADE approach for stubborn foreign keys.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User
from sqlalchemy import text

app = create_app()

with app.app_context():
    email = 'destinoboss@gmail.com'
    
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"No user found with email: {email}")
        sys.exit(0)
    
    uid = str(user.id)
    print(f"DELETING user: {user.email} (ID: {uid})")
    
    # Use raw SQL with CASCADE to delete all related records first
    tables_to_clear = [
        'notification_preferences',
        'refresh_tokens',
        'streaks',
        'practice_sessions',
        'conversations',
        'notifications',
        'user_badges',
        'subscriptions',
        'documents'
    ]
    
    for table in tables_to_clear:
        try:
            with db.engine.connect() as conn:
                result = conn.execute(text(f"DELETE FROM {table} WHERE user_id = :uid"), {'uid': uid})
                conn.commit()
                print(f"  - Cleared {table}: {result.rowcount} rows")
        except Exception as e:
            print(f"  - {table}: {str(e)[:60]}")
    
    # Now delete the user
    try:
        with db.engine.connect() as conn:
            result = conn.execute(text("DELETE FROM users WHERE id = :uid"), {'uid': uid})
            conn.commit()
            print(f"✓ DELETED {email} completely!")
    except Exception as e:
        print(f"ERROR deleting user: {e}")
