from app import create_app, db
from app.models import User
from app.extensions import bcrypt
import uuid

def create_admin():
    app = create_app()
    with app.app_context():
        email = "ahmdestino@gmail.com"
        password = "AdminLogin2026!" # <== Use this to log in
        
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        
        if user:
            print(f"User {email} already exists. Promoting to Admin...")
            user.is_admin = True
            user.is_verified = True
            user.onboarding_completed = True # Bypass onboarding
            db.session.commit()
            print("Successfully promoted existing user to Admin.")
        else:
            print(f"Creating new Admin user: {email}...")
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            
            new_admin = User(
                full_name="Ahmed Destino",
                email=email,
                password_hash=hashed_password,
                is_admin=True,
                is_verified=True,
                onboarding_completed=True,
                subscription_tier='elite', # Give admin highest tier
                points_balance=9999
            )
            
            db.session.add(new_admin)
            db.session.commit()
            print(f"Successfully created Admin user: {email}")
            print(f"Login Password: {password}")

if __name__ == "__main__":
    create_admin()
