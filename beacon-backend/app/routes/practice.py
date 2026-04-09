from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
import hashlib
import json
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import PracticeSession, SessionAnswer, Question, Bookmark, User, QuestionOptionExplanation
from ..utils.helpers import success_response, error_response, paginate_query
from ..services.ai_service import AIService

practice_bp = Blueprint('practice', __name__)


def get_uid():
    return get_jwt_identity()


def build_options_hash(question: Question) -> str:
    payload = {
        'question_text': question.question_text,
        'option_a': question.option_a,
        'option_b': question.option_b,
        'option_c': question.option_c,
        'option_d': question.option_d,
        'correct_answer': question.correct_answer,
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


def _fallback_option_explanation(question: Question, selected_option: str) -> str:
    correct = question.correct_answer
    correct_text = getattr(question, f'option_{correct.lower()}', '') or ''
    base = (question.explanation or '').strip()
    if not base:
        base = 'Match the option with the core concept and eliminate contradictions.'
    if selected_option == correct:
        return (
            f"Step 1: Your choice matches the concept tested in the question.\n"
            f"Step 2: {base}\n"
            f"Answer: Option {correct} — {correct_text}"
        )
    return (
        f"Step 1: The selected option does not satisfy the concept tested.\n"
        f"Step 2: {base}\n"
        f"Answer: Option {correct} — {correct_text}"
    )


@practice_bp.route('/sessions/jamb-full', methods=['POST'])
@jwt_required()
def create_jamb_full_session():
    """
    Create a real JAMB UTME full simulation session:
    - 180 questions total
    - English: 60
    - Each other selected subject: 40
    - Time limit: 120 minutes (7200 seconds)
    """
    uid = get_uid()
    user = User.query.get(uid)
    if not user:
        return error_response('User not found', 404)

    selected = user.subjects or []
    # We expect backend onboarding to store: ['English', <sub1>, <sub2>, <sub3>]
    other_subjects = [s for s in selected if s and s != 'English']
    if 'English' not in selected or len(other_subjects) != 3:
        return error_response(
            'JAMB full simulation requires English + exactly 3 subjects',
            422,
        )

    english_subject = 'English'
    counts = {
        english_subject: 60,
        other_subjects[0]: 40,
        other_subjects[1]: 40,
        other_subjects[2]: 40,
    }

    def fetch_questions_for_subject(subject_name: str, target_count: int):
        q_query = Question.query.filter_by(
            exam_type='JAMB',
            subject=subject_name,
            is_active=True,
            is_approved=True,
        ).order_by(db.func.random())

        qs = q_query.limit(target_count).all()
        if len(qs) >= target_count:
            return qs

        gap = target_count - len(qs)
        # Generate additional questions if the DB is short.
        # Topic is not strictly enforced in the prompt; we use a generic topic.
        generated = AIService.generate_questions(
            subject=subject_name,
            topic=subject_name,
            difficulty='medium',
            count=gap,
            exam_type='JAMB',
        )

        # Ensure we only return active/approved items.
        # generate_questions returns Question objects already saved.
        generated = [g for g in generated if g.is_active and g.is_approved]
        qs.extend(generated[:gap])
        return qs[:target_count]

    sections_order = [english_subject] + other_subjects
    sections = []
    flat_questions = []
    question_ids_in_order = []

    for section_subject in sections_order:
        sec_count = counts[section_subject]
        qs = fetch_questions_for_subject(section_subject, sec_count)
        sections.append({
            'subject': section_subject,
            'question_count': len(qs),
            # Include correct answers so results can be rendered at the end
            # without needing extra round-trips.
            'questions': [q.to_dict(include_answer=True) for q in qs],
            'unanswered': sec_count,  # updated client-side while answering
        })
        flat_questions.extend(qs)
        question_ids_in_order.extend([q.id for q in qs])

    session = PracticeSession(
        user_id=uid,
        mode='exam',
        practice_type='jamb_full',
        exam_type='JAMB',
        subject='Full',
        topic=None,
        year=None,
        difficulty=None,
        time_limit=7200,
        total_questions=len(question_ids_in_order),
    )
    session.question_ids = question_ids_in_order

    db.session.add(session)
    db.session.commit()

    # Return grouped questions + session id for the frontend.
    return success_response({
        'session': session.to_dict(),
        'sections': sections,
        'total_questions': len(question_ids_in_order),
        'time_limit_seconds': 7200,
    }, status_code=201)


@practice_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    """Create a new practice session."""
    uid = get_uid()
    data = request.get_json()

    session = PracticeSession(
        user_id=uid,
        mode=data.get('mode', 'practice'),
        practice_type=data.get('practice_type', 'subject_based'),
        exam_type=data.get('exam_type', 'JAMB'),
        subject=data.get('subject'),
        topic=data.get('topic'),
        year=data.get('year'),
        difficulty=data.get('difficulty'),
        time_limit=data.get('time_limit'),
        total_questions=data.get('total_questions', 40),
    )

    question_ids = data.get('question_ids') or []
    if isinstance(question_ids, list) and len(question_ids) > 0:
        # Build a session from explicit question ids (e.g. bookmarks).
        q_rows = Question.query.filter(
            Question.id.in_(question_ids),
            Question.is_active == True,
            Question.is_approved == True,
        ).all()

        q_map = {str(q.id): q for q in q_rows}
        ordered = [q_map.get(str(qid)) for qid in question_ids]
        questions = [q for q in ordered if q]

        if not questions:
            return error_response('No valid questions found', 422)

        session.question_ids = [q.id for q in questions]
        session.total_questions = len(questions)
        if not session.subject:
            session.subject = 'Bookmarks'

        db.session.add(session)
        db.session.commit()

        return success_response({
            'session': session.to_dict(),
            'questions': [q.to_dict(include_answer=True) for q in questions],
        }, status_code=201)

    # Fetch question IDs based on filters
    q_query = Question.query.filter_by(is_active=True, is_approved=True)
    if session.exam_type:  q_query = q_query.filter_by(exam_type=session.exam_type)
    if session.subject:    q_query = q_query.filter_by(subject=session.subject)
    if session.topic:      q_query = q_query.filter_by(topic=session.topic)
    if session.year:       q_query = q_query.filter_by(year=session.year)
    if session.difficulty: q_query = q_query.filter_by(difficulty=session.difficulty)

    questions = q_query.order_by(db.func.random()).limit(session.total_questions).all()
    session.question_ids = [q.id for q in questions]
    session.total_questions = len(questions)

    db.session.add(session)
    db.session.commit()

    return success_response({
        'session': session.to_dict(),
        # Include correct answers so the frontend can render feedback/results
        # and so scores/analytics work without extra round-trips.
        'questions': [q.to_dict(include_answer=True) for q in questions],
    }, status_code=201)


@practice_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get session history for current user."""
    uid = get_uid()
    page = request.args.get('page', 1, type=int)
    status = request.args.get('status')
    if status:
        status = status.lower()
    query = PracticeSession.query.filter_by(user_id=uid)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(
        PracticeSession.started_at.desc()
    )
    payload = paginate_query(query, page=page)
    payload['sessions'] = payload.get('items', [])
    return success_response(payload)


@practice_bp.route('/sessions/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    uid = get_uid()
    session = PracticeSession.query.filter_by(id=session_id, user_id=uid).first_or_404()
    return success_response(session.to_dict())


@practice_bp.route('/sessions/<session_id>/snapshot', methods=['GET'])
@jwt_required()
def get_session_snapshot(session_id):
    """
    Full snapshot for the practice history detail page:
    - includes topic breakdown
    - includes wrong questions (for review)
    - includes per-topic correct/total stats
    """
    uid = get_uid()
    session = PracticeSession.query.filter_by(id=session_id, user_id=uid).first_or_404()

    session_questions = Question.query.filter(
        Question.id.in_(session.question_ids or [])
    ).all()

    answers = SessionAnswer.query.filter_by(session_id=session.id, user_id=uid).all()
    answer_map = {a.question_id: a for a in answers}

    # Per-question computed correctness for unanswered questions.
    question_rows = []
    for q in session_questions:
        a = answer_map.get(q.id)
        selected = a.selected_option if a else None
        is_correct = bool(a.is_correct) if a else False
        question_rows.append({
            'id': str(q.id),
            'question_id': str(q.id),
            'text': q.question_text,
            'subject': q.subject,
            'topic': q.topic,
            'correctAnswer': q.correct_answer,
            'selectedOption': selected,
            'is_correct': is_correct,
            'explanation': q.explanation,
            'time_spent': a.time_spent if a else 0,
            'is_flagged': a.is_flagged if a else False,
            'is_bookmarked': getattr(a, 'is_bookmarked', False) if a else False,
        })

    # Topic breakdown
    topic_stats = {}
    for row in question_rows:
        key = row['topic'] or 'General'
        if key not in topic_stats:
            topic_stats[key] = {'topic': key, 'correct': 0, 'total': 0}
        topic_stats[key]['total'] += 1
        if row['is_correct']:
            topic_stats[key]['correct'] += 1

    topic_breakdown = list(topic_stats.values())
    # Keep stable ordering (alphabetical) for consistent UI.
    topic_breakdown.sort(key=lambda x: (x['topic'] or '').lower())

    # Wrong questions for review
    wrong_questions = [
        {
            'id': row['id'],
            'text': row['text'],
            'correctAnswer': row['correctAnswer'],
            'subject': row['subject'],
            'topic': row['topic'],
            'explanation': row['explanation'],
        }
        for row in question_rows
        if not row['is_correct']
    ]

    # Time pacing stats (only across answered questions with non-zero time)
    answered_times = [a.time_spent for a in answers if (a.time_spent is not None)]
    answered_times = [t for t in answered_times if t >= 0]
    if answered_times:
        fastest_s = min(answered_times)
        slowest_s = max(answered_times)
        avg_s = round(sum(answered_times) / len(answered_times))
        time_stats = {
            'fastest': f'{fastest_s}s',
            'slowest': f'{slowest_s}s',
            'average': f'{avg_s}s',
        }
    else:
        time_stats = {'fastest': '—', 'slowest': '—', 'average': '—'}

    # Friendly date label
    started = session.started_at.date() if session.started_at else date.today()
    today = date.today()
    diff_days = (today - started).days
    if diff_days == 0:
        date_label = 'Today'
    elif diff_days == 1:
        date_label = 'Yesterday'
    elif diff_days <= 6:
        date_label = 'This Week'
    else:
        date_label = started.isoformat()

    def format_time(seconds):
        if seconds is None:
            return '0s'
        secs = int(seconds)
        mins = secs // 60
        rem = secs % 60
        if mins <= 0:
            return f'{rem}s'
        return f'{mins}m {rem}s'

    snapshot_session = {
        'id': str(session.id),
        'mode': session.mode,
        'subject': session.subject,
        'topic': session.topic,
        'year': session.year,
        'score': session.score or 0,
        'correct': session.correct or 0,
        'total': session.total_questions or len(session_questions),
        'time': format_time(session.time_used),
        'date': date_label,
        'topicBreakdown': topic_breakdown,
        'timeStats': time_stats,
        'wrongQuestions': wrong_questions,
    }

    return success_response({
        'session': snapshot_session,
        'questions': question_rows,
    })


@practice_bp.route('/sessions/<session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    """Save session progress (time_used, etc.)."""
    uid = get_uid()
    session = PracticeSession.query.filter_by(id=session_id, user_id=uid).first_or_404()
    data = request.get_json()
    if 'time_used' in data:
        session.time_used = data['time_used']
    db.session.commit()
    return success_response(session.to_dict())


@practice_bp.route('/sessions/<session_id>/answers', methods=['POST'])
@jwt_required()
def submit_answer(session_id):
    """Submit an answer to a question in a session."""
    uid = get_uid()
    session = PracticeSession.query.filter_by(id=session_id, user_id=uid).first_or_404()
    data = request.get_json()

    question_id      = data.get('question_id')
    selected_option  = data.get('selected_option')
    time_spent       = data.get('time_spent', 0)

    question = Question.query.get_or_404(question_id)
    is_correct = selected_option == question.correct_answer

    answer = SessionAnswer(
        session_id=session.id,
        user_id=uid,
        question_id=question_id,
        selected_option=selected_option,
        is_correct=is_correct,
        time_spent=time_spent,
        is_flagged=data.get('is_flagged', False),
    )

    session.answered = (session.answered or 0) + 1
    if is_correct:
        session.correct = (session.correct or 0) + 1

    # Update question stats
    question.times_answered = (question.times_answered or 0) + 1
    if is_correct:
        question.times_correct = (question.times_correct or 0) + 1
    question.pass_rate = question.times_correct / question.times_answered

    db.session.add(answer)
    
    # ═══════════════════════════════════════════════════════
    # AUTO-TRACK PERFORMANCE (FIX 4: WEAK AREAS)
    # ═══════════════════════════════════════════════════════
    from ..services.performance_service import (
        update_topic_performance, record_study_event, award_points
    )
    
    # Update topic performance automatically
    perf = update_topic_performance(uid, question_id, is_correct, time_spent)
    
    # Record study event for analytics
    action_type = 'answer_correct' if is_correct else 'answer_wrong'
    record_study_event(
        user_id=uid,
        action_type=action_type,
        subject=question.subject,
        topic=question.topic,
        difficulty=question.difficulty,
        is_correct=is_correct,
        time_spent=time_spent,
        session_id=session.id,
        question_id=question_id,
    )
    
    # Award points for correct answers
    points_earned = 0
    xp_breakdown = []
    if is_correct:
        points_earned = 10
        xp_breakdown.append({'label': 'Correct Answer', 'value': 10})
        if time_spent and time_spent < 30:
            points_earned += 5
            xp_breakdown.append({'label': '⚡ Speed Bonus', 'value': 5})
        award_points(uid, points_earned, 'correct_answer', f'Correct answer in {session.mode} mode')

    db.session.commit()

    # ═══════════════════════════════════════════════════════
    # AUTO-ENRICHMENT PIPELINE (HF AI)
    # ═══════════════════════════════════════════════════════
    if not getattr(question, 'hf_enriched', False):
        try:
            from celery_worker import enrich_question_async
            enrich_question_async.delay(str(question.id))
        except Exception:
            pass

    return success_response({
        'is_correct': is_correct,
        'correct_answer': question.correct_answer,
        'explanation': question.explanation,
        'explanation_steps': question.explanation_steps,
        'common_mistake': question.common_mistake,
        'topic_performance': perf.to_dict() if perf else None,
        # ✨ Mimo-style: XP data for frontend animation
        'points_earned': points_earned,
        'xp_breakdown': xp_breakdown,
    })


@practice_bp.route('/questions/<question_id>/explanation', methods=['POST'])
@jwt_required()
def get_option_explanation(question_id):
    """Return (and cache) AI explanation tailored to the selected option."""
    data = request.get_json() or {}
    selected_option = (data.get('selected_option') or '').strip().upper()
    if selected_option not in ['A', 'B', 'C', 'D']:
        return error_response('selected_option must be A, B, C, or D', 422)

    question = Question.query.get_or_404(question_id)
    options_hash = build_options_hash(question)

    existing = QuestionOptionExplanation.query.filter_by(
        question_id=question.id,
        selected_option=selected_option,
        options_hash=options_hash,
    ).first()

    if existing:
        existing.use_count = (existing.use_count or 0) + 1
        existing.last_used_at = datetime.utcnow()
        db.session.commit()
        return success_response({
            'explanation': existing.explanation_text,
            'cached': True,
            'selected_option': selected_option,
            'correct_option': question.correct_answer,
        })

    selected_text = getattr(question, f'option_{selected_option.lower()}', '') or ''
    correct_option = question.correct_answer
    correct_text = getattr(question, f'option_{correct_option.lower()}', '') or ''

    system_prompt = (
        'You are a concise Nigerian exam tutor. Follow the formatting rules exactly. '
        'Do not ask follow-up questions.'
    )

    prompt = f"""Explain the student's selected option for this question.

Question: {question.question_text}
Options:
A) {question.option_a}
B) {question.option_b}
C) {question.option_c}
D) {question.option_d}

Student selected: {selected_option}) {selected_text}
Correct answer: {correct_option}) {correct_text}

Rules:
- Use short sentences.
- If this is not a calculation, steps are ordered reasoning points.
- If the selected option is wrong, mention why it is wrong and why the correct option is right.
- Use 2-4 steps.
- Format exactly as:
Step 1: ...
Step 2: ...
Step 3: ...
Answer: Option {correct_option} — <short reason>.
- Do not ask any follow-up questions.
"""

    explanation_text = None
    model_name = None
    try:
        response = AIService.execute_groq_with_fallback(
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt},
            ],
            stream=False,
            max_tokens=700,
            temperature=0.4,
        )
        if response and response.choices:
            explanation_text = (response.choices[0].message.content or '').strip()
            model_name = getattr(response, 'model', None)
    except Exception:
        explanation_text = None

    if not explanation_text:
        explanation_text = _fallback_option_explanation(question, selected_option)

    if 'answer:' not in explanation_text.lower():
        explanation_text = explanation_text.rstrip() + f"\nAnswer: Option {correct_option} — {correct_text}"

    record = QuestionOptionExplanation(
        question_id=question.id,
        selected_option=selected_option,
        correct_option=correct_option,
        option_text=selected_text,
        explanation_text=explanation_text,
        options_hash=options_hash,
        model_name=model_name,
        created_by='ai',
        use_count=1,
        last_used_at=datetime.utcnow(),
    )

    try:
        db.session.add(record)
        db.session.commit()
        return success_response({
            'explanation': explanation_text,
            'cached': False,
            'selected_option': selected_option,
            'correct_option': correct_option,
        })
    except IntegrityError:
        db.session.rollback()
        existing = QuestionOptionExplanation.query.filter_by(
            question_id=question.id,
            selected_option=selected_option,
            options_hash=options_hash,
        ).first()
        if existing:
            existing.use_count = (existing.use_count or 0) + 1
            existing.last_used_at = datetime.utcnow()
            db.session.commit()
            return success_response({
                'explanation': existing.explanation_text,
                'cached': True,
                'selected_option': selected_option,
                'correct_option': correct_option,
            })

    return success_response({
        'explanation': explanation_text,
        'cached': False,
        'selected_option': selected_option,
        'correct_option': correct_option,
    })


@practice_bp.route('/sessions/<session_id>/complete', methods=['POST'])
@jwt_required()
def complete_session(session_id):
    """Mark session as complete and return Mimo-style celebration payload."""
    uid = get_uid()
    session = PracticeSession.query.filter_by(id=session_id, user_id=uid).first_or_404()

    session.status = 'completed'
    session.completed_at = datetime.utcnow()
    correct = session.correct or 0
    total = session.total_questions or 1
    session.score = round(correct / total * 100, 1)
    db.session.commit()

    # ── Streak check-in ─────────────────────────────────────
    from ..services.streak_service import StreakService
    minutes = (session.time_used or 0) // 60
    streak = StreakService.record_study_activity(uid, session.answered or 0, minutes)

    # ── League rank snapshot ─────────────────────────────────
    from ..services.league_service import get_or_create_room
    from ..models import LeagueMember, LeagueRoom
    user = User.query.get(uid)
    league_info = None
    try:
        room = get_or_create_room(uid)
        if room:
            members = LeagueMember.query.filter_by(room_id=room.id).order_by(
                LeagueMember.points.desc()
            ).all()
            my_rank = next(
                (i + 1 for i, m in enumerate(members) if str(m.user_id) == str(uid)),
                None
            )
            my_member = next(
                (m for m in members if str(m.user_id) == str(uid)), None
            )
            league_info = {
                'tier': room.tier,
                'rank': my_rank,
                'total_in_room': len(members),
                'weekly_points': my_member.points if my_member else 0,
            }
    except Exception:
        pass

    # ── XP & bonus calculation for the celebration screen ───
    accuracy = session.score or 0
    session_xp = correct * 10  # Base XP already awarded per-answer
    completion_bonus = 0
    bonuses = []

    if accuracy == 100:
        completion_bonus += 50
        bonuses.append({'label': '🏆 Perfect Score!', 'value': 50})
    elif accuracy >= 80:
        completion_bonus += 20
        bonuses.append({'label': '🌟 High Accuracy', 'value': 20})

    if total >= 40:
        completion_bonus += 10
        bonuses.append({'label': '💪 Full Quiz', 'value': 10})

    if completion_bonus > 0:
        from ..services.performance_service import award_points
        award_points(uid, completion_bonus, 'session_bonus', f'Session completion bonus')

    # ── 🎉 Celebration payload ───────────────────────────────
    return success_response({
        'session': session.to_dict(),
        'streak': streak.to_dict() if streak else None,
        # Mimo-style end screen data:
        'celebration': {
            'correct': correct,
            'total': total,
            'accuracy': accuracy,
            'xp_earned': session_xp + completion_bonus,
            'base_xp': session_xp,
            'bonuses': bonuses,
            'total_points_balance': (user.points_balance if user else 0),
            'league': league_info,
            'streak_count': streak.current_streak if streak else 0,
            'grade': (
                'S' if accuracy == 100 else
                'A' if accuracy >= 90 else
                'B' if accuracy >= 75 else
                'C' if accuracy >= 60 else
                'D'
            ),
        },
    })


@practice_bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def abandon_session(session_id):
    uid = get_uid()
    session = PracticeSession.query.filter_by(id=session_id, user_id=uid).first_or_404()
    session.status = 'abandoned'
    session.completed_at = datetime.utcnow()
    db.session.commit()
    return success_response(message='Session abandoned')


@practice_bp.route('/resume', methods=['GET'])
@jwt_required()
def resume_session():
    """Get any in-progress session for the current user."""
    uid = get_uid()
    session = PracticeSession.query.filter_by(
        user_id=uid, status='in_progress'
    ).order_by(PracticeSession.started_at.desc()).first()
    if not session:
        return success_response(None)
    return success_response(session.to_dict())


@practice_bp.route('/bookmarks', methods=['GET'])
@jwt_required()
def get_bookmarks():
    uid = get_uid()
    bookmarks = Bookmark.query.filter_by(user_id=uid).all()
    return success_response([b.question.to_dict(include_answer=True) for b in bookmarks])


@practice_bp.route('/bookmarks/<question_id>', methods=['POST'])
@jwt_required()
def add_bookmark(question_id):
    uid = get_uid()
    existing = Bookmark.query.filter_by(user_id=uid, question_id=question_id).first()
    if existing:
        return success_response(message='Already bookmarked')
    b = Bookmark(user_id=uid, question_id=question_id)
    db.session.add(b)
    db.session.commit()
    return success_response(message='Bookmarked', status_code=201)


@practice_bp.route('/bookmarks/<question_id>', methods=['DELETE'])
@jwt_required()
def remove_bookmark(question_id):
    uid = get_uid()
    b = Bookmark.query.filter_by(user_id=uid, question_id=question_id).first()
    if b:
        db.session.delete(b)
        db.session.commit()
    return success_response(message='Bookmark removed')
