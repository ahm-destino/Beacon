from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, Question, Streak, Referral
from ..utils.helpers import success_response, error_response
from sqlalchemy import or_
from ..services.performance_service import record_study_event, update_topic_performance

# Fallback diagnostic questions if database has no questions
FALLBACK_DIAGNOSTIC_QUESTIONS = [
    {
        "id": "diag_1",
        "question_text": "Simplify: 2x + 3x - x",
        "option_a": "4x",
        "option_b": "5x",
        "option_c": "6x",
        "option_d": "3x",
        "correct_answer": "A",
        "subject": "Mathematics",
        "difficulty": "easy",
        "explanation": "Combine like terms: 2x + 3x - x = 5x - x = 4x"
    },
    {
        "id": "diag_2",
        "question_text": "What is the chemical symbol for gold?",
        "option_a": "Ag",
        "option_b": "Au",
        "option_c": "Fe",
        "option_d": "Cu",
        "correct_answer": "B",
        "subject": "Chemistry",
        "difficulty": "easy",
        "explanation": "Au comes from the Latin word 'aurum' meaning gold"
    },
    {
        "id": "diag_3",
        "question_text": "Which organelle is known as the powerhouse of the cell?",
        "option_a": "Nucleus",
        "option_b": "Ribosome",
        "option_c": "Mitochondria",
        "option_d": "Golgi body",
        "correct_answer": "C",
        "subject": "Biology",
        "difficulty": "easy",
        "explanation": "Mitochondria produce ATP, the cell's energy currency"
    },
    {
        "id": "diag_4",
        "question_text": "In which year did Nigeria gain independence?",
        "option_a": "1957",
        "option_b": "1960",
        "option_c": "1963",
        "option_d": "1970",
        "correct_answer": "B",
        "subject": "History",
        "difficulty": "easy",
        "explanation": "Nigeria gained independence from Britain on October 1, 1960"
    },
    {
        "id": "diag_5",
        "question_text": "What is the value of π (pi) to two decimal places?",
        "option_a": "3.12",
        "option_b": "3.14",
        "option_c": "3.16",
        "option_d": "3.18",
        "correct_answer": "B",
        "subject": "Mathematics",
        "difficulty": "easy",
        "explanation": "π ≈ 3.14159..., so to 2 decimal places it's 3.14"
    },
    {
        "id": "diag_6",
        "question_text": "Which part of speech describes a noun?",
        "option_a": "Verb",
        "option_b": "Adjective",
        "option_c": "Adverb",
        "option_d": "Pronoun",
        "correct_answer": "B",
        "subject": "English",
        "difficulty": "easy",
        "explanation": "Adjectives describe or modify nouns (e.g., 'big' house, 'red' car)"
    },
    {
        "id": "diag_7",
        "question_text": "What is the formula for calculating density?",
        "option_a": "Mass × Volume",
        "option_b": "Mass ÷ Volume",
        "option_c": "Volume ÷ Mass",
        "option_d": "Mass + Volume",
        "correct_answer": "B",
        "subject": "Physics",
        "difficulty": "easy",
        "explanation": "Density = Mass / Volume (ρ = m/V)"
    },
    {
        "id": "diag_8",
        "question_text": "Which continent is Egypt located in?",
        "option_a": "Asia",
        "option_b": "Europe",
        "option_c": "Africa",
        "option_d": "South America",
        "correct_answer": "C",
        "subject": "Geography",
        "difficulty": "easy",
        "explanation": "Egypt is located in northeastern Africa"
    },
    {
        "id": "diag_9",
        "question_text": "What is the smallest prime number?",
        "option_a": "0",
        "option_b": "1",
        "option_c": "2",
        "option_d": "3",
        "correct_answer": "C",
        "subject": "Mathematics",
        "difficulty": "easy",
        "explanation": "2 is the smallest prime number (1 is not considered prime)"
    },
    {
        "id": "diag_10",
        "question_text": "Who wrote 'Things Fall Apart'?",
        "option_a": "Wole Soyinka",
        "option_b": "Chinua Achebe",
        "option_c": "Chimamanda Ngozi Adichie",
        "option_d": "Ben Okri",
        "correct_answer": "B",
        "subject": "Literature",
        "difficulty": "easy",
        "explanation": "Things Fall Apart (1958) is Chinua Achebe's most famous novel"
    }
]

onboarding_bp = Blueprint('onboarding', __name__)

def get_uid(): return get_jwt_identity()


@onboarding_bp.route('/status', methods=['GET'])
@jwt_required()
def get_status():
    uid = get_uid()
    user = User.query.get(uid)
    return success_response({
        'onboarding_completed': user.onboarding_completed,
        'onboarding_step': user.onboarding_step,
        'diagnostic_completed': user.diagnostic_completed,
        'data': {
            'full_name': user.full_name,
            'username': user.username,
            'class_level': user.class_level,
            'state': user.state,
            'school_name': user.school_name,
            'primary_exam': user.primary_exam,
            'exam_date': user.exam_date.isoformat() if user.exam_date else None,
            'subjects': user.subjects or [],
            'target_course': user.target_course,
            'target_university': user.target_university,
        }
    })


@onboarding_bp.route('/welcome', methods=['POST'])
@jwt_required()
def save_welcome():
    """Save user name from welcome screen and advance to step 2."""
    uid = get_uid()
    user = User.query.get(uid)
    data = request.get_json()
    
    # Save the user's username (distinct from full name used at registration)
    username = data.get('username') or data.get('display_name')
    if username:
        username = username.strip()
        # Ensure username is unique
        existing = User.query.filter(User.username == username, User.id != user.id).first()
        if existing:
            return error_response('Username already taken', 409)
        user.username = username

    # Only update full_name if explicitly provided and missing
    full_name = data.get('full_name')
    if full_name and not user.full_name:
        user.full_name = full_name.strip()
    
    # Advance onboarding step to 2 (exam selection)
    user.onboarding_step = max(user.onboarding_step or 1, 2)
    db.session.commit()
    
    return success_response({
        'onboarding_step': user.onboarding_step,
        'full_name': user.full_name,
        'username': user.username
    })


@onboarding_bp.route('/personal-setup', methods=['POST'])
@jwt_required()
def personal_setup():
    uid = get_uid()
    user = User.query.get(uid)
    data = request.get_json()
    user.class_level = data.get('class_level')
    user.state = data.get('state')
    user.school_name = data.get('school_name')
    user.onboarding_step = max(user.onboarding_step or 1, 2)
    db.session.commit()
    return success_response(user.to_dict())


@onboarding_bp.route('/exam-selection', methods=['POST'])
@jwt_required()
def exam_selection():
    uid = get_uid()
    user = User.query.get(uid)
    data = request.get_json()
    user.primary_exam = data.get('primary_exam')
    user.exam_date = data.get('exam_date')
    user.onboarding_step = max(user.onboarding_step or 1, 3)
    db.session.commit()
    return success_response(user.to_dict())


@onboarding_bp.route('/subject-selection', methods=['POST'])
@jwt_required()
def subject_selection():
    uid = get_uid()
    user = User.query.get(uid)
    data = request.get_json()
    raw_subjects = data.get('subjects', [])

    if not isinstance(raw_subjects, list):
        return error_response('subjects must be a list of strings', 422)

    exam_type = (user.primary_exam or '').upper()
    normalized_subjects = []

    english_aliases = {
        'english',
        'use of english',
        'english language',
        'englishlanguage',
        'useofenglish',
    }

    # Normalize subject labels and de-duplicate while preserving order.
    for s in raw_subjects:
        if not isinstance(s, str):
            continue
        cleaned = s.strip()
        lowered = cleaned.lower()

        if lowered in english_aliases:
            cleaned = 'English'

        if cleaned and cleaned not in normalized_subjects:
            normalized_subjects.append(cleaned)

    if exam_type == 'JAMB':
        if 'English' not in normalized_subjects:
            return error_response('JAMB requires English (Use of English)', 422)

        non_english = [s for s in normalized_subjects if s != 'English']
        if len(non_english) != 3:
            return error_response(
                'JAMB requires exactly English + 3 other subjects',
                422,
            )

        normalized_subjects = ['English'] + non_english

    elif exam_type in ('WAEC', 'NECO'):
        if len(normalized_subjects) > 9:
            return error_response('WAEC/NECO allows a maximum of 9 subjects', 422)

    elif exam_type == 'JUPEB':
        if len(normalized_subjects) != 3:
            return error_response('JUPEB requires exactly 3 subjects', 422)

    else:
        # If exam type is missing/unknown, only enforce the safest upper bound.
        if len(normalized_subjects) > 9:
            return error_response('Maximum subjects allowed is 9', 422)

    user.subjects = normalized_subjects
    user.target_course = data.get('target_course')
    user.target_university = data.get('target_university')
    user.onboarding_step = max(user.onboarding_step or 1, 4)
    db.session.commit()
    return success_response(user.to_dict())


@onboarding_bp.route('/diagnostic/start', methods=['POST'])
@jwt_required()
def start_diagnostic():
    uid = get_uid()
    user = User.query.get(uid)
    subjects = user.subjects or ['Mathematics', 'English']
    exam_type = user.primary_exam or 'JAMB'

    def expand_subject_terms(term: str):
        """
        Be forgiving about subject label differences.
        We try both exact matches and substring matches in the questions table.
        """
        if not isinstance(term, str):
            return []
        cleaned = term.strip()
        if not cleaned:
            return []

        out = set()
        out.add(cleaned)

        lower = cleaned.lower()
        # Drop parenthetical code, e.g. "Christian Religious Studies (CRS)" -> "Christian Religious Studies"
        if '(' in cleaned and ')' in cleaned:
            out.add(cleaned.split('(')[0].strip())

        # Common aliases
        if 'english' in lower:
            out.add('English')

        if 'crs' in lower or 'crk' in lower or 'christian religious' in lower:
            out.add('CRK')
            out.add('Christian Religious Studies')

        if 'irs' in lower or 'islamic religious' in lower:
            out.add('IRS')
            out.add('Islamic Religious Studies')

        # Ensure consistent capitalization (helps equality if DB uses titlecase)
        out.add(cleaned.title())

        return [t for t in out if t and len(t) > 1]

    subject_terms = []
    for s in (subjects or []):
        subject_terms.extend(expand_subject_terms(s))

    # Exact or partial subject matches.
    subject_clauses = []
    for t in set(subject_terms):
        subject_clauses.append(Question.subject == t)
        subject_clauses.append(Question.subject.ilike(f'%{t}%'))

    questions = Question.query.filter(
        Question.exam_type == exam_type,
        Question.is_active == True,
        or_(*subject_clauses) if subject_clauses else (Question.subject != None),
    ).order_by(db.func.random()).limit(10).all()

    # If no questions found in DB, use fallback questions filtered by user subjects
    if not questions:
        import random
        # Filter fallback questions to match user's subjects (case-insensitive)
        user_subjects_lower = [s.lower() for s in subjects]
        filtered_fallback = [
            q for q in FALLBACK_DIAGNOSTIC_QUESTIONS 
            if q['subject'].lower() in user_subjects_lower or 
               any(q['subject'].lower() in s for s in user_subjects_lower)
        ]
        # If no matches, use all fallback questions
        if not filtered_fallback:
            filtered_fallback = FALLBACK_DIAGNOSTIC_QUESTIONS
        
        # Shuffle and return up to 10 questions
        fallback = filtered_fallback.copy()
        random.shuffle(fallback)
        selected_questions = fallback[:10]
        
        return success_response({
            'session_type': 'diagnostic',
            'questions': selected_questions,
            'total': len(selected_questions),
            'fallback': True
        })

    return success_response({
        'session_type': 'diagnostic',
        'questions': [q.to_dict() for q in questions],
        'total': len(questions),
        'fallback': False
    })


@onboarding_bp.route('/diagnostic/submit', methods=['POST'])
@jwt_required()
def submit_diagnostic():
    uid = get_uid()
    user = User.query.get(uid)
    data = request.get_json()
    answers = data.get('answers', [])

    correct = 0
    for ans in answers:
        question_id = ans.get('question_id')
        selected_option = ans.get('selected_option')
        time_spent = ans.get('time_spent', 0)
        
        # Check if it's a fallback question first (starts with 'diag_')
        if question_id and question_id.startswith('diag_'):
            # Find in fallback questions
            fallback_q = next(
                (fq for fq in FALLBACK_DIAGNOSTIC_QUESTIONS if fq['id'] == question_id),
                None
            )
            if fallback_q:
                is_correct = selected_option == fallback_q['correct_answer']
                if is_correct:
                    correct += 1
                record_study_event(
                    user_id=uid,
                    action_type='diagnostic_answer_correct' if is_correct else 'diagnostic_answer_wrong',
                    subject=fallback_q.get('subject'),
                    topic=fallback_q.get('topic'),
                    difficulty=fallback_q.get('difficulty'),
                    is_correct=is_correct,
                    time_spent=time_spent,
                    metadata={'source': 'diagnostic_fallback'},
                )
        else:
            # Try to find in database (UUID)
            try:
                q = Question.query.get(question_id)
                if q:
                    is_correct = selected_option == q.correct_answer
                    if is_correct:
                        correct += 1

                    # Track performance + analytics
                    update_topic_performance(uid, q.id, is_correct, time_spent)
                    record_study_event(
                        user_id=uid,
                        action_type='diagnostic_answer_correct' if is_correct else 'diagnostic_answer_wrong',
                        subject=q.subject,
                        topic=q.topic,
                        difficulty=q.difficulty,
                        is_correct=is_correct,
                        time_spent=time_spent,
                        question_id=q.id,
                        metadata={'source': 'diagnostic'},
                    )
            except:
                # If DB query fails (invalid UUID format), skip this answer
                pass

    score = round(correct / len(answers) * 100) if answers else 0
    user.diagnostic_completed = True
    user.onboarding_step = 6  # Step 6 = diagnostic-intro completed, ready for analyzing/results

    # Mark referral as active if the referred user completed diagnostic
    referral = Referral.query.filter_by(referred_id=user.id).first()
    if referral and referral.status == 'signed_up':
        referral.status = 'active'

    db.session.commit()

    return success_response({
        'score': score,
        'correct': correct,
        'total': len(answers),
        'message': 'Diagnostic complete! Your study plan has been generated.'
    })


@onboarding_bp.route('/diagnostic/skip', methods=['POST'])
@jwt_required()
def skip_diagnostic():
    """Skip the diagnostic test and advance to results step."""
    uid = get_uid()
    user = User.query.get(uid)
    
    # Mark diagnostic as completed (skipped) and advance to step 6
    user.diagnostic_completed = True
    user.onboarding_step = 6  # Ready for analyzing/results

    referral = Referral.query.filter_by(referred_id=user.id).first()
    if referral and referral.status == 'signed_up':
        referral.status = 'active'
    db.session.commit()
    
    return success_response({
        'skipped': True,
        'onboarding_step': user.onboarding_step,
        'diagnostic_completed': user.diagnostic_completed
    })


@onboarding_bp.route('/habits', methods=['POST'])
@jwt_required()
def save_study_habits():
    """Save study habit preference and advance onboarding step."""
    uid = get_uid()
    user = User.query.get(uid)
    data = request.get_json()
    
    # Save the study habit (can be stored in user preferences or just acknowledged)
    # The habit itself is stored in localStorage by frontend
    # But we need to advance the onboarding step
    user.onboarding_step = max(user.onboarding_step or 1, 5)
    db.session.commit()
    
    return success_response({
        'onboarding_step': user.onboarding_step,
        'onboarding_completed': user.onboarding_completed
    })


@onboarding_bp.route('/complete', methods=['POST'])
@jwt_required()
def complete_onboarding():
    uid = get_uid()
    user = User.query.get(uid)
    user.onboarding_completed = True
    user.onboarding_step = 6

    referral = Referral.query.filter_by(referred_id=user.id).first()
    if referral and referral.status == 'signed_up':
        referral.status = 'active'
    db.session.commit()
    return success_response(user.to_dict(), message='Onboarding complete! Welcome to Beacon.')


# DEBUG: Temporary endpoint to force complete onboarding
@onboarding_bp.route('/force-complete', methods=['POST'])
@jwt_required()
def force_complete_onboarding():
    """Temporary debug endpoint to force complete onboarding"""
    uid = get_uid()
    user = User.query.get(uid)
    user.onboarding_completed = True
    user.onboarding_step = 6
    db.session.commit()
    return success_response({
        'message': 'Onboarding force completed!',
        'onboarding_completed': user.onboarding_completed,
        'onboarding_step': user.onboarding_step
    })


# DEBUG: Even simpler GET endpoint
@onboarding_bp.route('/debug-complete', methods=['GET'])
@jwt_required()
def debug_complete():
    """Debug endpoint to force complete onboarding via GET"""
    uid = get_uid()
    user = User.query.get(uid)
    user.onboarding_completed = True
    user.onboarding_step = 6
    db.session.commit()
    return success_response({
        'message': 'Debug: Onboarding completed!',
        'onboarding_completed': user.onboarding_completed,
        'onboarding_step': user.onboarding_step,
        'user_id': uid
    })
