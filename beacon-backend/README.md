# Beacon Backend API

A production-grade **Flask + PostgreSQL** REST API for the Beacon Nigerian exam prep platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Python Flask 3.0 |
| Database | PostgreSQL + SQLAlchemy |
| Auth | Flask-JWT-Extended (JWT) |
| AI | Groq (Llama 3.x) |
| Payments | Paystack |
| Cache / Queue | Redis + Celery |
| File Storage | AWS S3 |
| SMS | Termii (Nigerian) |

## Quick Start

### 1. Setup

```bash
cd beacon-backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Create Database

```bash
# Make sure PostgreSQL is running, then:
createdb beacon_db

# Initialize migrations
flask --app run db init
flask --app run db migrate -m "Initial migration"
flask --app run db upgrade
```

### 4. Run Development Server

```bash
python run.py
# API will be available at http://localhost:5000
```

### 5. Run Celery Worker (optional)

```bash
celery -A celery_worker.celery worker --loglevel=info
```

## API Overview

| Prefix | Description |
|--------|-------------|
| `GET /api/health` | Health check |
| `/api/auth` | Register, login, OTP, password reset |
| `/api/users/me` | User profile, stats, badges, points |
| `/api/onboarding` | 5-step onboarding + diagnostic quiz |
| `/api/questions` | Question bank with filters + AI generation |
| `/api/practice` | Session lifecycle, answers, bookmarks |
| `/api/ai-tutor` | Streaming chat, scan, conversations |
| `/api/streaks` | Streak tracking, freeze, repair, society |
| `/api/analytics` | Dashboard, subject breakdown, prediction |
| `/api/notifications` | In-app notifications + preferences |
| `/api/subscriptions` | Paystack plans, initialize, verify, webhook |
| `/api/community` | Q&A, buddy system |
| `/api/leaderboard` | Global + streak society rankings |
| `/api/documents` | PDF upload + AI-powered processing |
| `/api/admin` | Full admin panel (auth required: is_admin=True) |

## Deployment Order

1. Set up PostgreSQL and Redis
2. Run `flask db upgrade`
3. Seed question bank
4. Configure all `.env` values
5. Test auth + Paystack (test mode)
6. Connect Groq API
7. Deploy to Railway / Render
8. Switch Paystack to live mode

## Connect to React Frontend

Create `src/services/api.js` in the frontend:

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('beacon_token')}`,
})

const api = {
  get:    (url)       => fetch(`${BASE_URL}${url}`, { headers: getHeaders() }).then(r => r.json()),
  post:   (url, data) => fetch(`${BASE_URL}${url}`, { method: 'POST',   headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  put:    (url, data) => fetch(`${BASE_URL}${url}`, { method: 'PUT',    headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  delete: (url)       => fetch(`${BASE_URL}${url}`, { method: 'DELETE', headers: getHeaders() }).then(r => r.json()),
}

export default api
```

## Note on IDE Linter Warnings

If you see "Could not find import" errors in your IDE for the Flask project files,
this is because the Python virtual environment is not yet configured as the IDE's
Python interpreter. Once you activate the venv and install requirements, these will
disappear. The relative imports (e.g. `from ..extensions import db`) are correct
for the Flask app factory pattern used here.
