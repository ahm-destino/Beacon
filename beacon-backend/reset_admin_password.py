import os
import psycopg2
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

def reset_admin():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    # User details
    email = "ahmdestino@gmail.com"
    password = "AdminLogin2026!"
    
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Hash the password
        bcrypt = Bcrypt()
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        print(f"Hashing password for {email}...")
        
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if user:
            print(f"User found. Updating password and permissions...")
            cur.execute("""
                UPDATE users 
                SET password_hash = %s, 
                    is_admin = TRUE, 
                    is_verified = TRUE, 
                    onboarding_completed = TRUE,
                    subscription_tier = 'elite'
                WHERE email = %s
            """, (hashed_password, email))
            conn.commit()
            print(f"Successfully RESET admin password for {email}.")
        else:
            print(f"Error: User {email} not found. Running full creation...")
            # If they don't exist, we'll try to insert them (basic columns only)
            import uuid
            user_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO users (id, full_name, email, password_hash, is_admin, is_verified, onboarding_completed, subscription_tier, points_balance)
                VALUES (%s, %s, %s, %s, TRUE, TRUE, TRUE, 'elite', 9999)
            """, (user_id, "Ahmed Destino", email, hashed_password))
            conn.commit()
            print(f"Successfully CREATED admin user: {email}")
            
        cur.close()
        conn.close()
        print(f"\nLogin now with:\nEmail: {email}\nPassword: {password}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_admin()
