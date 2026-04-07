"""
Script to clear test user from database.
Run this to delete the test user so you can re-test onboarding flow.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    # Find user by email (common test emails)
    test_emails = [
        'test@test.com',
        'user@test.com',
        'student@test.com',
        'tunde@test.com',
        'john@test.com'
    ]
    
    for email in test_emails:
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"Found user: {user.email} (ID: {user.id})")
            print(f"  - onboarding_completed: {user.onboarding_completed}")
            print(f"  - onboarding_step: {user.onboarding_step}")
            
            # Reset onboarding progress
            user.onboarding_completed = False
            user.onboarding_step = 1
            user.diagnostic_completed = False
            user.primary_exam = None
            user.exam_date = None
            user.subjects = []
            user.target_course = None
            user.target_university = None
            user.class_level = None
            user.state = None
            user.school_name = None
            
            db.session.commit()
            print(f"  - Reset onboarding progress for {email}")
    
    # Also allow finding by partial email match
    print("\nSearching for users with 'test' in email...")
    users = User.query.filter(User.email.ilike('%test%')).all()
    for user in users:
        print(f"Found: {user.email}")
        # Reset their onboarding
        user.onboarding_completed = False
        user.onboarding_step = 1
        user.diagnostic_completed = False
        db.session.commit()
        print(f"  - Reset")
    
    print("\nDone! You can now re-test the onboarding flow.")
