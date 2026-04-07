from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models import User


def require_auth(f):
    """Require valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """Require admin privileges."""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


def require_subscription(tiers=None):
    """Require specific subscription tier(s)."""
    if tiers is None:
        tiers = ['beacon', 'luminary', 'north_star']

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            if user.subscription_tier not in tiers and not user.is_admin:
                return jsonify({
                    'error': 'Premium subscription required',
                    'required_tiers': tiers,
                    'current_tier': user.subscription_tier,
                    'upgrade_url': '/settings/subscription'
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
