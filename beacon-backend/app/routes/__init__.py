from .auth import auth_bp
from .users import users_bp
from .onboarding import onboarding_bp
from .questions import questions_bp
from .practice import practice_bp
from .ai_tutor import ai_tutor_bp
from .streaks import streaks_bp
from .analytics import analytics_bp
from .notifications import notifications_bp
from .subscriptions import subscriptions_bp
from .community import community_bp
from .leaderboard import leaderboard_bp
from .documents import documents_bp
from .admin import admin_bp
from .flashcards import flashcards_bp
from .literature import literature_bp

__all__ = [
    'auth_bp', 'users_bp', 'onboarding_bp', 'questions_bp',
    'practice_bp', 'ai_tutor_bp', 'streaks_bp', 'analytics_bp',
    'notifications_bp', 'subscriptions_bp', 'community_bp',
    'leaderboard_bp', 'documents_bp', 'admin_bp',
    'flashcards_bp', 'literature_bp',
]
