import os
import json
import time
import re
import sys
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import List, Dict, Any, Optional, Tuple

# Constants for scraping
BASE_URL = "https://www.examkits.com/jamb/past_questions/index.php"
SUBJECTS = [
    "english", "mathematics", "physics", "chemistry", "biology",
    "accounting", "geography", "economics", "commerce", "crs",
    "government", "agricultural-science", "history", "literature-in-english",
    "civic-education", "yoruba", "hausa", "igbo", "french", "arabic"
]
YEARS = list(range(2000, 2027))
DELAY_BETWEEN_REQUESTS = 0.5
DELAY_BETWEEN_YEARS = 1.0
DELAY_BETWEEN_SUBJECTS = 2.0
SAVE_EVERY = 5
SCRAPE_TIMEOUT = 15
IMG_FETCH_TIMEOUT = 8
LLM_TIMEOUT = 45
HEARTBEAT_SECS = 60
GROQ_SLOW_THRESHOLD = 25
GROQ_COOLDOWN_SECS = 180
MAX_CONSECUTIVE_FAILURES = 5

# Image filtering - skip site UI/Marketing
BAD_IMG_SUBSTRINGS = ["reg.png", "phone.jpg", "logo", "facebook", "twitter", "instagram", "youtube", "icon"]
PROXY_ENV_VARS = [
    "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
    "http_proxy", "https_proxy", "all_proxy",
    "GIT_HTTP_PROXY", "GIT_HTTPS_PROXY",
]

def disable_proxies():
    for key in PROXY_ENV_VARS:
        os.environ.pop(key, None)

def safe_print(message: str, **kwargs):
    """Safely print strings containing non-ASCII characters to the console."""
    try:
        print(message, **kwargs)
        sys.stdout.flush()
    except:
        try:
            print(message.encode('ascii', errors='replace').decode('ascii'), **kwargs)
            sys.stdout.flush()
        except: pass

class AIOrchestrator:
    def __init__(
        self,
        groq_keys: List[str],
        gemini_keys: List[str],
        force_groq: bool = False,
        use_ollama: bool = False,
        allow_remote: bool = True,
        ollama_model: str = "gemma3:1b",
        ollama_url: str = "http://localhost:11434/api/generate",
    ):
        self.groq_keys = groq_keys
        self.gemini_keys = gemini_keys
        self.force_groq = force_groq
        self.use_ollama = use_ollama
        self.allow_remote = allow_remote
        self.ollama_model = ollama_model
        self.ollama_url = ollama_url
        self.current_groq_idx = 0
        self.current_gemini_idx = 0
        self.groq_models = [
            "qwen/qwen3-32b",
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "groq/compound-mini",
            "groq/compound",
            "canopylabs/orpheus-v1-english",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "moonshotai/kimi-k2-instruct-0905",
        ]
        self.gemini_models = [
            "gemini-3-flash-preview",
            "gemini-3.1-pro-preview",
            "gemini-3.1-flash-lite-preview",
            "gemini-2.5-pro",
            "gemini-pro-latest",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
        ]
        self.groq_client = None
        self.genai = None
        self.groq_cooldown_until = 0.0
        self._init_clients()

    def _init_clients(self):
        try:
            from groq import Groq
            if self.groq_keys:
                self.groq_client = Groq(api_key=self.groq_keys[self.current_groq_idx])
        except ImportError: self.groq_client = None
        try:
            import google.generativeai as genai
            if self.gemini_keys:
                genai.configure(api_key=self.gemini_keys[self.current_gemini_idx])
                self.genai = genai
        except ImportError: self.genai = None

    def _rotate_groq_key(self):
        if len(self.groq_keys) > 1:
            self.current_groq_idx = (self.current_groq_idx + 1) % len(self.groq_keys)
            safe_print(f"\n[!] Groq Key exhausted. Rotating to key {self.current_groq_idx + 1}...")
            self._init_clients()
            return True
        return False

    def _rotate_gemini_key(self):
        if len(self.gemini_keys) > 1:
            self.current_gemini_idx = (self.current_gemini_idx + 1) % len(self.gemini_keys)
            safe_print(f"\n[!] Gemini Key exhausted. Rotating to key {self.current_gemini_idx + 1}...")
            self._init_clients()
            return True
        return False
    
    def _classify_error(self, e: Exception) -> str:
        msg = str(e).lower()
        if any(x in msg for x in ["timeout", "timed out"]):
            return "timeout"
        if any(x in msg for x in ["rate limit", "rate-limit", "quota", "429"]):
            return "rate_limit"
        if any(x in msg for x in ["unauthorized", "invalid api key", "api key not valid", "permission", "forbidden", "401", "403"]):
            return "auth"
        if any(x in msg for x in ["model not found", "unknown model", "does not exist"]):
            return "model"
        return "other"

    def _groq_cooling(self) -> bool:
        if self.force_groq:
            return False
        return time.time() < self.groq_cooldown_until

    def _note_groq_slow(self, elapsed: float, status: str):
        if self.force_groq:
            return
        if elapsed >= GROQ_SLOW_THRESHOLD or status in ["rate_limit", "timeout"]:
            self.groq_cooldown_until = max(self.groq_cooldown_until, time.time() + GROQ_COOLDOWN_SECS)
            safe_print(f"[!] Groq slow/limited. Cooling down for {GROQ_COOLDOWN_SECS}s; switching to Gemini.")

    def enrich_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        info = ""
        if question.get('instruction'): info += f"\nSECTION INSTRUCTION: {question['instruction']}"
        if question.get('passage'): info += f"\nCOMPREHENSION PASSAGE: {question['passage']}"
        if question.get('image_urls'): info += f"\nIMAGE_URLS: {', '.join(question['image_urls'])}"

        prompt = f"""You are an expert JAMB tutor. Analyze this {question['subject'].upper()} ({question['year']}) question.
{info}
QUESTION: {question['question_text']}
OPTIONS: {json.dumps(question['options'])}
SOURCE ANSWER: {question['correct_answer']}
SOURCE EXPLANATION: {question['explanation']}

STRICT INSTRUCTIONS:
1. Finalize the CORRECT ANSWER letter (A, B, C, or D).
2. Write a professional educational EXPLANATION based on the passage/instruction.
3. Classify TOPIC and SUBTOPIC.
4. Specify DIFFICULTY (Easy/Medium/Hard).
5. Provide COMMON_MISTAKE and 2 RELATED_TOPICS.

        RETURN ONLY VALID JSON:
{{
    "topic": "...",
    "subtopic": "...",
    "difficulty": "...",
    "correct_answer": "...",
    "explanation": "...",
    "common_mistake": "...",
    "related_topics": ["...", "..."]
}}"""

        if self.use_ollama:
            res = self._try_ollama(prompt)
            if res:
                return {**res, "enriched_by": f"ollama:{self.ollama_model}"}
            if not self.allow_remote:
                return {"enriched_by": "ollama:failed"}

        if question.get('image_urls'):
            res = self._try_gemini_models(prompt, question['image_urls'])
            if res:
                data, model = res
                return {**data, "enriched_by": f"gemini:{model}"}

        if self.force_groq:
            res = self._try_groq_models(prompt)
            if res:
                data, model = res
                return {**data, "enriched_by": f"groq:{model}"}

            res = self._try_gemini_models(prompt)
            if res:
                data, model = res
                return {**data, "enriched_by": f"gemini:{model}"}
        elif self._groq_cooling():
            res = self._try_gemini_models(prompt)
            if res:
                data, model = res
                return {**data, "enriched_by": f"gemini:{model}"}
            if not self._groq_cooling():
                res = self._try_groq_models(prompt)
                if res:
                    data, model = res
                    return {**data, "enriched_by": f"groq:{model}"}
        else:
            res = self._try_groq_models(prompt)
            if res:
                data, model = res
                return {**data, "enriched_by": f"groq:{model}"}

            res = self._try_gemini_models(prompt)
            if res:
                data, model = res
                return {**data, "enriched_by": f"gemini:{model}"}
        
        return {"enriched_by": "fallback"}

    def _try_ollama(self, prompt: str) -> Optional[Dict[str, Any]]:
        try:
            payload = {"model": self.ollama_model, "prompt": prompt, "stream": False}
            res = requests.post(self.ollama_url, json=payload, timeout=LLM_TIMEOUT, proxies={"http": None, "https": None})
            if res.status_code != 200:
                return None
            data = res.json()
            text = data.get("response", "")
            return self._parse_json(text)
        except Exception:
            return None

    def _try_groq_once(self, model: str, prompt: str) -> Tuple[Optional[Dict[str, Any]], str]:
        if not self.groq_client: return None, "no_client"
        start = time.time()
        try:
            response = self.groq_client.chat.completions.create(
                model=model, messages=[{"role": "user", "content": prompt}],
                max_tokens=1000, temperature=0.1, timeout=LLM_TIMEOUT
            )
            parsed = self._parse_json(response.choices[0].message.content)
            if not parsed:
                status = "bad_response"
                self._note_groq_slow(time.time() - start, status)
                return None, status
            status = "ok"
            self._note_groq_slow(time.time() - start, status)
            return parsed, status
        except Exception as e:
            status = self._classify_error(e)
            self._note_groq_slow(time.time() - start, status)
            return None, status

    def _try_groq_models(self, prompt: str) -> Optional[Tuple[Dict[str, Any], str]]:
        if not self.groq_client or self._groq_cooling(): return None
        for _ in range(len(self.groq_keys)):
            should_rotate = False
            for model in self.groq_models:
                data, status = self._try_groq_once(model, prompt)
                if status == "ok": return data, model
                if self._groq_cooling(): return None
                if status in ["rate_limit", "auth"]:
                    should_rotate = True
                    if status == "auth": break
                    continue
                # model/other/bad_response -> try next model on same key
            if should_rotate:
                if not self._rotate_groq_key(): break
            else:
                break
        return None

    def _try_gemini_once(self, model_name: str, prompt: str, image_urls: List[str] = None) -> Tuple[Optional[Dict[str, Any]], str]:
        if not self.genai: return None, "no_client"
        try:
            model = self.genai.GenerativeModel(model_name)
            content = [prompt]
            if image_urls:
                for url in image_urls[:2]:
                    try:
                        img_res = requests.get(url, timeout=IMG_FETCH_TIMEOUT, proxies={"http": None, "https": None})
                        if img_res.status_code == 200:
                            content.append({'mime_type': 'image/png', 'data': img_res.content})
                    except: pass
            response = model.generate_content(content, request_options={"timeout": LLM_TIMEOUT})
            parsed = self._parse_json(response.text)
            if not parsed: return None, "bad_response"
            return parsed, "ok"
        except Exception as e:
            return None, self._classify_error(e)

    def _try_gemini_models(self, prompt: str, image_urls: List[str] = None) -> Optional[Tuple[Dict[str, Any], str]]:
        if not self.genai: return None
        for _ in range(len(self.gemini_keys)):
            should_rotate = False
            for model in self.gemini_models:
                data, status = self._try_gemini_once(model, prompt, image_urls)
                if status == "ok": return data, model
                if status in ["rate_limit", "auth"]:
                    should_rotate = True
                    if status == "auth": break
                    continue
                # model/other/bad_response -> try next model on same key
            if should_rotate:
                if not self._rotate_gemini_key(): break
            else:
                break
        return None

    def _parse_json(self, text: str) -> Optional[Dict[str, Any]]:
        try:
            text = text.strip()
            if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text: text = text.split("```")[1].split("```")[0].strip()
            s, e = text.find('{'), text.rfind('}')
            if s != -1 and e != -1: text = text[s:e+1]
            return json.loads(text)
        except: return None

class BeaconPipeline:
    def __init__(self):
        self.all_questions = []
        self.stats = {"scraped": 0, "enriched": 0, "providers": {}}
        self.existing_index = set()
        self.current_processing = None
        self.resume_hint = None
        self.missing = {}
        self.gap_report = False

    def _recompute_stats(self):
        stats = {"scraped": len(self.all_questions), "enriched": 0, "providers": {}}
        for q in self.all_questions:
            status = q.get("enrichment_status")
            is_enriched = status == "enriched"
            prov = "pending"
            if is_enriched:
                enriched_by = q.get("enriched_by")
                if isinstance(enriched_by, str) and enriched_by:
                    prov = enriched_by.split(":")[0]
                else:
                    prov = "unknown"
            stats["providers"][prov] = stats["providers"].get(prov, 0) + 1
            if is_enriched:
                stats["enriched"] += 1
        self.stats = stats

    def _load_existing(self, path: str) -> bool:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.resume_hint = (data.get("metadata") or {}).get("summary") or {}
            questions = data.get("questions", [])
            if not isinstance(questions, list):
                return False
            for q in questions:
                if isinstance(q, dict) and "enrichment_status" not in q:
                    eb = q.get("enriched_by")
                    if isinstance(eb, str) and eb and eb not in ["pending", "fallback", "ollama:failed"]:
                        q["enrichment_status"] = "enriched"
                    else:
                        q["enrichment_status"] = "pending"
            self.all_questions = questions
            self.existing_index = {
                (q.get("subject"), q.get("year"), q.get("question_number"))
                for q in questions
            }
            self._recompute_stats()
            return True
        except Exception:
            return False

    def _get_fast_resume_point(self) -> Optional[Tuple[str, int, int]]:
        summary = self.resume_hint or {}
        candidates = []
        for key in ["current_processing", "last_question"]:
            v = summary.get(key)
            if isinstance(v, dict):
                subj = v.get("subject")
                year = v.get("year")
                qnum = v.get("question_number")
                if subj in SUBJECTS and isinstance(year, int) and year in YEARS and isinstance(qnum, int):
                    idx = (SUBJECTS.index(subj), YEARS.index(year), qnum)
                    candidates.append((idx, (subj, year, qnum)))
        if candidates:
            candidates.sort(key=lambda x: x[0])
            return candidates[-1][1]
        if self.all_questions:
            last_q = self.all_questions[-1]
            subj = last_q.get("subject")
            year = last_q.get("year")
            qnum = last_q.get("question_number")
            if subj in SUBJECTS and isinstance(year, int) and year in YEARS and isinstance(qnum, int):
                return subj, year, qnum
        return None

    def _get_last_enriched_point(self) -> Optional[Tuple[str, int, int]]:
        best = None
        best_idx = None
        for q in self.all_questions:
            if q.get("enrichment_status") != "enriched":
                continue
            subj = q.get("subject")
            year = q.get("year")
            qnum = q.get("question_number")
            if subj not in SUBJECTS or year not in YEARS or not isinstance(qnum, int):
                continue
            idx = (SUBJECTS.index(subj), YEARS.index(year), qnum)
            if best_idx is None or idx > best_idx:
                best_idx = idx
                best = (subj, year, qnum)
        return best

    def _advance_point(self, point: Optional[Tuple[str, int, int]]) -> Optional[Tuple[str, int, int]]:
        if not point:
            return None
        subj, year, qnum = point
        if subj not in SUBJECTS or year not in YEARS or not isinstance(qnum, int):
            return None
        if qnum < 100:
            return subj, year, qnum + 1
        y_idx = YEARS.index(year)
        if y_idx + 1 < len(YEARS):
            return subj, YEARS[y_idx + 1], 1
        s_idx = SUBJECTS.index(subj)
        if s_idx + 1 < len(SUBJECTS):
            return SUBJECTS[s_idx + 1], YEARS[0], 1
        return None

    def enrich_existing(self, orchestrator: AIOrchestrator):
        safe_print("[!] Enrichment-only mode: processing pending questions.\n")
        updated = 0
        for i, q in enumerate(self.all_questions):
            status = q.get("enrichment_status")
            enriched_by = q.get("enriched_by")
            if status == "enriched":
                continue
            if status is None and isinstance(enriched_by, str) and enriched_by and enriched_by not in ["pending", "fallback", "ollama:failed"]:
                continue

            enrichment = orchestrator.enrich_question(q)
            enriched_by = enrichment.get("enriched_by", "fallback")
            status = "enriched" if enriched_by not in ["fallback", "ollama:failed"] else "pending"

            q.update({
                "topic": enrichment.get("topic", q.get("topic", "")),
                "subtopic": enrichment.get("subtopic", q.get("subtopic", "")),
                "difficulty": enrichment.get("difficulty", q.get("difficulty", "")),
                "correct_answer": enrichment.get("correct_answer", q.get("correct_answer", "Unknown")),
                "explanation": enrichment.get("explanation", q.get("explanation", "")),
                "common_mistake": enrichment.get("common_mistake", q.get("common_mistake", "")),
                "related_topics": enrichment.get("related_topics", q.get("related_topics", [])),
                "enriched_by": enriched_by,
                "enriched_at": datetime.now().isoformat() if status == "enriched" else q.get("enriched_at"),
                "enrichment_status": status,
            })
            updated += 1

            if updated % SAVE_EVERY == 0:
                self._recompute_stats()
                self.save_progress()

        self._recompute_stats()
        self.save_progress(final=True)
        safe_print(f"[!] Enrichment-only complete. Updated {updated} questions.")

    def _record_missing(self, subj: str, year: int, q_num: int, reason: str):
        key = f"{subj}:{year}"
        entry = {"question_number": q_num, "reason": reason}
        self.missing.setdefault(key, []).append(entry)

    def _build_metadata(self, final: bool) -> Dict[str, Any]:
        now = datetime.now()
        years = sorted({q.get("year") for q in self.all_questions if isinstance(q.get("year"), int)})
        subjects = sorted({q.get("subject") for q in self.all_questions if q.get("subject")})
        last_q = self.all_questions[-1] if self.all_questions else None

        summary = {
            "current_year": now.year,
            "updated_at": now.isoformat(),
            "scraped": self.stats.get("scraped", len(self.all_questions)),
            "enriched": self.stats.get("enriched", 0),
            "providers": self.stats.get("providers", {}),
        }
        if years:
            summary["years"] = {"min": years[0], "max": years[-1], "count": len(years)}
        if subjects:
            summary["subjects"] = {"count": len(subjects), "list": subjects}
        if last_q:
            summary["last_question"] = {
                "subject": last_q.get("subject"),
                "year": last_q.get("year"),
                "question_number": last_q.get("question_number"),
            }
        if self.current_processing:
            summary["current_processing"] = self.current_processing

        return {
            "total": len(self.all_questions),
            "status": "Complete" if final else "In Progress",
            "current_year": now.year,
            "updated_at": now.isoformat(),
            "summary": summary,
        }

    def run(self):
        safe_print("\n" + "="*80)
        safe_print(" BEACON PRODUCTION v1.6 - SMART DOM & FRESH START ".center(80, "="))
        safe_print("="*80 + "\n")
        disable_proxies()
        
        output_path = os.path.join(os.path.dirname(__file__), "beacon_enriched_questions.json")
        self.output_path = output_path
        fresh_start = os.environ.get("FRESH_START", "").strip().lower() in ["1", "true", "yes"]
        if os.path.exists(output_path) and not fresh_start:
            if self._load_existing(output_path):
                safe_print(f"[!] Resume mode: Loaded {len(self.all_questions)} existing questions.\n")
        elif os.path.exists(output_path) and fresh_start:
            os.remove(output_path)
            safe_print("[!] Fresh Start initiated: Old JSON removed.\n")
        
        force_groq = os.environ.get("FORCE_GROQ", "").strip().lower() in ["1", "true", "yes"]
        use_ollama = os.environ.get("USE_OLLAMA", "").strip().lower() in ["1", "true", "yes"]
        allow_remote = os.environ.get("ALLOW_REMOTE", "").strip().lower() not in ["0", "false", "no"]
        ollama_model = (os.environ.get("OLLAMA_MODEL", "gemma3:1b") or "gemma3:1b").strip()
        ollama_url = (os.environ.get("OLLAMA_URL", "http://localhost:11434/api/generate") or "http://localhost:11434/api/generate").strip()
        scan_all = os.environ.get("SCAN_ALL_QUESTIONS", "").strip().lower() in ["1", "true", "yes"]
        self.gap_report = os.environ.get("GAP_REPORT", "").strip().lower() in ["1", "true", "yes"]
        scrape_only = os.environ.get("SCRAPE_ONLY", "").strip().lower() in ["1", "true", "yes"]
        enrich_only = os.environ.get("ENRICH_ONLY", "").strip().lower() in ["1", "true", "yes"]
        auto_enrich_after_scrape = os.environ.get("AUTO_ENRICH_AFTER_SCRAPE", "").strip().lower() in ["1", "true", "yes"]

        needs_keys = not scrape_only and not (use_ollama and not allow_remote)
        if needs_keys:
            gk = os.environ.get("GROQ_API_KEYS") or input("GROQ_API_KEYS: ").strip()
            ak = os.environ.get("GEMINI_API_KEYS") or input("GEMINI_API_KEYS: ").strip()
        else:
            gk = os.environ.get("GROQ_API_KEYS", "")
            ak = os.environ.get("GEMINI_API_KEYS", "")
        orchestrator = None
        if (not scrape_only) or enrich_only:
            orchestrator = AIOrchestrator(
                [k.strip() for k in gk.split(",") if k.strip()],
                [k.strip() for k in ak.split(",") if k.strip()],
                force_groq=force_groq,
                use_ollama=use_ollama,
                allow_remote=allow_remote,
                ollama_model=ollama_model,
                ollama_url=ollama_url
            )
        start_time = time.time()
        last_save_time = time.time()
        fast_resume = os.environ.get("FAST_RESUME", "").strip().lower() in ["1", "true", "yes"]
        fast_resume_from_enriched = os.environ.get("FAST_RESUME_FROM_ENRICHED", "").strip().lower() in ["1", "true", "yes"]
        fast_resume_after_enriched = os.environ.get("FAST_RESUME_AFTER_ENRICHED", "").strip().lower() in ["1", "true", "yes"]
        resume_after_enriched = fast_resume_from_enriched or fast_resume_after_enriched
        resume_point = None
        if fast_resume:
            if resume_after_enriched:
                last_enriched = self._get_last_enriched_point()
                if last_enriched:
                    resume_point = self._advance_point(last_enriched)
                    if resume_point:
                        safe_print(
                            f"[!] Fast resume after last enriched: "
                            f"{last_enriched[0]} {last_enriched[1]} Q{last_enriched[2]} "
                            f"-> {resume_point[0]} {resume_point[1]} Q{resume_point[2]}.\n"
                        )
                    else:
                        safe_print("[!] Last enriched is at the end of the range; nothing to resume.\n")
                else:
                    safe_print("[!] No enriched questions found; falling back to standard fast resume.\n")
                    resume_point = self._get_fast_resume_point()
            else:
                resume_point = self._get_fast_resume_point()
        if resume_point:
            r_subj, r_year, r_qnum = resume_point
            safe_print(f"[!] Fast resume enabled: starting from {r_subj} {r_year} Q{r_qnum}.\n")
        else:
            r_subj = r_year = r_qnum = None

        def heartbeat():
            nonlocal last_save_time
            if time.time() - last_save_time >= HEARTBEAT_SECS:
                self.save_progress()
                last_save_time = time.time()

        if enrich_only:
            if not orchestrator:
                safe_print("[!] Enrichment-only mode requires a model backend. Exiting.")
                return
            self.enrich_existing(orchestrator)
            return
        
        start_subject_idx = SUBJECTS.index(r_subj) if r_subj in SUBJECTS else 0
        start_year_idx = YEARS.index(r_year) if isinstance(r_year, int) and r_year in YEARS else 0

        for s_idx, subj in enumerate(SUBJECTS):
            if fast_resume and s_idx < start_subject_idx:
                continue
            safe_print(f"\n>>> PROCESSING SUBJECT: {subj.upper()}")
            for y_idx, year in enumerate(YEARS):
                if fast_resume and s_idx == start_subject_idx and y_idx < start_year_idx:
                    continue
                safe_print(f"  --- Year: {year} ---")
                consecutive_failures = 0
                q_start = 1
                if fast_resume and s_idx == start_subject_idx and y_idx == start_year_idx and isinstance(r_qnum, int):
                    q_start = max(1, min(100, r_qnum))
                for q_num in range(q_start, 101):
                    self.current_processing = {"subject": subj, "year": year, "question_number": q_num}
                    heartbeat()
                    url = f"{BASE_URL}?subj={subj}&y={year}&q={q_num}"
                    if (subj, year, q_num) in self.existing_index:
                        heartbeat()
                        continue

                    q_data = self.scrape_question(url, subj, year, q_num)
                    
                    if q_data and q_data.get("question_text"):
                        if scrape_only:
                            q_data.update({
                                "topic": "",
                                "subtopic": "",
                                "difficulty": "",
                                "common_mistake": "",
                                "related_topics": [],
                                "enriched_by": "pending",
                                "enriched_at": None,
                                "enrichment_status": "pending",
                            })
                        else:
                            enrichment = orchestrator.enrich_question(q_data) if orchestrator else {"enriched_by": "fallback"}
                            enriched_by = enrichment.get("enriched_by", "fallback")
                            status = "enriched" if enriched_by not in ["fallback", "ollama:failed"] else "pending"

                            # CONSOLIDATED SCHEMA AS REQUESTED
                            q_data.update({
                                "topic": enrichment.get("topic", "General"),
                                "subtopic": enrichment.get("subtopic", "Basic"),
                                "difficulty": enrichment.get("difficulty", "Medium"),
                                "correct_answer": enrichment.get("correct_answer", q_data["correct_answer"]),
                                "explanation": enrichment.get("explanation", q_data["explanation"]),
                                "common_mistake": enrichment.get("common_mistake", ""),
                                "related_topics": enrichment.get("related_topics", []),
                                "enriched_by": enriched_by,
                                "enriched_at": datetime.now().isoformat() if status == "enriched" else None,
                                "enrichment_status": status,
                            })
                            if (not q_data["correct_answer"] or q_data["correct_answer"] == "Unknown") and not scrape_only:
                                if self.gap_report:
                                    self._record_missing(subj, year, q_num, "unknown_answer")
                                continue
                        
                        self.all_questions.append(q_data)
                        self.existing_index.add((subj, year, q_num))
                        self.stats["scraped"] += 1
                        status = q_data.get("enrichment_status")
                        prov = "pending" if status != "enriched" else q_data.get("enriched_by", "pending").split(':')[0]
                        self.stats["providers"][prov] = self.stats["providers"].get(prov, 0) + 1
                        if status == "enriched": self.stats["enriched"] = self.stats.get("enriched", 0) + 1
                        
                        safe_print(f"    [OK] Q{q_num}: {q_data['question_text'][:35]}...")
                        if len(self.all_questions) % SAVE_EVERY == 0:
                            self.save_progress()
                            last_save_time = time.time()
                        consecutive_failures = 0
                    else:
                        consecutive_failures += 1
                        if self.gap_report:
                            self._record_missing(subj, year, q_num, "no_data")
                    
                    if (not scan_all) and consecutive_failures >= MAX_CONSECUTIVE_FAILURES: break
                    heartbeat()
                    time.sleep(DELAY_BETWEEN_REQUESTS)
                heartbeat()
                time.sleep(DELAY_BETWEEN_YEARS)
        self.current_processing = None
        self.save_progress(final=not auto_enrich_after_scrape)
        if self.gap_report:
            report_path = os.path.join(os.path.dirname(self.output_path), "beacon_missing_report.json")
            report = {
                "generated_at": datetime.now().isoformat(),
                "missing_total": sum(len(v) for v in self.missing.values()),
                "missing": self.missing,
            }
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
        if auto_enrich_after_scrape:
            if not orchestrator:
                if not use_ollama:
                    safe_print("[!] AUTO_ENRICH_AFTER_SCRAPE requires USE_OLLAMA=1 (or enable remote keys).")
                    return
                orchestrator = AIOrchestrator(
                    [],
                    [],
                    force_groq=force_groq,
                    use_ollama=True,
                    allow_remote=allow_remote,
                    ollama_model=ollama_model,
                    ollama_url=ollama_url
                )
            self.enrich_existing(orchestrator)

    def save_progress(self, final=False):
        output_path = getattr(self, "output_path", "beacon_enriched_questions.json")
        output = {
            "metadata": self._build_metadata(final),
            "questions": self.all_questions,
            "stats": self.stats,
        }
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)
        if not final: safe_print(f"    [SAVE] Total Items: {len(self.all_questions)}")

    def scrape_question(self, url, subj, year, q_num):
        try:
            res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=SCRAPE_TIMEOUT, proxies={"http": None, "https": None})
            if res.status_code != 200: return None
            soup = BeautifulSoup(res.text, 'html.parser')
            container = soup.find('div', class_='border-l-4') or soup.find('div', class_='bg-white')
            if not container: return None

            instr, q_text = "", ""
            h1 = container.find('h1')
            h3 = container.find('h3')
            
            # Smart context detection for English/Passages
            if h1 and h3:
                h1_t = h1.get_text(strip=True)
                h3_t = h3.get_text(strip=True)
                # In many older pages, H1 is breadcrumb, H3 is the instruction.
                # In Q16, H1 is the actual prompt, H3 is the instruction.
                if "Question " in h1_t and ":" in h1_t:
                    q_text = h1_t.split(":", 1)[1].strip()
                    instr = h3_t
                else:
                    q_text = h3_t
                    instr = h1_t 
            elif h3:
                q_text = h3.get_text(strip=True)
            elif h1:
                q_text = h1.get_text(strip=True)
            
            if "Question " in q_text and ":" in q_text: q_text = q_text.split(":", 1)[1].strip()
            # If instruction is just breadcrumbs, clear it
            if "JAMB Past questions" in instr: instr = ""

            passage_elem = soup.find('div', class_='modal-body')
            passage = passage_elem.get_text(strip=True) if passage_elem else ""

            image_urls = [urljoin(url, img.get('src')) for img in container.find_all('img') if img.get('src') and not any(bad in img.get('src').lower() for bad in BAD_IMG_SUBSTRINGS)]

            options = {f"option_{chr(97+i)}": l.get_text(strip=True) for i, l in enumerate(container.find_all('label', class_='ml-3'))}
            ans, expl = "Unknown", ""
            for h4 in container.find_all('h4'):
                ht = h4.get_text()
                if "Correct Answer" in ht:
                    v = h4.find_next_sibling(string=True) or h4.next_sibling
                    ans = str(v).replace("Correct Answer", "").replace(":", "").strip() if v else "Unknown"
                elif "Explanation" in ht:
                    v = h4.find_next_sibling(string=True) or h4.find_next('p') or h4.next_sibling
                    expl = str(v.get_text() if hasattr(v, 'get_text') else v).strip() if v else ""

            return {"subject": subj, "year": year, "question_number": q_num, "question_text": q_text, "instruction": instr, "passage": passage, "image_urls": image_urls, "options": options, "correct_answer": ans, "explanation": expl}
        except: return None

if __name__ == "__main__":
    BeaconPipeline().run()
