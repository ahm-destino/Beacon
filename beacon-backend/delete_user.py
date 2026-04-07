"""
Script to COMPLETELY DELETE test user from database.
Run this to fully remove the test user so you can start completely fresh.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Streak, PracticeSession, Conversation, Notification, UserBadge

app = create_app()

with app.app_context():
    # Find and DELETE user by email (common test emails)
    test_emails = [
        'test@test.com',
        'user@test.com',
        'student@test.com',
        'tunde@test.com',
        'john@test.com',
        'tunde@example.com',
        'user@example.com'
    ]
    
    deleted_count = 0
    
    for email in test_emails:
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"DELETING user: {user.email} (ID: {user.id})")
            
            # Delete related records first (to avoid foreign key constraints)
            Streak.query.filter_by(user_id=user.id).delete()
            PracticeSession.query.filter_by(user_id=user.id).delete()
            Conversation.query.filter_by(user_id=user.id).delete()
            Notification.query.filter_by(user_id=user.id).delete()
            UserBadge.query.filter_by(user_id=user.id).delete()
            
            # Delete the user
            db.session.delete(user)
            db.session.commit()
            deleted_count += 1
            print(f"  - DELETED {email} completely")
    
    # Also find any user with 'test' in email and delete
    print("\nSearching for any users with 'test' in email...")
    users = User.query.filter(User.email.ilike('%test%')).all()
    for user in users:
        print(f"DELETING user: {user.email} (ID: {user.id})")
        Streak.query.filter_by(user_id=user.id).delete()
        PracticeSession.query.filter_by(user_id=user.id).delete()
        Conversation.query.filter_by(user_id=user.id).delete()
        Notification.query.filter_by(user_id=user.id).delete()
        UserBadge.query.filter_by(user_id=user.id).delete()
        db.session.delete(user)
        db.session.commit()
        deleted_count += 1
        print(f"  - DELETED {user.email}")
    
    # Also find any user with 'example' in email and delete
    print("\nSearching for any users with 'example' in email...")
    users = User.query.filter(User.email.ilike('%example%')).all()
    for user in users:
        print(f"DELETING user: {user.email} (ID: {user.id})")
        Streak.query.filter_by(user_id=user.id).delete()
        PracticeSession.query.filter_by(user_id=user.id).delete()
        Conversation.query.filter_by(user_id=user.id).delete()
        Notification.query.filter_by(user_id=user.id).delete()
        UserBadge.query.filter_by(user_id=user.id).delete()
        db.session.delete(user)
        db.session.commit()
        deleted_count += 1
        print(f"  - DELETED {user.email}")
    
    if deleted_count == 0:
        print("\nNo test users found to delete.")
    else:
        print(f"\n✓ DELETED {deleted_count} user(s) completely!")
    
    print("\nDone! You can now:")
    print("1. Clear your browser's localStorage (or just 'beacon_token')")
    print("2. Refresh the page")
    print("3. Sign up fresh with new credentials")
    print("4. The onboarding flow should appear!")
