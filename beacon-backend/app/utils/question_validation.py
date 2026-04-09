import os
from flask import current_app

import json
import hashlib

VALID_OPTION_LETTERS = ('A', 'B', 'C', 'D')


def _normalize_text(value):
    if value is None:
        return ''
    return str(value).strip()


def is_question_structurally_valid(question):
    """Return True if the question has valid text + options (ignores correct answer)."""
    if question is None:
        return False

    question_text = _normalize_text(getattr(question, 'question_text', ''))
    if len(question_text) < 5:
        return False

    options = [
        _normalize_text(getattr(question, 'option_a', None)),
        _normalize_text(getattr(question, 'option_b', None)),
        _normalize_text(getattr(question, 'option_c', None)),
        _normalize_text(getattr(question, 'option_d', None)),
    ]
    if any(not opt for opt in options):
        return False

    # Reject duplicate options (often a sign of corruption)
    normalized = [opt.lower() for opt in options]
    if len(set(normalized)) < 4:
        return False

    return True


def is_question_valid(question):
    """Return True if the question has valid text, options, and correct answer."""
    if not is_question_structurally_valid(question):
        return False

    correct = _normalize_text(getattr(question, 'correct_answer', '')).upper()
    if correct not in VALID_OPTION_LETTERS:
        return False

    correct_text = _normalize_text(getattr(question, f'option_{correct.lower()}', None))
    if not correct_text:
        return False

    return True


def build_options_only_hash(question) -> str:
    payload = {
        'question_text': _normalize_text(getattr(question, 'question_text', '')),
        'option_a': _normalize_text(getattr(question, 'option_a', '')),
        'option_b': _normalize_text(getattr(question, 'option_b', '')),
        'option_c': _normalize_text(getattr(question, 'option_c', '')),
        'option_d': _normalize_text(getattr(question, 'option_d', '')),
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


def build_answer_line(question):
    """Build a safe Answer: line based on DB correct answer."""
    correct = _normalize_text(getattr(question, 'correct_answer', '')).upper()
    if correct not in VALID_OPTION_LETTERS:
        return None
    correct_text = _normalize_text(getattr(question, f'option_{correct.lower()}', None))
    if not correct_text:
        return None
    return f"Answer: Option {correct} — {correct_text}"


def quarantine_questions(questions, reason='invalid_question'):
    """Mark invalid questions inactive so they stop surfacing."""
    if not questions:
        return 0
    flag = os.getenv('AUTO_QUARANTINE_INVALID_QUESTIONS', '1').strip().lower()
    if flag not in ['1', 'true', 'yes']:
        return 0

    updated = 0
    for q in questions:
        if not getattr(q, 'is_active', True) and not getattr(q, 'is_approved', True):
            continue
        try:
            q.is_active = False
            q.is_approved = False
            updated += 1
        except Exception:
            continue

    try:
        if updated > 0:
            current_app.logger.warning(
                "Quarantined %s question(s) due to %s",
                updated,
                reason,
            )
    except Exception:
        pass

    return updated
