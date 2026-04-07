"""
Beacon Integration Verification Script
Checks that all frontend and backend components are properly linked.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_backend():
    """Verify backend models and routes."""
    print("BACKEND VERIFICATION")
    print("=" * 50)
    
    from app import create_app
    from app.extensions import db
    from sqlalchemy import inspect
    
    app = create_app()
    with app.app_context():
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        # Check all required tables
        required_tables = {
            'flashcard_decks': 'Flashcard Decks',
            'flashcards': 'Flashcards',
            'flashcard_reviews': 'Flashcard Reviews',
            'literature_texts': 'Literature Texts',
            'literature_chapters': 'Literature Chapters',
            'user_literature_progress': 'User Literature Progress',
            'literature_past_questions': 'Literature Past Questions',
            'topic_performance': 'Topic Performance',
            'concept_confidence': 'Concept Confidence',
            'study_events': 'Study Events',
            'challenge_answers': 'Challenge Answers'
        }
        
        all_ok = True
        for table, name in required_tables.items():
            status = "OK" if table in tables else "MISSING"
            if status == "MISSING":
                all_ok = False
            print(f"  [{status}] {name} ({table})")
        
        # Check blueprints
        print("\n  Registered Blueprints:")
        for rule in app.url_map.iter_rules():
            if rule.endpoint != 'static':
                break
        
        routes = [str(rule) for rule in app.url_map.iter_rules()]
        
        blueprint_checks = [
            ('/api/flashcards', 'Flashcards'),
            ('/api/literature', 'Literature'),
            ('/api/ai-tutor/concepts', 'AI Tutor Concepts'),
            ('/api/ai-tutor/write', 'AI Tutor Write'),
            ('/api/ai-tutor/voice', 'AI Tutor Voice'),
        ]
        
        for prefix, name in blueprint_checks:
            found = any(prefix in r for r in routes)
            status = "OK" if found else "MISSING"
            if not found:
                all_ok = False
            print(f"  [{status}] {name} ({prefix}/*)")
        
        return all_ok

def check_frontend():
    """Verify frontend components."""
    print("\n\nFRONTEND VERIFICATION")
    print("=" * 50)
    
    # Get project root (parent of beacon-backend)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(project_root, 'beacon-frontend', 'src')
    
    if not os.path.exists(frontend_dir):
        print("  [WARNING] Frontend directory not found at expected location")
        return False
    
    # Check components exist
    components_to_check = [
        ('components/flashcards/FlashcardHome.jsx', 'Flashcard Home'),
        ('components/flashcards/FlashcardStudy.jsx', 'Flashcard Study'),
        ('components/literature/LiteratureHome.jsx', 'Literature Home'),
        ('components/literature/LiteratureDetail.jsx', 'Literature Detail'),
        ('services/api.js', 'API Services'),
    ]
    
    all_ok = True
    for path, name in components_to_check:
        full_path = os.path.join(frontend_dir, path)
        exists = os.path.exists(full_path)
        status = "OK" if exists else "MISSING"
        if not exists:
            all_ok = False
        print(f"  [{status}] {name} ({path})")
    
    # Check routes in main.jsx
    main_jsx = os.path.join(frontend_dir, 'main.jsx')
    if os.path.exists(main_jsx):
        with open(main_jsx, 'r') as f:
            content = f.read()
        
        route_checks = [
            ('/flashcards', 'Flashcards Route'),
            ('/literature', 'Literature Route'),
            ('FlashcardHome', 'FlashcardHome Import'),
            ('LiteratureHome', 'LiteratureHome Import'),
        ]
        
        for pattern, name in route_checks:
            found = pattern in content
            status = "OK" if found else "MISSING"
            if not found:
                all_ok = False
            print(f"  [{status}] {name} ('{pattern}')")
    
    return all_ok

def check_api_services():
    """Verify API service exports."""
    print("\n\nAPI SERVICES VERIFICATION")
    print("=" * 50)
    
    # Get project root (parent of beacon-backend)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    api_file = os.path.join(project_root, 'beacon-frontend', 'src', 'services', 'api.js')
    
    if not os.path.exists(api_file):
        print("  [ERROR] api.js not found")
        return False
    
    with open(api_file, 'r') as f:
        content = f.read()
    
    exports_to_check = [
        ('export const Flashcards', 'Flashcards Service'),
        ('export const Literature', 'Literature Service'),
        ('export const AITutor', 'AI Tutor Service'),
        ('startWriteSession', 'Write Mode'),
        ('startVoiceSession', 'Voice Mode'),
        ('streamConceptExplain', 'Concept Streaming'),
    ]
    
    all_ok = True
    for pattern, name in exports_to_check:
        found = pattern in content
        status = "OK" if found else "MISSING"
        if not found:
            all_ok = False
        print(f"  [{status}] {name} ('{pattern}')")
    
    return all_ok

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("  BEACON INTEGRATION VERIFICATION")
    print("=" * 60 + "\n")
    
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    api_ok = check_api_services()
    
    print("\n\n" + "=" * 60)
    if backend_ok and frontend_ok and api_ok:
        print("  SUCCESS: All components properly linked!")
    else:
        print("  WARNING: Some components need attention")
    print("=" * 60 + "\n")
