from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from ..extensions import db, bcrypt
from ..models import User, Streak, NotificationPreference, Referral
from ..utils.helpers import generate_otp, generate_referral_code, success_response, error_response
from ..services.performance_service import award_points
from ..extensions import redis_client
import uuid
import re

auth_bp = Blueprint('auth', __name__)

REFERRAL_SIGNUP_POINTS = 200


def validate_email(email):
    return bool(re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email))

def validate_phone(phone):
    return bool(re.match(r'^(\+234|0)[789][01]\d{8}$', phone))

def _generate_unique_referral_code(full_name):
    for _ in range(10):
        code = generate_referral_code(full_name)
        if not User.query.filter_by(referral_code=code).first():
            return code
    while True:
        code = generate_referral_code()
        if not User.query.filter_by(referral_code=code).first():
            return code

def _apply_referral_code(referred_user, raw_code):
    code = (raw_code or '').strip().upper()
    if not code:
        return None

    if referred_user.referral_code and code == referred_user.referral_code:
        return None

    referrer = User.query.filter_by(referral_code=code).first()
    if not referrer or str(referrer.id) == str(referred_user.id):
        return None

    existing = Referral.query.filter_by(referred_id=referred_user.id).first()
    if existing:
        return existing

    referral = Referral(
        referrer_id=referrer.id,
        referred_id=referred_user.id,
        referral_code=code,
        status='signed_up',
        points_awarded=0,
    )
    db.session.add(referral)

    award_points(
        referrer.id,
        REFERRAL_SIGNUP_POINTS,
        'referral_signup',
        f'{referred_user.full_name} signed up with your code'
    )
    referral.points_awarded = (referral.points_awarded or 0) + REFERRAL_SIGNUP_POINTS
    return referral


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with email and password."""
    data = request.get_json()
    if not data:
        return error_response('Request body required')

    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')

    # Validation
    errors = {}
    if len(full_name) < 2:
        errors['full_name'] = 'Full name must be at least 2 characters'
    if not validate_email(email):
        errors['email'] = 'Invalid email address'
    if phone and not validate_phone(phone):
        errors['phone'] = 'Invalid Nigerian phone number'
    if len(password) < 8:
        errors['password'] = 'Password must be at least 8 characters'
    if errors:
        return error_response('Validation failed', 422, errors)

    # Check duplicates
    if User.query.filter_by(email=email).first():
        return error_response('Email already registered', 409)
    if phone and User.query.filter_by(phone=phone).first():
        return error_response('Phone number already registered', 409)

    # Create user
    user = User(
        full_name=full_name,
        email=email,
        phone=phone or None,
        password_hash=bcrypt.generate_password_hash(password).decode('utf-8'),
        referral_code=_generate_unique_referral_code(full_name),
    )

    db.session.add(user)
    db.session.flush()

    # Apply referral if provided
    _apply_referral_code(user, data.get('referral_code'))

    # Create streak record
    streak = Streak(user_id=user.id)
    db.session.add(streak)

    # Create notification preferences
    notif_prefs = NotificationPreference(user_id=user.id)
    db.session.add(notif_prefs)

    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
    }, message='Account created successfully', status_code=201)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email or phone + password."""
    data = request.get_json()
    if not data:
        return error_response('Request body required')

    identifier = data.get('email', data.get('phone', '')).strip().lower()
    password = data.get('password', '')

    if not identifier or not password:
        return error_response('Email/phone and password are required', 422)

    # Find user by email or phone
    user = User.query.filter(
        (User.email == identifier) | (User.phone == identifier)
    ).first()

    if not user or not user.password_hash:
        return error_response('Invalid credentials', 401)

    if not bcrypt.check_password_hash(user.password_hash, password):
        return error_response('Invalid credentials', 401)

    if user.is_banned:
        return error_response('Account suspended. Please contact support.', 403)

    if not user.is_active:
        return error_response('Account is deactivated', 403)

    # Update last_seen
    from datetime import datetime
    user.last_seen = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
    })


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token."""
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return success_response({'access_token': access_token})


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Invalidate the current token (client should delete it)."""
    return success_response(message='Logged out successfully')


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send OTP to email for password reset."""
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    user = User.query.filter_by(email=email).first()
    # Always return success to prevent email enumeration
    if user:
        otp = generate_otp()
        redis_client.setex(f'pwd_reset:{email}', 600, otp)  # 10 min TTL
        # TODO: send email via SendGrid
        print(f"[DEV] Password reset OTP for {email}: {otp}")

    return success_response(message='If that email is registered, a reset code has been sent.')


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using OTP."""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip()
    new_password = data.get('new_password', '')

    if len(new_password) < 8:
        return error_response('Password must be at least 8 characters', 422)

    stored_otp = redis_client.get(f'pwd_reset:{email}')
    if not stored_otp or stored_otp != otp:
        return error_response('Invalid or expired reset code', 400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return error_response('User not found', 404)

    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    redis_client.delete(f'pwd_reset:{email}')

    return success_response(message='Password reset successfully')


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password for authenticated user (requires current password)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return error_response('User not found', 404)
    
    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    if not current_password or not new_password:
        return error_response('Current password and new password are required', 422)
    
    if len(new_password) < 8:
        return error_response('New password must be at least 8 characters', 422)
    
    # Verify current password
    if not bcrypt.check_password_hash(user.password_hash, current_password):
        return error_response('Current password is incorrect', 401)
    
    # Update password
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    
    return success_response(message='Password changed successfully')


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify phone OTP for registration."""
    data = request.get_json()
    phone = data.get('phone', '').strip()
    otp = data.get('otp', '').strip()

    stored = redis_client.get(f'phone_otp:{phone}')
    if not stored or stored != otp:
        return error_response('Invalid or expired OTP', 400)

    user = User.query.filter_by(phone=phone).first()
    if user:
        user.is_verified = True
        db.session.commit()

    redis_client.delete(f'phone_otp:{phone}')
    return success_response(message='Phone verified successfully')


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP to phone."""
    data = request.get_json()
    phone = data.get('phone', '').strip()

    otp = generate_otp()
    redis_client.setex(f'phone_otp:{phone}', 300, otp)  # 5 min TTL
    # TODO: Send via Termii
    print(f"[DEV] Phone OTP for {phone}: {otp}")

    return success_response(message='OTP sent')
