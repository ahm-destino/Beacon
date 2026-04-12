import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/beacon_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # JWT settings
    JWT_ACCESS_TOKEN_EXPIRES = 86400      # 24 hours (prevents premature session timeouts)
    JWT_REFRESH_TOKEN_EXPIRES = 2592000   # 30 days

    # Rate limiting
    RATELIMIT_STORAGE_URI = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    RATELIMIT_DEFAULT = '200 per day;50 per hour'

    # CORS
    _env_cors = os.getenv('CORS_ORIGINS', '').split(',')
    _default_cors = [
        'http://localhost:5173', 
        'http://localhost:3000', 
        'https://beacon-beta-five.vercel.app', 
        'https://beacon-ex.vercel.app'
    ]
    # Merge and clean (remove empty strings and whitespace)
    CORS_ORIGINS = list(set([o.strip() for o in _env_cors if o.strip()] + _default_cors))

    # AI
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = 'llama-3.1-8b-instant'

    # Paystack
    PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
    PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY')
    PAYSTACK_WEBHOOK_SECRET = os.getenv('PAYSTACK_WEBHOOK_SECRET')

    # Cloudinary Storage
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

    # Termii SMS
    TERMII_API_KEY = os.getenv('TERMII_API_KEY')
    TERMII_SENDER_ID = os.getenv('TERMII_SENDER_ID', 'Beacon')

    # SendGrid
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'hello@beacon.ng')

    # Frontend
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    # Celery (Modern configuration for Celery 5.x+)
    broker_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    result_backend = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_BROKER_URL = broker_url
    CELERY_RESULT_BACKEND = result_backend
    CELERY_TASK_ALWAYS_EAGER = os.getenv('CELERY_TASK_ALWAYS_EAGER', 'False').lower() == 'true'
    
    # Scheduled Tasks
    from celery.schedules import crontab
    CELERY_BEAT_SCHEDULE = {
        'weekly-league-rotation': {
            'task': 'app.services.league_service.process_weekly_rotation',
            'schedule': crontab(day_of_week=0, hour=23, minute=59),  # Sunday 11:59 PM
        },
    }

    # File uploads
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20MB max


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = False
    RATELIMIT_DEFAULT = '1000 per hour;10000 per day'  # Higher limits for dev


class ProductionConfig(Config):
    DEBUG = False
    RATELIMIT_DEFAULT = '500 per day;100 per hour'


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
