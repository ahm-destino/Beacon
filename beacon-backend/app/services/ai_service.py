import os
import json
import time
import random
import threading
import requests
import io
from datetime import datetime
from groq import Groq
from ..extensions import db

# ─── Embedding model singleton (DISABLED) ─────────────────────────────────────
# We moved to Gemini Cloud Embeddings to prevent OOM crashes on Render.
# The local 'all-MiniLM-L6-v2' model required too much RAM (torch).


GROQ_MODEL_LOCKED = 'llama-3.1-8b-instant'


class AIService:

    _client = None

    # Default Groq model rotation list (fallback if model API fetch fails).
    # Order is tuned for fast/cheap real-time responses first.
    GROQ_DEFAULT_MODELS = [
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'gemma2-9b-it',
        'mixtral-8x7b-32768',
    ]

    GROQ_PREVIEW_MODELS = [
        'meta-llama/llama-4-scout-17b-16e-instruct',
    ]

    # Models to exclude from chat completions (audio/guard/safety/etc)
    GROQ_NON_CHAT_SUBSTRINGS = [
        'whisper',
        'speech',
        'tts',
        'audio',
        'transcription',
        'translation',
        'prompt-guard',
        'safeguard',
    ]

    GROQ_MODEL_COOLDOWN_RATE_LIMIT = int(os.getenv('GROQ_COOLDOWN_RATE_LIMIT_SECS', '30'))
    GROQ_MODEL_COOLDOWN_UNAVAILABLE = int(os.getenv('GROQ_COOLDOWN_UNAVAILABLE_SECS', '10'))
    GROQ_MODEL_COOLDOWN_NOT_FOUND = int(os.getenv('GROQ_COOLDOWN_NOT_FOUND_SECS', '300'))
    GROQ_MODEL_REFRESH_SECS = int(os.getenv('GROQ_MODEL_REFRESH_SECS', '1800'))

    _groq_model_cache = {'models': None, 'fetched_at': 0.0}
    _groq_model_cooldowns = {}
    _groq_model_lock = threading.Lock()

    GEMINI_DEFAULT_MODELS = [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
    ]

    GEMINI_KEY_COOLDOWN_SECS = int(os.getenv('GEMINI_KEY_COOLDOWN_SECS', '30'))
    GEMINI_MODEL_COOLDOWN_SECS = int(os.getenv('GEMINI_MODEL_COOLDOWN_SECS', '30'))
    GEMINI_MODEL_COOLDOWN_NOT_FOUND_SECS = int(os.getenv('GEMINI_MODEL_COOLDOWN_NOT_FOUND_SECS', '300'))
    GEMINI_TIMEOUT_SECS = int(os.getenv('GEMINI_TIMEOUT_SECS', '30'))

    _gemini_key_idx = 0
    _gemini_model_idx = 0
    _gemini_key_lock = threading.Lock()
    _gemini_model_lock = threading.Lock()
    _gemini_key_cooldowns = {}
    _gemini_model_cooldowns = {}

    @classmethod
    def get_client(cls):
        if cls._client is None:
            api_key = os.getenv('GROQ_API_KEY')
            if not api_key:
                raise ValueError('GROQ_API_KEY is not set. Add it to .env to use Chat and Documents.')
            cls._client = Groq(api_key=api_key, max_retries=0)
        return cls._client

    @classmethod
    def _should_exclude_model(cls, model_id: str) -> bool:
        if not model_id:
            return True
        model_id_lower = model_id.lower()
        return any(bad in model_id_lower for bad in cls.GROQ_NON_CHAT_SUBSTRINGS)

    @classmethod
    def _fetch_groq_models_from_api(cls):
        """Fetch active models from Groq API (cached)."""
        with cls._groq_model_lock:
            now = time.time()
            cached = cls._groq_model_cache.get('models')
            fetched_at = cls._groq_model_cache.get('fetched_at', 0.0)
            if cached and (now - fetched_at) < cls.GROQ_MODEL_REFRESH_SECS:
                return cached

            try:
                client = cls.get_client()
                data = client.models.list()
                items = getattr(data, 'data', None) or []
                model_ids = [
                    m.id for m in items
                    if getattr(m, 'active', True) and not cls._should_exclude_model(getattr(m, 'id', ''))
                ]
                # Keep stable ordering: prioritize defaults, then append anything else
                preferred = [m for m in cls.GROQ_DEFAULT_MODELS if m in model_ids]
                others = [m for m in model_ids if m not in preferred]
                ordered = preferred + others
                cls._groq_model_cache = {'models': ordered, 'fetched_at': now}
                return ordered
            except Exception:
                # If API fetch fails, fall back to defaults
                return None

    @classmethod
    def get_groq_model_candidates(cls):
        """
        Resolve the Groq model rotation list.
        Order of precedence:
        1) GROQ_MODELS env (comma-separated)
        2) GROQ_MODEL_SOURCE=api (fetch active models)
        3) GROQ_DEFAULT_MODELS (+ preview if enabled)
        """
        override = os.getenv('GROQ_MODELS')
        if override:
            models = [m.strip() for m in override.split(',') if m.strip()]
            return [m for m in models if not cls._should_exclude_model(m)]

        source = os.getenv('GROQ_MODEL_SOURCE', 'api').strip().lower()
        if source == 'api':
            api_models = cls._fetch_groq_models_from_api()
            if api_models:
                return api_models

        include_preview = os.getenv('GROQ_INCLUDE_PREVIEW', '').strip().lower() in ['1', 'true', 'yes']
        models = list(cls.GROQ_DEFAULT_MODELS)
        if include_preview:
            models.extend(cls.GROQ_PREVIEW_MODELS)
        return [m for m in models if not cls._should_exclude_model(m)]

    @classmethod
    def _cooldown_model(cls, model: str, seconds: int):
        # Add small jitter to avoid thundering herd
        jitter = random.uniform(0, 2.0)
        until = time.time() + max(1, seconds) + jitter
        with cls._groq_model_lock:
            cls._groq_model_cooldowns[model] = until

    @classmethod
    def _is_model_cooled(cls, model: str) -> bool:
        with cls._groq_model_lock:
            until = cls._groq_model_cooldowns.get(model, 0)
        return time.time() < until

    @classmethod
    def execute_groq_with_fallback(cls, messages, stream=False, max_tokens=2000, temperature=0.7):
        """Automatically retries across multiple Groq models if rate limited."""
        client = cls.get_client()
        last_exception = None

        models = cls.get_groq_model_candidates()
        if not models:
            raise Exception("No Groq models configured.")

        # Skip models in cooldown; if all are cooling, try the full list anyway.
        active_models = [m for m in models if not cls._is_model_cooled(m)]
        if not active_models:
            active_models = models

        for model in active_models:
            try:
                response = client.chat.completions.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    messages=messages,
                    stream=stream,
                )
                return response
            except Exception as e:
                err_str = str(e).lower()
                # If rate limit (429), unavailable (503), or model not found (404), catch and retry next model
                if "rate limit" in err_str or "429" in err_str:
                    cls._cooldown_model(model, cls.GROQ_MODEL_COOLDOWN_RATE_LIMIT)
                    last_exception = e
                    time.sleep(1) # tiny throttle between attempts
                    continue
                if "availability" in err_str or "503" in err_str:
                    cls._cooldown_model(model, cls.GROQ_MODEL_COOLDOWN_UNAVAILABLE)
                    last_exception = e
                    time.sleep(1)
                    continue
                if "not found" in err_str or "404" in err_str:
                    cls._cooldown_model(model, cls.GROQ_MODEL_COOLDOWN_NOT_FOUND)
                    last_exception = e
                    time.sleep(1)
                    continue
                raise e # fatal api key error
                    
        raise Exception(f"All Groq fallback models rate limited or unavailable. Last error: {last_exception}")

    @classmethod
    def _get_gemini_keys(cls):
        raw = os.getenv('GEMINI_API_KEYS') or os.getenv('GEMINI_API_KEY') or ''
        keys = [k.strip() for k in raw.split(',') if k.strip()]
        return keys

    @classmethod
    def _get_gemini_models(cls):
        override = os.getenv('GEMINI_MODELS')
        if override:
            models = [m.strip() for m in override.split(',') if m.strip()]
            return models
        return cls.GEMINI_DEFAULT_MODELS

    @classmethod
    def _cooldown_gemini_key(cls, key: str):
        jitter = random.uniform(0, 2.0)
        with cls._gemini_key_lock:
            cls._gemini_key_cooldowns[key] = time.time() + cls.GEMINI_KEY_COOLDOWN_SECS + jitter

    @classmethod
    def _cooldown_gemini_model(cls, model: str, seconds: int):
        jitter = random.uniform(0, 2.0)
        with cls._gemini_model_lock:
            cls._gemini_model_cooldowns[model] = time.time() + max(1, seconds) + jitter

    @classmethod
    def _is_gemini_key_cooled(cls, key: str) -> bool:
        with cls._gemini_key_lock:
            until = cls._gemini_key_cooldowns.get(key, 0)
        return time.time() < until

    @classmethod
    def _is_gemini_model_cooled(cls, model: str) -> bool:
        with cls._gemini_model_lock:
            until = cls._gemini_model_cooldowns.get(model, 0)
        return time.time() < until

    @classmethod
    def _cosine_similarity(cls, v1, v2):
        """Standard dot product for normalized vectors (cosine similarity)."""
        if not v1 or not v2 or len(v1) != len(v2):
            return 0
        return sum(a * b for a, b in zip(v1, v2))

    @classmethod
    def _next_gemini_key(cls, keys):
        with cls._gemini_key_lock:
            if not keys:
                return None
            key = keys[cls._gemini_key_idx % len(keys)]
            cls._gemini_key_idx = (cls._gemini_key_idx + 1) % len(keys)
            return key

    @classmethod
    def _get_gemini_embedding(cls, text):
        """Fetch 384-dimensional embedding from Gemini API."""
        keys = cls._get_gemini_keys()
        if not keys:
            return None
        
        # We rotate keys similar to chat
        key = cls._next_gemini_key(keys)
        url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent"
        
        payload = {
            "model": "models/text-embedding-004",
            "content": {
                "parts": [{"text": text}]
            },
            "outputDimensionality": 384 # Matches previous all-MiniLM model for DB compatibility
        }
        headers = {'x-goog-api-key': key, 'Content-Type': 'application/json'}
        
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=10)
            if resp.status_code == 200:
                return resp.json().get('embedding', {}).get('values')
            return None
        except Exception:
            return None

    @classmethod
    def _next_gemini_model(cls, models):
        with cls._gemini_model_lock:
            if not models:
                return None
            model = models[cls._gemini_model_idx % len(models)]
            cls._gemini_model_idx = (cls._gemini_model_idx + 1) % len(models)
            return model

    @classmethod
    def _build_gemini_payload(cls, messages, temperature=0.2, max_tokens=700, use_search=False):
        system_parts = []
        contents = []
        for msg in messages:
            role = msg.get('role', 'user')
            text = msg.get('content', '')
            if not text:
                continue
            if role == 'system':
                system_parts.append({'text': text})
            elif role == 'assistant':
                contents.append({'role': 'model', 'parts': [{'text': text}]})
            else:
                contents.append({'role': 'user', 'parts': [{'text': text}]})

        payload = {
            'contents': contents,
            'generationConfig': {
                'temperature': temperature,
                'maxOutputTokens': max_tokens,
            }
        }
        if system_parts:
            payload['systemInstruction'] = {'parts': system_parts}
        if use_search:
            payload['tools'] = [{'google_search': {}}]
        return payload

    @classmethod
    def execute_gemini_with_fallback(cls, messages, max_tokens=700, temperature=0.2, use_search=False):
        keys = cls._get_gemini_keys()
        models = cls._get_gemini_models()
        if not keys:
            raise ValueError('GEMINI_API_KEY(S) not set.')

        attempts = len(keys) * max(1, len(models))
        last_error = None
        for _ in range(attempts):
            key = cls._next_gemini_key(keys)
            model = cls._next_gemini_model(models)
            if not key or not model:
                break
            if cls._is_gemini_key_cooled(key) or cls._is_gemini_model_cooled(model):
                continue

            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            payload = cls._build_gemini_payload(messages, temperature=temperature, max_tokens=max_tokens, use_search=use_search)
            headers = {
                'x-goog-api-key': key,
                'Content-Type': 'application/json',
            }
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=cls.GEMINI_TIMEOUT_SECS)
            except Exception as e:
                last_error = e
                cls._cooldown_gemini_key(key)
                continue

            if resp.status_code == 200:
                return resp.json()

            last_error = resp
            try:
                err_json = resp.json()
            except Exception:
                err_json = {}

            err_status = resp.status_code
            err_msg = json.dumps(err_json).lower()

            if err_status in (429, 503) or 'resource_exhausted' in err_msg:
                cls._cooldown_gemini_key(key)
                cls._cooldown_gemini_model(model, cls.GEMINI_MODEL_COOLDOWN_SECS)
                continue
            if err_status == 404 or 'not found' in err_msg:
                cls._cooldown_gemini_model(model, cls.GEMINI_MODEL_COOLDOWN_NOT_FOUND_SECS)
                continue
            if err_status in (401, 403):
                raise Exception(f"Gemini auth error: {resp.text}")

        raise Exception(f"All Gemini models/keys failed. Last error: {last_error}")

    @classmethod
    def chat(cls, conversation_id, user_message, explanation_level, user_context, rag_context=None):
        """Stream AI response for chat. Yields text chunks.
        
        rag_context: optional list of relevant questions retrieved from the
        database by the RAG search. These are injected into the system prompt
        so the AI can reference real JAMB questions when tutoring.
        """
        from ..models import Conversation, Message

        conv = Conversation.query.get(conversation_id)
        history = Message.query.filter_by(conversation_id=conversation_id).order_by(
            Message.created_at
        ).all()

        messages = [{'role': m.role, 'content': m.content} for m in history[-20:]]
        messages.append({'role': 'user', 'content': user_message})

        # Pass rag_context into the system prompt builder
        system_prompt = cls.build_system_prompt(explanation_level, user_context, rag_context=rag_context)

        full_response = ''
        stream = cls.execute_groq_with_fallback(
            messages=[{'role': 'system', 'content': system_prompt}] + messages,
            stream=True,
            max_tokens=2000,
            temperature=0.7,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            text = getattr(delta, 'content', None)
            if text:
                full_response += text
                yield text

        # Persist messages
        user_msg = Message(
            conversation_id=conversation_id,
            role='user',
            content=user_message,
            explanation_level=explanation_level,
        )
        ai_msg = Message(
            conversation_id=conversation_id,
            role='assistant',
            content=full_response,
            explanation_level=explanation_level,
            tokens_used=None,
        )
        conv.message_count = (conv.message_count or 0) + 2
        conv.updated_at = datetime.utcnow()

        # Auto-generate title from first user message
        if len(history) == 0:
            conv.title = user_message[:60] + ('...' if len(user_message) > 60 else '')

        db.session.add(user_msg)
        db.session.add(ai_msg)
        db.session.commit()

    @classmethod
    def get_embedding(cls, text):
        """
        Convert a string of text into a list of 384 numbers (a vector).
        
        Now uses Gemini Cloud API to avoid server OOM crashes.
        """
        if not text:
            return None
        embedding = cls._get_gemini_embedding(text)
        return embedding

    @classmethod
    def search_similar_questions(cls, query_text, limit=5, subject=None, exam_type='JAMB'):
        """
        RAG Core: Find questions most semantically similar to the student's query.

        HOW IT WORKS (two modes):
        ─────────────────────────
        MODE 1 — Vector Search (cloud DB with pgvector installed):
          - Converts the query text to a 384-number vector
          - Uses PostgreSQL's <=> (cosine distance) to find closest matches
          - Most accurate: finds related questions even with different wording

        MODE 2 — Keyword Fallback (local dev without pgvector):
          - Uses PostgreSQL full-text ILIKE search on question text + topic
          - Less powerful but works everywhere with zero extra setup
          - Automatically used when pgvector extension is not available

        The AI Tutor works in BOTH modes — just less precisely in fallback mode.
        """
        from ..models import Question

        # Build base filter
        base_query = Question.query.filter(
            Question.is_active == True,
            Question.is_approved == True,
        )
        if subject:
            base_query = base_query.filter(Question.subject.ilike(f'%{subject}%'))
        if exam_type:
            base_query = base_query.filter(Question.exam_type == exam_type)

        # ── Try vector search first ────────────────────────────────────────
        try:
            from pgvector.sqlalchemy import Vector

            query_embedding = cls.get_embedding(query_text)
            if query_embedding is not None:
                results = base_query.filter(
                    Question.embedding.isnot(None)
                ).order_by(
                    Question.embedding.cosine_distance(query_embedding)
                ).limit(limit).all()

                if results:
                    return [
                        {
                            'id': str(q.id),
                            'subject': q.subject,
                            'topic': q.topic,
                            'year': q.year,
                            'question_text': q.question_text,
                            'option_a': q.option_a,
                            'option_b': q.option_b,
                            'option_c': q.option_c,
                            'option_d': q.option_d,
                            'correct_answer': q.correct_answer,
                            'explanation': q.explanation,
                        }
                        for q in results
                    ]
        except Exception:
            pass  # pgvector not available, fall through to keyword search

        # ── Fallback: keyword-based search ────────────────────────────────
        # Extract the most meaningful words from the query (skip short words)
        keywords = [w for w in query_text.split() if len(w) > 3][:5]
        if not keywords:
            return []

        # Search question text and topic for any of the keywords
        from sqlalchemy import or_
        keyword_filters = []
        for kw in keywords:
            keyword_filters.append(Question.question_text.ilike(f'%{kw}%'))
            keyword_filters.append(Question.topic.ilike(f'%{kw}%'))

        results = base_query.filter(
            or_(*keyword_filters)
        ).order_by(Question.times_answered.desc().nullslast()).limit(limit).all()

        return [
            {
                'id': str(q.id),
                'subject': q.subject,
                'topic': q.topic,
                'year': q.year,
                'question_text': q.question_text,
                'option_a': q.option_a,
                'option_b': q.option_b,
                'option_c': q.option_c,
                'option_d': q.option_d,
                'correct_answer': q.correct_answer,
                'explanation': q.explanation,
            }
            for q in results
        ]

    @classmethod
    def build_system_prompt(cls, level, context, rag_context=None):
        level_instructions = {
            'basic': 'Mode: SIMPLE (The "Least Thing"). Use ZERO jargon. Use strictly simple English with relatable Nigerian everyday analogies (like market/keke/bus examples). Explain as if teaching a younger sibling.',
            'normal': 'Mode: STANDARD. Give step-by-step academic explanations with clear examples. Use standard textbook terminology and clear context.',
            'deep': 'Mode: DEEP DIVE. Give comprehensive, theoretical explanations. Include historical context, advanced nuances, exam-specific traps, and deep theory.'
        }
        inst = level_instructions.get(level, level_instructions['normal'])

        # If we have RAG context (retrieved questions), we inject them here so
        # the AI can reference real JAMB questions and their official answers/explanations.
        rag_section = ''
        if rag_context:
            rag_section = '\n\n=== RELEVANT JAMB QUESTIONS FROM QUESTION BANK ===\n'
            for i, q in enumerate(rag_context, 1):
                rag_section += f"""
[Question {i}] {q.get('subject','').upper()} {q.get('year','')} — {q.get('topic','')}
{q.get('question_text','')}
A) {q.get('option_a','')}  B) {q.get('option_b','')}  C) {q.get('option_c','')}  D) {q.get('option_d','')}
Correct Answer: {q.get('correct_answer','')}
Explanation: {q.get('explanation','')}
"""
            rag_section += '\nUse these questions as your primary reference when tutoring the student.\n'

        return f"""You are Beacon AI Tutor — a warm, patient tutor for Nigerian students preparing for {context.get('exam_type', 'JAMB')} exams.

Student: {context.get('name', 'Student')}
Subjects: {', '.join(context.get('subjects', []))}
Explanation level instruction: {inst}{rag_section}

ALWAYS:
- Format responses with headers, bold, bullets where appropriate
- Use Nigerian examples and local context naturally
- When solving or simplifying a problem, write steps as:
  Step 1: ...
  Step 2: ...
  Step 3: ...
  Answer: ...
- End every response with a next step or question to check understanding

NEVER:
- Give walls of unformatted text
- Make the student feel stupid
- Go off-topic without redirecting"""

    @classmethod
    def generate_questions(cls, subject, topic, difficulty, count, exam_type):
        """Generate AI questions for topic-based practice."""
        from ..models import Question

        prompt = f"""Generate {count} multiple-choice questions about {topic} in {subject} for {exam_type} level Nigerian students.

Difficulty: {difficulty}

For each question return valid JSON:
{{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_answer": "A",
  "explanation": "...",
  "explanation_steps": ["step 1...", "step 2..."],
  "common_mistake": "...",
  "subtopic": "..."
}}

Return ONLY a JSON array. No markdown. No other text."""

        import os
        from huggingface_hub import InferenceClient
        hf_token = os.getenv('HF_TOKEN')
        if not hf_token:
            raise ValueError('HF_TOKEN must be set to generate questions via Hugging Face')
            
        hf_client = InferenceClient(token=hf_token)
        response = hf_client.chat.completions.create(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            max_tokens=4000,
            temperature=0.4,
            messages=[{'role': 'user', 'content': prompt}],
        )

        output_text = response.choices[0].message.content
        if '```json' in output_text:
            output_text = output_text.split('```json')[1].split('```')[0].strip()
        elif '```' in output_text:
            output_text = output_text.split('```')[1].split('```')[0].strip()

        questions_data = json.loads(output_text)
        saved = []
        for q in questions_data:
            question = Question(
                source='AI_GENERATED',
                exam_type=exam_type,
                subject=subject,
                topic=topic,
                subtopic=q.get('subtopic', topic),
                difficulty=difficulty,
                question_text=q['question_text'],
                option_a=q['option_a'],
                option_b=q['option_b'],
                option_c=q['option_c'],
                option_d=q['option_d'],
                correct_answer=q['correct_answer'],
                explanation=q['explanation'],
                explanation_steps=q.get('explanation_steps'),
                common_mistake=q.get('common_mistake'),
                # Mark as approved so the question bank can immediately use AI-generated items.
                # This prevents "generated questions not showing up" dead-ends.
                is_approved=True,
            )
            db.session.add(question)
            saved.append(question)

        db.session.commit()
        return saved

    @classmethod
    def process_document(cls, document_id):
        """Process a PDF document and build dynamic Mini-Course sections."""
        from ..models import Document, DocumentSection
        from flask import current_app
        import time
        import json
        
        doc = Document.query.get(document_id)
        if not doc:
            return

        if not os.getenv('GROQ_API_KEY'):
            doc.status = 'failed'
            doc.summary = 'AI processing is not configured on this server.'
            db.session.commit()
            return

        extracted_text = ""
        if doc.file_url:
            try:
                from PyPDF2 import PdfReader
                # Fetch file from Cloudinary URL
                resp = requests.get(doc.file_url, timeout=30)
                if resp.status_code == 200:
                    stream = io.BytesIO(resp.content)
                    reader = PdfReader(stream)
                    # Parse entire document now
                    pages = reader.pages
                    extracted = []
                    for p in pages:
                        text = p.extract_text() or ''
                        if text:
                            extracted.append(text)
                    extracted_text = '\n'.join(extracted).replace('\x00', '').strip()
                    doc.page_count = len(pages)
                else:
                    current_app.logger.error(f"Failed to fetch PDF from Cloudinary: {resp.status_code}")
            except Exception as e:
                current_app.logger.warning(f"PDF extract failed: {e}")
                extracted_text = ""

        if not extracted_text:
            doc.status = 'failed'
            doc.summary = 'Could not read text from this PDF.'
            db.session.commit()
            return

        start = time.time()
        
        try:
            # Note: We no longer use local sentence-transformers to save RAM
            embed_model = None
            # 1. Chunking strategy
            # We break into chunks of ~600 words (rough topic size)
            words = extracted_text.split()
            chunk_size = 600
            chunks = []
            for i in range(0, len(words), chunk_size):
                chunks.append(" ".join(words[i:i+chunk_size]))
                
            # Create ALL sections as pending initially
            for idx, chunk_text in enumerate(chunks):
                section = DocumentSection(
                    document_id=doc.id,
                    order_index=idx,
                    content_text=chunk_text,
                    status='pending'
                )
                db.session.add(section)
            db.session.commit()

            # Process the first batch immediately
            cls._process_document_batch(str(doc.id), batch_size=5)
            
            # Initial summary status
            first_sec = DocumentSection.query.filter_by(document_id=doc.id, status='complete').order_by(DocumentSection.order_index).first()
            if first_sec:
               doc.summary = "Course created! Analyzing more chapters in the background... " + (first_sec.summary or "")[:200] + "..."
            else:
               doc.summary = "Course structure created. AI is analyzing the first few chapters now."

            doc.status = 'complete'
            doc.processing_time = time.time() - start
            db.session.commit()

        except Exception as e:
            db.session.rollback()
            current_app.logger.exception('Document processing failed: %s', document_id)
            doc.status = 'failed'
            doc.summary = f'Processing failed. Error: {str(e)}'
            doc.processing_time = time.time() - start
            db.session.commit()

    @classmethod
    def _process_document_batch(cls, document_id, batch_size=5):
        """Processes a chunk of pending sections for a document."""
        from flask import current_app
        from ..models import Document, DocumentSection
        from ..extensions import db
        import json

        app = current_app._get_current_object()
        
        with app.app_context():
            doc = Document.query.get(document_id)
            if not doc: return False

            pending_sections = DocumentSection.query.filter_by(
                document_id=document_id, 
                status='pending'
            ).order_by(DocumentSection.order_index).limit(batch_size).all()

            if not pending_sections:
                return False

            # Note: We now use Gemini Cloud embeddings via get_embedding()
            # to prevent OOM (Out of Memory) crashes on Render.

            processed_count = 0
            for sec in pending_sections:
                prompt = f"""You are creating an interactive mini-course Study Guide. Read this section of a larger document.
                
Document Context: {doc.filename} ({doc.subject})
Section Text: 
{sec.content_text}

Generate a comprehensive "First Nudge" structured guide for this exact section. 

1. TOPIC: Choose a highly specific Topic. NEVER use "General", the document's Subject name (e.g. {doc.subject}), or the filename (e.g. {doc.filename}) as the TOPIC. If the text is broad, find the specific academic subject (e.g. "Kinematic Equations" instead of "Physics").
2. SUBTOPIC: Choose a specific Title. NEVER use "General" as a SUBTOPIC.
3. CONCEPTS: List exactly 3-5 granular, academic concept tags found in this section (e.g. ["Refraction", "Lenses", "Focal Point"]).
4. SUMMARY: Create a "Study Guide" summary with these components:
   - "Key Takeaways": 3-5 bullet points of the most essential facts.
   - "Deep Dive": A comprehensive 2-paragraph detailed explanation hitting all relevant details.
   - "Glossary": Define 2-3 complex terms found in this section.
4. FLASHCARDS: Provide exactly 5 flashcard pairs. 
5. QUIZ: Provide a comprehensive set of multiple-choice quiz questions (up to 10) based on the depth of the section. If the section is short, 5-7 questions is fine. If it is complex, provide a full 10.
   - LINKING: Every question MUST be answerable ONLY using the provided text.
   - For each question: question, 4 options (A-D), correct_answer, and a detailed explanation.

Return exactly valid JSON matching this structure:
{{
  "topic": "...",
  "subtopic": "...",
  "key_concepts": ["...", "...", "..."],
  "summary": "...",
  "flashcards": [{{"front": "...", "back": "..."}}],
  "quiz_questions": [{{"question": "...", "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}}, "correct_answer": "A", "explanation": "..."}}]
}}
"""
                result = cls.generate_structured_content(prompt, provider='groq')
                
                def sanitize_name(name, fallback):
                    if not name: return fallback
                    name_str = str(name).strip()
                    # If it's "General" or just a filename (contains .pdf etc), use fallback
                    forbidden = ['.pdf', '.docx', '.pptx', '.txt', 'general']
                    if any(f in name_str.lower() for f in forbidden) or len(name_str) < 3:
                        return fallback
                    return name_str

                if result:
                    sec.topic = sanitize_name(result.get('topic'), sec.topic or doc.subject or "Knowledge Nugget")
                    sec.subtopic = sanitize_name(result.get('subtopic'), f"Section {sec.order_index + 1}")
                    sec.key_concepts = result.get('key_concepts', [])
                    sec.summary = result.get('summary', '')
                    sec.flashcards = result.get('flashcards', [])
                    sec.quiz_questions = result.get('quiz_questions', [])
                    sec.status = 'complete'

                    # Generate vector embedding for semantic search (RAG)
                    emb = cls.get_embedding(sec.content_text)
                    if emb:
                        sec.embedding = json.dumps(emb)
                    
                    processed_count += 1
                    db.session.commit()
                else:
                    # If AI fails, skip this one for now or mark as failed
                    sec.status = 'failed'
                    db.session.commit()

            # Check if more are pending to schedule automatic next batch
            remaining = DocumentSection.query.filter_by(document_id=document_id, status='pending').count()
            if remaining > 0:
                import threading
                def schedule_next():
                    import time
                    time.sleep(5) # Reduced COOLDOWN from 60s to 5s for faster chunking
                    with app.app_context():
                        cls._process_document_batch(document_id, batch_size)
                
                threading.Thread(target=schedule_next, daemon=True).start()

            return processed_count > 0

    @classmethod
    def generate_structured_content(cls, prompt, schema_type=None, provider='groq'):
        """Generate structured JSON content from AI."""
        provider = (provider or 'groq').strip().lower()
        if provider == 'hf':
            return cls._generate_structured_content_hf(prompt)

        try:
            response = cls.execute_groq_with_fallback(
                messages=[{'role': 'user', 'content': prompt}],
                stream=False,
                max_tokens=4000,
                temperature=0.2,
            )
            text = response.choices[0].message.content
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            text = text.strip()

            import re
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                match = re.search(r'(\[|\{).*(\]|\})', text, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
        except Exception:
            return None
        return None

    @classmethod
    def verify_correct_answer(cls, question):
        """Ask Groq to determine the correct option for a question."""
        provider = os.getenv('AI_ANSWER_PROVIDER', 'groq').strip().lower()
        use_search = os.getenv('GEMINI_USE_SEARCH', '').strip().lower() in ['1', 'true', 'yes']

        prompt = f"""You are verifying a multiple-choice question. USE GOOGLE SEARCH to verify scientific or factual accuracy.

Question: {question.question_text}
Options:
A) {question.option_a}
B) {question.option_b}
C) {question.option_c}
D) {question.option_d}

Rules:
1. Search the web to find the absolute truth for this question.
2. Provide the 'correct_answer_text' found in your research (e.g. "Nitrous Oxide").
3. Return ONLY valid JSON with keys: correct_answer_text, confidence, brief_explanation.
"""
        try:
            if provider == 'gemini':
                response_json = cls.execute_gemini_with_fallback(
                    messages=[{'role': 'user', 'content': prompt}],
                    max_tokens=700,
                    temperature=0.2,
                    use_search=use_search,
                )
                candidates = response_json.get('candidates') if isinstance(response_json, dict) else None
                if candidates and candidates[0].get('content', {}).get('parts'):
                    text = candidates[0]['content']['parts'][0].get('text', '')
                    model_name = response_json.get('model') or response_json.get('modelName')
                else:
                    text = ''
                    model_name = None
            else:
                response = cls.execute_groq_with_fallback(
                    messages=[{'role': 'user', 'content': prompt}],
                    stream=False,
                    max_tokens=700,
                    temperature=0.2,
                )
                text = response.choices[0].message.content if response and response.choices else ''
                model_name = getattr(response, 'model', None)
            if not text:
                return None

            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            text = text.strip()

            import re
            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                match = re.search(r'(\{).*(\})', text, re.DOTALL)
                if not match:
                    return None
                payload = json.loads(match.group(0))

            ans_text = (payload.get('correct_answer_text') or '').strip()
            if not ans_text:
                return None

            # ── SEMANTIC MATCHING ─────────────────────────────────────────────
            # We match the AI's discovered text against the 4 options in DB.
            options = {
                'A': question.option_a,
                'B': question.option_b,
                'C': question.option_c,
                'D': question.option_d
            }
            
            ans_vector = cls.get_embedding(ans_text)
            if not ans_vector:
                return None
                
            best_score = -1.0
            best_label = None
            
            for label, opt_text in options.items():
                if not opt_text: continue
                opt_vector = cls.get_embedding(opt_text)
                if not opt_vector: continue
                
                score = cls._cosine_similarity(ans_vector, opt_vector)
                if score > best_score:
                    best_score = score
                    best_label = label
            
            # If the best match is weak (< 75%), we reject everything.
            if best_score < 0.75:
                return None

            confidence = payload.get('confidence')
            try:
                confidence = float(confidence) if confidence is not None else best_score
            except Exception:
                confidence = best_score

            explanation = (payload.get('brief_explanation') or '').strip()
            return {
                'correct_answer': best_label,
                'confidence': confidence,
                'explanation': explanation,
                'model_name': model_name,
            }
        except Exception:
            return None

    @classmethod
    def _generate_structured_content_hf(cls, prompt):
        """Generate structured JSON content using Hugging Face (background tasks)."""
        try:
            from huggingface_hub import InferenceClient
            hf_token = os.getenv('HF_TOKEN')
            if not hf_token:
                return None

            model_id = os.getenv('HF_STRUCTURED_MODEL') or 'meta-llama/Meta-Llama-3-8B-Instruct'
            hf_client = InferenceClient(token=hf_token)
            response = hf_client.chat.completions.create(
                model=model_id,
                max_tokens=4000,
                temperature=0.2,
                messages=[{'role': 'user', 'content': prompt}],
            )
            text = response.choices[0].message.content
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            text = text.strip()

            import re
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                match = re.search(r'(\[|\{).*(\]|\})', text, re.DOTALL)
                if match:
                    return json.loads(match.group(0))
        except Exception:
            return None
        return None

    @classmethod
    def enrich_question_with_hf(cls, question_id):
        """Asynchronously correct and enrich a question via Hugging Face."""
        from ..models import Question
        from flask import current_app
        import os
        from huggingface_hub import InferenceClient
        import json
        
        q = Question.query.get(question_id)
        if not q or q.hf_enriched:
            return
            
        hf_token = os.getenv('HF_TOKEN')
        if not hf_token:
            current_app.logger.warning('HF_TOKEN not set, cannot enrich question.')
            return
            
        client = InferenceClient(token=hf_token)
        
        prompt = f"""You are an expert Nigerian exam tutor. Evaluate this question and carefully determine the correct answer, a detailed explanation, and a relevant reference citation link.

Subject: {q.subject}
Topic: {q.topic}
Question: {q.question_text}
Option A: {q.option_a}
Option B: {q.option_b}
Option C: {q.option_c}
Option D: {q.option_d}

Return ONLY a strictly formatted JSON object with the following keys:
{{
  "correct_answer": "must be strictly A, B, C, or D",
  "explanation": "Detailed explanation of why the answer is correct.",
  "reference_link": "A real hyperlink to a reliable educational source validating this concept"
}}
No markdown formatting, just pure JSON text.
"""
        try:
            completion = client.chat.completions.create(
                model="google/gemma-4-31B-it:novita",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            
            output_text = completion.choices[0].message.content
            
            if '```json' in output_text:
                output_text = output_text.split('```json')[1].split('```')[0].strip()
            elif '```' in output_text:
                output_text = output_text.split('```')[1].split('```')[0].strip()
                
            data = json.loads(output_text)
            
            new_ans = data.get('correct_answer', '').strip().upper()
            if new_ans in ['A', 'B', 'C', 'D']:
                q.correct_answer = new_ans
                
            q.explanation = data.get('explanation', q.explanation)
            q.reference_link = data.get('reference_link', None)
            q.hf_enriched = True
            
            db.session.commit()
            current_app.logger.info(f"Successfully enriched question {question_id}")
            
        except Exception as e:
            current_app.logger.error(f"Failed to enrich question {question_id}: {e}")
            db.session.rollback()
