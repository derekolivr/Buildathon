#Lets you upload any document(pdf) and extracts all the biodata from the document and stores in a csv and a sql3 db file which can be used by the auto form filler

import os
import re
import json
import csv
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional

# System installs for OCR in Colab
!apt-get update -qq && apt-get install -y -qq tesseract-ocr poppler-utils > /dev/null
!pip -q install pdf2image pytesseract > /dev/null

from pdf2image import convert_from_path
import pytesseract

# Colab upload UI
from google.colab import files

# --- Groq API Config (hardcoded as requested — do not share/commit this) ---
import requests

GROQ_API_KEY = ""  # WARNING: hardcoding keys is insecure
LLAMA_MODEL_NAME = "meta-llama/llama-4-maverick-17b-128e-instruct"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

class BiodataExtractor:
    def __init__(self, db_path: str = "user_profile.db", csv_path: str = "user_profile.csv", today_str: Optional[str] = None):
        self.db_path = db_path
        self.csv_path = csv_path
        self.today_str = today_str or datetime.now().strftime("%d-%m-%Y")
        self.headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        self.setup_storage()

    def setup_storage(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY,
                name TEXT,
                first_name TEXT,
                last_name TEXT,
                mobile_no TEXT,
                email_id TEXT,
                date_of_birth TEXT,
                address TEXT,
                designation TEXT,
                company TEXT,
                experience TEXT,
                age TEXT,
                gender TEXT,
                date TEXT,
                additional_fields TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute("SELECT COUNT(*) FROM user_profile")
        count = cursor.fetchone()[0]
        if count == 0:
            cursor.execute('''
                INSERT INTO user_profile (id, date, additional_fields)
                VALUES (1, ?, '{}')
            ''', (self.today_str,))
        conn.commit()
        conn.close()

        if not os.path.exists(self.csv_path):
            with open(self.csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'id','name','first_name','last_name','mobile_no','email_id',
                    'date_of_birth','address','designation','company','experience',
                    'age','gender','date','additional_fields','last_updated'
                ])
                writer.writerow([1,'','','','','','','','','','','','',self.today_str,'{}',datetime.now().isoformat()])

    def extract_text_from_pdf(self, pdf_path: str, dpi: int = 350) -> str:
        try:
            pages = convert_from_path(pdf_path, dpi=dpi)
            parts = []
            for i, page in enumerate(pages, 1):
                txt = pytesseract.image_to_string(page, config="--psm 6")
                parts.append(txt)
            full = "\n\n".join(parts)
            # Debug: print OCR preview
            print("\n=== OCR PREVIEW (first 1600 chars) ===")
            print(full[:1600])
            print("=== END OCR PREVIEW ===\n")
            return full
        except Exception as e:
            print(f"OCR error {pdf_path}: {e}")
            return ""

    def call_groq_api(self, messages: List[Dict[str, str]], use_json_mode: bool = True) -> Dict[str, Any]:
        payload = {
            "model": LLAMA_MODEL_NAME,
            "messages": messages,
            "temperature": 0.0,
            "max_tokens": 2048
        }
        # Try JSON mode if supported; harmless if ignored by provider
        if use_json_mode:
            payload["response_format"] = {"type": "json_object"}
        try:
            resp = requests.post(GROQ_URL, headers=self.headers, json=payload, timeout=90)
            if resp.status_code == 200:
                return resp.json()
            print(f"Groq error {resp.status_code}: {resp.text[:500]}")
            return {}
        except Exception as e:
            print(f"Error calling Groq API: {e}")
            return {}

    def _get_content_from_response(self, resp: Dict[str, Any]) -> Optional[str]:
        # Robust content extraction across common OpenAI-compatible shapes
        ch = resp.get("choices")
        if not ch or not isinstance(ch, list) or not ch:
            return None
        c0 = ch[0]  # FIX: Get the first choice from the list, not the entire list
        if isinstance(c0, dict):
            # 1) message.content
            msg = c0.get("message")
            if isinstance(msg, dict):
                cont = msg.get("content")
                if isinstance(cont, str) and cont.strip():
                    return cont
            # 2) text field
            cont = c0.get("text")
            if isinstance(cont, str) and cont.strip():
                return cont
            # 3) delta.content (stream fragments)
            delta = c0.get("delta")
            if isinstance(delta, dict):
                cont = delta.get("content")
                if isinstance(cont, str) and cont.strip():
                    return cont
            # 4) messages array as fallback
            msgs = c0.get("messages")
            if isinstance(msgs, list) and msgs:
                for m in msgs:
                    if isinstance(m, dict) and isinstance(m.get("content"), str):
                        return m["content"]
        return None

    def _strict_schema(self) -> Dict[str, Any]:
        return {
          "name": None, "first_name": None, "last_name": None,
          "mobile_no": None, "email_id": None, "date_of_birth": None,
          "address": None, "designation": None, "company": None,
          "experience": None, "age": None, "gender": None,
          "additional_fields": {}
        }

    def _make_messages(self, text: str) -> List[Dict[str, str]]:
        schema = self._strict_schema()
        cleaned = re.sub(r'\s+', ' ', text).strip()[:2500]
        sys_msg = "You output only a single JSON object matching the provided schema. Output must be valid json. No prose, no code fences, no explanations."
        usr_msg = f"""
Extract biodata from the following text into this exact JSON schema. 
Rules: 
- Use null for missing fields. 
- date_of_birth must be DD-MM-YYYY if present. 
- Include country code in mobile_no if visible. 
- If hall-ticket-like fields appear (roll_no, application_no, exam_date, exam_center, subject), put them under additional_fields with clear keys. 
Schema (keys and types to follow exactly): {json.dumps(schema)}
Text: {cleaned}
""".strip()
        return [
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": usr_msg}
        ]

    def _make_repair_messages(self, bad_content: str) -> List[Dict[str, str]]:
        schema = self._strict_schema()
        sys_msg = "You output only a single JSON object matching the provided schema. Output must be valid json. No prose, no code fences, no explanations."
        usr_msg = f"""
Convert the following content into a valid JSON that matches this exact schema. 
Do not add or remove keys; keep types consistent; return ONLY JSON.
Schema: {json.dumps(schema)}
Content:
{bad_content}
""".strip()
        return [
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": usr_msg}
        ]

    def extract_biodata_from_text(self, text: str) -> Dict[str, Any]:
        # First attempt with strict system prompt + JSON mode hint
        response = self.call_groq_api(self._make_messages(text), use_json_mode=True)
        if not response:
            print("LLM call returned empty response dict (attempt 1)")
            return {}

        # Debug: show keys and choices preview
        try:
            print("\n=== RAW LLM RESPONSE KEYS (attempt 1) ===")
            print(list(response.keys()))
            print("=== END RAW KEYS ===\n")
            print("\n=== CHOICES PREVIEW (attempt 1) ===")
            print(json.dumps(response.get("choices", [])[:1], indent=2)[:2500])
            print("=== END CHOICES PREVIEW ===\n")
        except Exception:
            pass

        content = self._get_content_from_response(response)
        if content:
            print("\n=== LLM CONTENT (attempt 1, first 3000 chars) ===")
            print(content[:3000])
            print("=== END LLM CONTENT ===\n")
            data = self._parse_json_from_content(content)
            if data:
                print("Parsed JSON (attempt 1):")
                print(json.dumps(data, indent=2))
                return data
            else:
                print("JSON parse failed (attempt 1), proceeding to repair pass.")
        else:
            print("Could not extract content (attempt 1), proceeding to repair pass.")

        # Repair attempt: ask model to convert output to valid JSON
        repair_seed = content if content else json.dumps(response)[:4000]
        response2 = self.call_groq_api(self._make_repair_messages(repair_seed), use_json_mode=True)
        if not response2:
            print("LLM call returned empty response dict (repair attempt)")
            return {}

        try:
            print("\n=== CHOICES PREVIEW (repair) ===")
            print(json.dumps(response2.get("choices", [])[:1], indent=2)[:2500])
            print("=== END CHOICES PREVIEW ===\n")
        except Exception:
            pass

        content2 = self._get_content_from_response(response2)
        if content2:
            print("\n=== LLM CONTENT (repair, first 3000 chars) ===")
            print(content2[:3000])
            print("=== END LLM CONTENT ===\n")
            data2 = self._parse_json_from_content(content2)
            if data2:
                print("Parsed JSON (repair):")
                print(json.dumps(data2, indent=2))
                return data2
            else:
                print("JSON parse failed (repair).")
        else:
            print("Could not extract content (repair).")
        return {}

    def _parse_json_from_content(self, content: str) -> Optional[Dict[str, Any]]:
        s = content.strip()

        # 0) If content is a JSON-encoded string (double-encoded), unwrap once then parse
        try:
            if (s.startswith('"') and s.endswith('"')) or ('\\\"' in s or '\\n' in s):
                unwrapped = json.loads(s)  # JSON string -> raw JSON text
                if isinstance(unwrapped, str):
                    s = unwrapped.strip()
        except Exception:
            pass

        # 1) Fenced JSON block
        try:
            m = re.search(r'```json\s*(.+?)\s*```', s, re.DOTALL)
            if m:
                return json.loads(m.group(1))
        except Exception:
            pass

        # 2) Outermost braces extraction via brace counting
        try:
            start = s.find('{')
            if start != -1:
                depth = 0
                end = None
                for i, ch in enumerate(s[start:], start=start):
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                        if depth == 0:
                            end = i + 1
                            break
                if end:
                    candidate = s[start:end]
                    return json.loads(candidate)
        except Exception:
            pass

        # 3) Direct load
        try:
            return json.loads(s)
        except Exception:
            return None

    def get_current_profile(self) -> Dict[str, Any]:
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM user_profile WHERE id = 1")
            row = cursor.fetchone()
            
            # Debug: Print raw row data
            print(f"Debug: Raw DB row: {row}")
            
            conn.close()
            if not row:
                print("Debug: No row found in database")
                return {}
                
            columns = ['id','name','first_name','last_name','mobile_no','email_id',
                       'date_of_birth','address','designation','company','experience',
                       'age','gender','date','additional_fields','last_updated']
            profile = dict(zip(columns, row))
            
            # Debug: Print profile before additional_fields parsing
            print(f"Debug: Profile before additional_fields parsing: {profile}")
            
            try:
                profile['additional_fields'] = json.loads(profile['additional_fields'] or '{}')
            except Exception as e:
                print(f"Debug: Error parsing additional_fields: {e}")
                profile['additional_fields'] = {}
                
            print(f"Debug: Final profile: {profile}")
            return profile
        except Exception as e:
            print(f"Error in get_current_profile: {e}")
            import traceback
            traceback.print_exc()
            return {}

    def update_profile(self, new_biodata: Dict[str, Any]) -> bool:
        if not new_biodata or not any(v for v in new_biodata.values() if v not in [None, ""]):
            print("No biodata to update")
            return False

        print("Incoming non-empty biodata keys:", [k for k,v in new_biodata.items() if v not in [None, ""]])

        current_profile = self.get_current_profile()
        update_fields, update_values = [], []

        standard_fields = [
            'name','first_name','last_name','mobile_no','email_id',
            'date_of_birth','address','designation','company',
            'experience','age','gender'
        ]

        # Check for updates needed - only update if different or currently empty
        for field in standard_fields:
            new_val = new_biodata.get(field)
            if isinstance(new_val, str):
                new_val = new_val.strip()
            cur_val = current_profile.get(field)
            cur_val_stripped = cur_val.strip() if isinstance(cur_val, str) else cur_val
            
            # Only update if new value exists and is different from current (avoids duplicates)
            if new_val not in [None, ""] and new_val != cur_val_stripped:
                update_fields.append(f"{field} = ?")
                update_values.append(new_val)
                print(f"Will update {field}: '{cur_val}' -> '{new_val}'")

        # Handle additional_fields merging (avoids duplicates)
        cur_add = current_profile.get('additional_fields', {}) or {}
        new_add = new_biodata.get('additional_fields', {}) or {}
        merged_add = dict(cur_add)
        changed = False
        if isinstance(new_add, dict):
            for k, v in new_add.items():
                if v not in [None, ""] and (k not in merged_add or not merged_add.get(k)):
                    merged_add[k] = v
                    changed = True
                    print(f"Will add additional_fields.{k} = '{v}'")
        if changed:
            update_fields.append("additional_fields = ?")
            update_values.append(json.dumps(merged_add))

        if not update_fields:
            print("No new information to update (no duplicates created)")
            return False

        update_fields.append("last_updated = ?")
        update_values.append(datetime.now().isoformat())

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            sql = f"UPDATE user_profile SET {', '.join(update_fields)} WHERE id = 1"
            print(f"Debug: Executing SQL: {sql}")
            print(f"Debug: With values: {update_values}")
            
            cursor.execute(sql, update_values)
            rows_affected = cursor.rowcount
            print(f"Debug: Rows affected: {rows_affected}")
            
            conn.commit()
            conn.close()
            
            # Verify the update worked
            print("Debug: Verifying update...")
            verification_profile = self.get_current_profile()
            
            self.update_csv_from_db()
            print("Profile updated.")
            return True
        except Exception as e:
            print("DB update error:", e)
            import traceback
            traceback.print_exc()
            return False

    def update_csv_from_db(self):
        try:
            profile = self.get_current_profile()
            if not profile:
                print("Debug: No profile to write to CSV")
                return
                
            print(f"Debug: Writing profile to CSV: {profile}")
            
            with open(self.csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'id','name','first_name','last_name','mobile_no','email_id',
                    'date_of_birth','address','designation','company','experience',
                    'age','gender','date','additional_fields','last_updated'
                ])
                writer.writerow([
                    profile.get('id',''),
                    profile.get('name',''),
                    profile.get('first_name',''),
                    profile.get('last_name',''),
                    profile.get('mobile_no',''),
                    profile.get('email_id',''),
                    profile.get('date_of_birth',''),
                    profile.get('address',''),
                    profile.get('designation',''),
                    profile.get('company',''),
                    profile.get('experience',''),
                    profile.get('age',''),
                    profile.get('gender',''),
                    profile.get('date',''),
                    json.dumps(profile.get('additional_fields', {})),
                    profile.get('last_updated','')
                ])
            print(f"Debug: CSV updated successfully at {self.csv_path}")
        except Exception as e:
            print(f"Error updating CSV: {e}")
            import traceback
            traceback.print_exc()

    def extract_and_update_profile_from_pdf(self, pdf_path: str, dpi: int = 350) -> Optional[Dict[str, Any]]:
        print(f"Processing PDF: {pdf_path}")
        text = self.extract_text_from_pdf(pdf_path, dpi=dpi)
        if not text.strip():
            print("No text extracted from PDF")
            return None
        biodata = self.extract_biodata_from_text(text)
        if not biodata:
            print("No biodata extracted")
            return None
        ok = self.update_profile(biodata)
        return self.get_current_profile() if ok else None

def upload_and_process_pdfs(dpi: int = 350):
    uploaded = files.upload()  # popup; select one or more PDFs
    pdf_paths = []
    for fname, data in uploaded.items():
        with open(fname, 'wb') as f:
            f.write(data)
        if fname.lower().endswith(".pdf"):
            pdf_paths.append(fname)

    if not pdf_paths:
        print("No PDF files uploaded.")
        return

    extractor = BiodataExtractor()
    for p in pdf_paths:
        extractor.extract_and_update_profile_from_pdf(p, dpi=dpi)

    print("\nFinal stored profile:")
    profile = extractor.get_current_profile()
    print(json.dumps(profile, indent=2))

# Usage in Colab:
# 1) Set GROQ_API_KEY above to a valid key string.
upload_and_process_pdfs(dpi=350)
