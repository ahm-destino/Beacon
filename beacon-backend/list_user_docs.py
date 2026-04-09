from app import create_app, db
from app.models import User, Document

def list_docs():
    app = create_app()
    with app.app_context():
        email = "ahmdestino@gmail.com"
        user = User.query.filter_by(email=email).first()
        if not user:
            print("User not found.")
            return
        
        docs = Document.query.filter_by(user_id=user.id).all()
        print(f"Documents for {email} (UID: {user.id}):")
        for d in docs:
            print(f" - {d.id} | {d.filename} | Status: {d.status} | URL: {d.file_url[:50]}...")

if __name__ == "__main__":
    list_docs()
