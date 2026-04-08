import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis

from celery import Celery

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()
cors = CORS()
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv('REDIS_URL', 'memory://')
)
celery = Celery(__name__)

# Redis client (initialized in app factory)
redis_client = None


def init_redis(app):
    global redis_client
    redis_client = redis.from_url(app.config['REDIS_URL'], decode_responses=True)
    return redis_client
