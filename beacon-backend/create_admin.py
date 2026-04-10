from app import create_app, db
from app.models import User
from app.extensions import bcrypt
import uuid
import getpass

def create_admin():
    app = create_app()
    with app.app_context():
        email = "ahmdestino@gmail.com"
        
        print(f"--- Beacon Admin Creation/Reset Tool ---")
        password = getpass.getpass(f"Enter password for {email}: ")
        confirm = getpass.getpass("Confirm password: ")
        
        if password != confirm:
            print("Error: Passwords do not match.")
            return

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        
        if user:
            print(f"User {email} found. Updating password and promoting to Admin...")
            user.password_hash = hashed_password
            user.is_admin = True
            user.is_verified = True
            user.onboarding_completed = True
            db.session.commit()
            print("Successfully updated Admin details.")
        else:
            print(f"Creating new Admin user: {email}...")
            new_admin = User(
                full_name="Ahmed Destino",
                email=email,
                password_hash=hashed_password,
                is_admin=True,
                is_verified=True,
                onboarding_completed=True,
                subscription_tier='elite',
                points_balance=9999
            )
            
            db.session.add(new_admin)
            db.session.commit()
            print(f"Successfully created Admin user: {email}")

if __name__ == "__main__":
    create_admin()
