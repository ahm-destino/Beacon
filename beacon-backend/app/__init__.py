import os
from flask import Flask
from .extensions import db, migrate, jwt, bcrypt, cors, limiter, init_redis, celery
from .config import config


def create_app(config_name=None):
    """Application factory pattern."""
    app = Flask(__name__)

    # Load config
    config_name = config_name or os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config.get(config_name, config['default']))

    # Handle proxy headers (Crucial for Render/Load Balancers)
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, 
                  origins=app.config['CORS_ORIGINS'], 
                  supports_credentials=True)
    
    # Debug CORS settings in logs
    print(f"\n[CORS] Allowed Origins: {app.config['CORS_ORIGINS']}\n")
    
    limiter.init_app(app)
    init_redis(app)

    # Configure Celery
    init_celery(app)
    # Ensure tasks are discovered
    from .services import league_service 

    # Import models so Flask-Migrate detects them
    from . import models

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.onboarding import onboarding_bp
    from .routes.questions import questions_bp
    from .routes.practice import practice_bp
    from .routes.ai_tutor import ai_tutor_bp
    from .routes.streaks import streaks_bp
    from .routes.analytics import analytics_bp
    from .routes.notifications import notifications_bp
    from .routes.subscriptions import subscriptions_bp
    from .routes.community import community_bp
    from .routes.leaderboard import leaderboard_bp
    from .routes.documents import documents_bp
    from .routes.admin import admin_bp
    from .routes.flashcards import flashcards_bp
    from .routes.literature import literature_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(onboarding_bp, url_prefix='/api/onboarding')
    app.register_blueprint(questions_bp, url_prefix='/api/questions')
    app.register_blueprint(practice_bp, url_prefix='/api/practice')
    app.register_blueprint(ai_tutor_bp, url_prefix='/api/ai-tutor')
    app.register_blueprint(streaks_bp, url_prefix='/api/streaks')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(subscriptions_bp, url_prefix='/api/subscriptions')
    app.register_blueprint(community_bp, url_prefix='/api/community')
    app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(flashcards_bp, url_prefix='/api/flashcards')
    app.register_blueprint(literature_bp, url_prefix='/api/literature')

    # Health check
    @app.route('/api/health')
    def health():
        try:
            # Check database connection
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            return {'status': 'healthy', 'message': 'Beacon API and Database are running ✓'}, 200
        except Exception as e:
            return {'status': 'unhealthy', 'message': f'Database error: {str(e)}'}, 500

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Invalid token', 'code': 'TOKEN_INVALID'}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'error': 'Authorization token required', 'code': 'TOKEN_MISSING'}, 401

    return app


def init_celery(app):
    """Integrates Celery with the Flask app context."""
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
