from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..extensions import db
from ..models import (
    Flashcard, FlashcardDeck, FlashcardReview, 
    Document, Question, PracticeSession, SessionAnswer
)
from ..utils.helpers import success_response, error_response, paginate_query
from ..services.ai_service import AIService

flashcards_bp = Blueprint('flashcards', __name__)


def get_uid():
    return get_jwt_identity()


# ═══════════════════════════════════════════════════════
# DECK MANAGEMENT
# ═══════════════════════════════════════════════════════

@flashcards_bp.route('/decks', methods=['GET'])
@jwt_required()
def list_decks():
    """Get all flashcard decks for the current user."""
    uid = get_uid()
    page = request.args.get('page', 1, type=int)
    subject = request.args.get('subject')
    
    query = FlashcardDeck.query.filter_by(user_id=uid, is_active=True)
    if subject:
        query = query.filter_by(subject=subject)
    
    query = query.order_by(FlashcardDeck.updated_at.desc())
    return success_response(paginate_query(query, page=page))


@flashcards_bp.route('/decks', methods=['POST'])
@jwt_required()
def create_deck():
    """Create a new flashcard deck."""
    uid = get_uid()
    data = request.get_json()
    
    deck = FlashcardDeck(
        user_id=uid,
        name=data.get('name'),
        description=data.get('description'),
        subject=data.get('subject'),
        topic=data.get('topic'),
        source_type=data.get('source_type', 'manual'),
        source_id=data.get('source_id'),
    )
    db.session.add(deck)
    db.session.commit()
    
    return success_response(deck.to_dict(), status_code=201)


@flashcards_bp.route('/decks/<deck_id>', methods=['GET'])
@jwt_required()
def get_deck(deck_id):
    """Get a specific deck with all its cards."""
    uid = get_uid()
    deck = FlashcardDeck.query.filter_by(id=deck_id, user_id=uid).first_or_404()
    return success_response(deck.to_dict(include_cards=True))


@flashcards_bp.route('/decks/<deck_id>', methods=['PUT'])
@jwt_required()
def update_deck(deck_id):
    """Update deck details."""
    uid = get_uid()
    deck = FlashcardDeck.query.filter_by(id=deck_id, user_id=uid).first_or_404()
    
    data = request.get_json()
    deck.name = data.get('name', deck.name)
    deck.description = data.get('description', deck.description)
    deck.subject = data.get('subject', deck.subject)
    deck.topic = data.get('topic', deck.topic)
    
    db.session.commit()
    return success_response(deck.to_dict())


@flashcards_bp.route('/decks/<deck_id>', methods=['DELETE'])
@jwt_required()
def delete_deck(deck_id):
    """Soft-delete a deck."""
    uid = get_uid()
    deck = FlashcardDeck.query.filter_by(id=deck_id, user_id=uid).first_or_404()
    deck.is_active = False
    db.session.commit()
    return success_response(message='Deck deleted')


# ═══════════════════════════════════════════════════════
# FLASHCARD CRUD
# ═══════════════════════════════════════════════════════

@flashcards_bp.route('/decks/<deck_id>/cards', methods=['POST'])
@jwt_required()
def create_card(deck_id):
    """Add a new flashcard to a deck."""
    uid = get_uid()
    deck = FlashcardDeck.query.filter_by(id=deck_id, user_id=uid).first_or_404()
    
    data = request.get_json()
    card = Flashcard(
        deck_id=deck_id,
        user_id=uid,
        front=data.get('front'),
        back=data.get('back'),
        hint=data.get('hint'),
        context=data.get('context'),
        source_type=data.get('source_type', 'manual'),
        source_id=data.get('source_id'),
    )
    
    db.session.add(card)
    db.session.commit()
    
    # Update deck stats
    deck.update_stats()
    db.session.commit()
    
    return success_response(card.to_dict(), status_code=201)


@flashcards_bp.route('/cards/<card_id>', methods=['GET'])
@jwt_required()
def get_card(card_id):
    """Get a specific flashcard."""
    uid = get_uid()
    card = Flashcard.query.filter_by(id=card_id, user_id=uid).first_or_404()
    return success_response(card.to_dict(include_reviews=True))


@flashcards_bp.route('/cards/<card_id>', methods=['PUT'])
@jwt_required()
def update_card(card_id):
    """Update a flashcard."""
    uid = get_uid()
    card = Flashcard.query.filter_by(id=card_id, user_id=uid).first_or_404()
    
    data = request.get_json()
    card.front = data.get('front', card.front)
    card.back = data.get('back', card.back)
    card.hint = data.get('hint', card.hint)
    card.context = data.get('context', card.context)
    card.is_suspended = data.get('is_suspended', card.is_suspended)
    
    db.session.commit()
    return success_response(card.to_dict())


@flashcards_bp.route('/cards/<card_id>', methods=['DELETE'])
@jwt_required()
def delete_card(card_id):
    """Delete a flashcard."""
    uid = get_uid()
    card = Flashcard.query.filter_by(id=card_id, user_id=uid).first_or_404()
    deck_id = card.deck_id
    
    db.session.delete(card)
    db.session.commit()
    
    # Update deck stats
    deck = FlashcardDeck.query.get(deck_id)
    if deck:
        deck.update_stats()
        db.session.commit()
    
    return success_response(message='Card deleted')


# ═══════════════════════════════════════════════════════
# SPACED REPETITION STUDY SESSION
# ═══════════════════════════════════════════════════════

@flashcards_bp.route('/study', methods=['GET'])
@jwt_required()
def get_due_cards():
    """
    Get all cards due for review across all decks.
    Returns cards sorted by urgency (overdue first).
    """
    uid = get_uid()
    
    now = datetime.utcnow()
    
    # Get all due cards
    due_cards = Flashcard.query.filter(
        Flashcard.user_id == uid,
        Flashcard.is_suspended == False,
        Flashcard.is_mastered == False,
        Flashcard.next_review_at <= now
    ).order_by(Flashcard.next_review_at.asc()).all()
    
    return success_response({
        'total_due': len(due_cards),
        'cards': [c.to_dict() for c in due_cards[:50]],  # Limit to 50 per session
    })


@flashcards_bp.route('/decks/<deck_id>/study', methods=['GET'])
@jwt_required()
def get_deck_due_cards(deck_id):
    """Get due cards from a specific deck."""
    uid = get_uid()
    deck = FlashcardDeck.query.filter_by(id=deck_id, user_id=uid).first_or_404()
    
    now = datetime.utcnow()
    due_cards = deck.cards.filter(
        Flashcard.is_suspended == False,
        Flashcard.is_mastered == False,
        Flashcard.next_review_at <= now
    ).order_by(Flashcard.next_review_at.asc()).all()
    
    return success_response({
        'deck': deck.to_dict(),
        'total_due': len(due_cards),
        'cards': [c.to_dict() for c in due_cards],
    })


@flashcards_bp.route('/cards/<card_id>/review', methods=['POST'])
@jwt_required()
def review_card(card_id):
    """
    Submit a review for a flashcard.
    
    Quality rating (0-5):
    0 = Complete blackout
    1 = Incorrect, but recognized the answer
    2 = Incorrect, but seemed easy
    3 = Correct with serious difficulty
    4 = Correct with hesitation
    5 = Perfect response
    """
    uid = get_uid()
    card = Flashcard.query.filter_by(id=card_id, user_id=uid).first_or_404()
    
    data = request.get_json()
    quality = data.get('quality')
    time_spent = data.get('time_spent')
    
    if quality is None or not (0 <= quality <= 5):
        return error_response('Quality must be 0-5', 422)
    
    # Record the review
    review = FlashcardReview(
        flashcard_id=card_id,
        user_id=uid,
        quality=quality,
        time_spent=time_spent,
        interval_before=card.interval,
        ease_factor_before=card.ease_factor,
    )
    db.session.add(review)
    
    # Apply SM-2 algorithm
    new_interval = card.apply_review(quality)
    
    db.session.commit()
    
    # Update deck stats
    deck = FlashcardDeck.query.get(card.deck_id)
    if deck:
        deck.update_stats()
        db.session.commit()
    
    return success_response({
        'card': card.to_dict(),
        'new_interval': new_interval,
        'next_review': card.next_review_at.isoformat() if card.next_review_at else None,
    })


# ═══════════════════════════════════════════════════════
# FLASHCARD STATS & ANALYTICS
# ═══════════════════════════════════════════════════════

@flashcards_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get overall flashcard statistics for the user."""
    uid = get_uid()
    
    total_cards = Flashcard.query.filter_by(user_id=uid).count()
    mastered = Flashcard.query.filter_by(user_id=uid, is_mastered=True).count()
    
    now = datetime.utcnow()
    due_today = Flashcard.query.filter(
        Flashcard.user_id == uid,
        Flashcard.is_suspended == False,
        Flashcard.is_mastered == False,
        Flashcard.next_review_at <= now
    ).count()
    
    # Due in next 7 days
    week_ahead = now + timedelta(days=7)
    due_this_week = Flashcard.query.filter(
        Flashcard.user_id == uid,
        Flashcard.is_suspended == False,
        Flashcard.is_mastered == False,
        Flashcard.next_review_at <= week_ahead,
        Flashcard.next_review_at > now
    ).count()
    
    # Total reviews today
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    reviews_today = FlashcardReview.query.filter(
        FlashcardReview.user_id == uid,
        FlashcardReview.created_at >= today_start
    ).count()
    
    return success_response({
        'total_cards': total_cards,
        'mastered_cards': mastered,
        'mastery_percentage': round((mastered / max(total_cards, 1)) * 100, 1),
        'due_today': due_today,
        'due_this_week': due_this_week,
        'reviews_today': reviews_today,
    })


@flashcards_bp.route('/decks/<deck_id>/stats', methods=['GET'])
@jwt_required()
def get_deck_stats(deck_id):
    """Get detailed stats for a specific deck."""
    uid = get_uid()
    deck = FlashcardDeck.query.filter_by(id=deck_id, user_id=uid).first_or_404()
    
    cards = deck.cards.all()
    
    # Calculate mastery distribution
    distribution = {
        'new': 0,  # 0 reviews
        'learning': 0,  # < 5 reps
        'review': 0,  # >= 5 reps, not mastered
        'mastered': 0,
        'suspended': 0,
    }
    
    for card in cards:
        if card.is_suspended:
            distribution['suspended'] += 1
        elif card.is_mastered:
            distribution['mastered'] += 1
        elif card.repetitions >= 5:
            distribution['review'] += 1
        elif card.repetitions > 0:
            distribution['learning'] += 1
        else:
            distribution['new'] += 1
    
    # Review history (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    reviews = FlashcardReview.query.join(Flashcard).filter(
        Flashcard.deck_id == deck_id,
        FlashcardReview.created_at >= thirty_days_ago
    ).all()
    
    daily_reviews = {}
    for review in reviews:
        day = review.created_at.strftime('%Y-%m-%d')
        if day not in daily_reviews:
            daily_reviews[day] = {'count': 0, 'avg_quality': 0}
        daily_reviews[day]['count'] += 1
    
    return success_response({
        'deck': deck.to_dict(),
        'distribution': distribution,
        'daily_reviews': daily_reviews,
    })


# ═══════════════════════════════════════════════════════
# AI GENERATION ENDPOINTS
# ═══════════════════════════════════════════════════════

@flashcards_bp.route('/generate/topic', methods=['POST'])
@jwt_required()
def generate_from_topic():
    """Generate flashcards for a topic using AI."""
    uid = get_uid()
    data = request.get_json()
    
    subject = data.get('subject')
    topic = data.get('topic')
    count = min(data.get('count', 10), 30)
    
    if not subject or not topic:
        return error_response('Subject and topic required', 422)
    
    # Create deck
    deck = FlashcardDeck(
        user_id=uid,
        name=f'{topic} Flashcards',
        subject=subject,
        topic=topic,
        source_type='ai_generated',
    )
    db.session.add(deck)
    db.session.flush()
    
    # Generate cards with AI
    prompt = f"""Create {count} flashcards for studying {topic} in {subject} at JAMB/WAEC level.

Each flashcard should have:
- Front: Question or concept to recall
- Back: Clear, concise answer
- Hint: Optional memory trigger

Format as JSON array:
[{{
  "front": "...",
  "back": "...",
  "hint": "..."
}}]

Focus on high-yield exam concepts, common mistakes, and key formulas."""

    try:
        ai_response = AIService.generate_text(prompt)
        cards_data = ai_response if isinstance(ai_response, list) else []
        
        for card_data in cards_data[:count]:
            card = Flashcard(
                deck_id=deck.id,
                user_id=uid,
                front=card_data.get('front'),
                back=card_data.get('back'),
                hint=card_data.get('hint'),
                source_type='ai_generated',
            )
            db.session.add(card)
        
        db.session.commit()
        deck.update_stats()
        db.session.commit()
        
        return success_response(deck.to_dict(include_cards=True), status_code=201)
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to generate cards: {str(e)}', 500)


@flashcards_bp.route('/save/ai-tutor', methods=['POST'])
@jwt_required()
def save_from_ai_tutor():
    """Save a concept from AI tutor conversation as flashcard."""
    uid = get_uid()
    data = request.get_json()
    
    conversation_id = data.get('conversation_id')
    concept = data.get('concept')
    explanation = data.get('explanation')
    deck_id = data.get('deck_id')
    
    # Use existing deck or create new
    if deck_id:
        deck = FlashcardDeck.query.filter_by(id=deck_id, user_id=uid).first_or_404()
    else:
        deck = FlashcardDeck(
            user_id=uid,
            name=f'AI Tutor: {concept}',
            source_type='ai_tutor',
            source_id=conversation_id,
        )
        db.session.add(deck)
        db.session.flush()
    
    # Create flashcard
    card = Flashcard(
        deck_id=deck.id,
        user_id=uid,
        front=f"What is {concept}?",
        back=explanation,
        source_type='ai_tutor',
        source_id=conversation_id,
    )
    db.session.add(card)
    db.session.commit()
    
    deck.update_stats()
    db.session.commit()
    
    return success_response(card.to_dict(), status_code=201)


@flashcards_bp.route('/save/wrong-answer', methods=['POST'])
@jwt_required()
def save_from_wrong_answer():
    """Save a wrong practice answer as flashcard for review."""
    uid = get_uid()
    data = request.get_json()
    
    question_id = data.get('question_id')
    deck_id = data.get('deck_id')
    
    # Get the question
    question = Question.query.get_or_404(question_id)
    
    # Use existing deck or create new
    if deck_id:
        deck = FlashcardDeck.query.filter_by(id=deck_id, user_id=uid).first_or_404()
    else:
        deck = FlashcardDeck(
            user_id=uid,
            name=f'Wrong Answers: {question.subject}',
            subject=question.subject,
            topic=question.topic,
            source_type='wrong_answer',
        )
        db.session.add(deck)
        db.session.flush()
    
    # Create flashcard
    card = Flashcard(
        deck_id=deck.id,
        user_id=uid,
        front=question.question_text,
        back=f"Correct answer: {question.correct_answer}\n\n{question.explanation}",
        context=f"Topic: {question.topic} | Difficulty: {question.difficulty}",
        source_type='wrong_answer',
        source_id=question_id,
    )
    db.session.add(card)
    db.session.commit()
    
    deck.update_stats()
    db.session.commit()
    
    return success_response(card.to_dict(), status_code=201)
