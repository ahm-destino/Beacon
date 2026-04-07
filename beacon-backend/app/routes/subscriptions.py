from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Subscription, User, Referral
from ..utils.helpers import success_response, error_response
from ..services.performance_service import award_points
import requests as http_requests
import os

subscriptions_bp = Blueprint('subscriptions', __name__)

REFERRAL_SUBSCRIPTION_POINTS = 500

PLANS = {
    'seeker': {'name': 'Seeker', 'monthly': 0, 'annual': 0},
    'beacon': {'name': 'Beacon', 'monthly': 200000, 'annual': 2000000},   # kobo
    'luminary': {'name': 'Luminary', 'monthly': 350000, 'annual': 3500000},
    'north_star': {'name': 'North Star', 'monthly': 600000, 'annual': 6000000},
}


@subscriptions_bp.route('/plans', methods=['GET'])
def get_plans():
    return success_response(PLANS)


@subscriptions_bp.route('/me', methods=['GET'])
@jwt_required()
def get_subscription():
    uid = get_jwt_identity()
    sub = Subscription.query.filter_by(user_id=uid, status='active').first()
    if not sub:
        return success_response({'tier': 'seeker', 'status': 'free'})
    return success_response(sub.to_dict())


@subscriptions_bp.route('/initialize', methods=['POST'])
@jwt_required()
def initialize_payment():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    data = request.get_json()
    tier = data.get('tier', 'beacon')
    cycle = data.get('billing_cycle', 'monthly')

    plan = PLANS.get(tier)
    if not plan:
        return error_response('Invalid plan', 422)

    amount = plan['annual'] if cycle == 'annual' else plan['monthly']

    paystack_secret = os.getenv('PAYSTACK_SECRET_KEY')
    resp = http_requests.post(
        'https://api.paystack.co/transaction/initialize',
        json={
            'email': user.email,
            'amount': amount,
            'currency': 'NGN',
            'metadata': {'user_id': str(uid), 'tier': tier, 'billing_cycle': cycle},
            'callback_url': f"{os.getenv('FRONTEND_URL')}/subscription/verify",
        },
        headers={'Authorization': f'Bearer {paystack_secret}'}
    )

    if resp.status_code != 200:
        return error_response('Payment initialization failed', 502)

    return success_response(resp.json().get('data'))


@subscriptions_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    uid = get_jwt_identity()
    data = request.get_json()
    reference = data.get('reference')

    paystack_secret = os.getenv('PAYSTACK_SECRET_KEY')
    resp = http_requests.get(
        f'https://api.paystack.co/transaction/verify/{reference}',
        headers={'Authorization': f'Bearer {paystack_secret}'}
    )

    if resp.status_code != 200:
        return error_response('Verification failed', 502)

    tx = resp.json().get('data', {})
    if tx.get('status') != 'success':
        return error_response('Payment was not successful', 400)

    metadata = tx.get('metadata', {})
    tier = metadata.get('tier', 'beacon')
    cycle = metadata.get('billing_cycle', 'monthly')
    amount = tx.get('amount', 0)

    from datetime import datetime, timedelta
    user = User.query.get(uid)
    user.subscription_tier = tier
    user.subscription_status = 'active'
    user.subscription_end = datetime.utcnow() + timedelta(days=365 if cycle == 'annual' else 30)

    sub = Subscription(
        user_id=uid,
        tier=tier,
        billing_cycle=cycle,
        amount=amount,
        status='active',
        current_period_start=datetime.utcnow(),
        current_period_end=user.subscription_end,
    )
    db.session.add(sub)

    # Award referral subscription bonus if applicable
    referral = Referral.query.filter_by(referred_id=user.id).first()
    if referral and referral.status != 'subscribed':
        referral.status = 'subscribed'
        award_points(
            referral.referrer_id,
            REFERRAL_SUBSCRIPTION_POINTS,
            'referral_subscription',
            f'{user.full_name} subscribed'
        )
        referral.points_awarded = (referral.points_awarded or 0) + REFERRAL_SUBSCRIPTION_POINTS

    db.session.commit()

    return success_response({'tier': tier, 'message': f'Welcome to {tier.title()} plan!'})


@subscriptions_bp.route('/webhook', methods=['POST'])
def paystack_webhook():
    """Handle Paystack webhook events."""
    import hmac, hashlib, json
    payload = request.get_data()
    signature = request.headers.get('X-Paystack-Signature', '')
    secret = os.getenv('PAYSTACK_WEBHOOK_SECRET', '').encode()
    expected = hmac.new(secret, payload, hashlib.sha512).hexdigest()

    if not hmac.compare_digest(expected, signature):
        return {'error': 'Invalid signature'}, 400

    event = request.get_json()
    print(f"[Paystack Webhook] Event: {event.get('event')}")
    # Handle: subscription.create, charge.success, invoice.payment_failed etc.
    return {'status': 'ok'}, 200


@subscriptions_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    uid = get_jwt_identity()
    sub = Subscription.query.filter_by(user_id=uid, status='active').first()
    if sub:
        from datetime import datetime
        sub.status = 'cancelled'
        sub.cancelled_at = datetime.utcnow()
        user = User.query.get(uid)
        user.subscription_status = 'cancelled'
        db.session.commit()
    return success_response(message='Subscription cancelled successfully')
