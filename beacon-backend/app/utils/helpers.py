import random
import string
from datetime import datetime


def utc_iso(dt):
    """Return an ISO-8601 UTC string with Z suffix so browsers parse it correctly.
    Without 'Z', browsers in UTC+1 (e.g. Nigeria) treat the timestamp as local
    time, causing a systematic 1-hour shift in all displayed relative times.
    """
    if dt is None:
        return None
    return dt.isoformat() + 'Z'


def generate_otp(length=6):
    """Generate a numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def generate_referral_code(name=None, length=8):
    """Generate a referral code. If name is provided, use a name-based prefix."""
    if name:
        cleaned = ''.join([c for c in name if c.isalnum()])
        prefix = (cleaned[:3] or 'REF').upper()
        suffix = ''.join(random.choices(string.digits, k=4))
        return f"{prefix}{suffix}"
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))


def paginate_query(query, page=1, per_page=20):
    """Paginate a SQLAlchemy query."""
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'items': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    }


def format_kobo(kobo_amount):
    """Format kobo amount to Nigerian Naira string."""
    naira = kobo_amount / 100
    return f"₦{naira:,.0f}"


def success_response(data=None, message=None, status_code=200):
    resp = {'success': True}
    if message:
        resp['message'] = message
    if data is not None:
        resp['data'] = data
    return resp, status_code


def error_response(message, status_code=400, errors=None):
    resp = {'success': False, 'error': message}
    if errors:
        resp['errors'] = errors
    return resp, status_code
