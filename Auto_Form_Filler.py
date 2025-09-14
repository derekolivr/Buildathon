# Auto form Filling

# Currently takes manual biodata but you can change it to take data from the csv or sql db file outputed by the document processor code

import requests
import json
import base64
import re
import os
from pdf2image import convert_from_path
from PIL import Image, ImageDraw, ImageFont
import pytesseract
from typing import List, Dict, Tuple, Any

# --- Groq API Config ---
GROQ_API_KEY = "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"
LLAMA_MODEL_NAME = "meta-llama/llama-4-maverick-17b-128e-instruct"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

class SimplePDFAutoFillSystem:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF using OCR"""
        pages = convert_from_path(pdf_path, dpi=200)
        full_text = ""
        for page in pages:
            text = pytesseract.image_to_string(page)
            full_text += text + "\n\n"
        return full_text

    def call_groq_api(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Make API call to Groq"""
        payload = {
            "model": LLAMA_MODEL_NAME,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 4096
        }

        response = requests.post(GROQ_URL, headers=self.headers, json=payload)

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API call failed: {response.status_code} - {response.text}")

    def extract_fillable_fields(self, pdf_path: str) -> Dict[str, Any]:
        """First LLM call: Extract all fillable parameters from PDF"""
        pdf_text = self.extract_text_from_pdf(pdf_path)

        prompt = f"""
        Analyze the following PDF content and identify ALL fillable parameters/fields that a user might need to fill out.

        PDF Content:
        {pdf_text}

        Please return a JSON object with the following structure:
        {{
            "fillable_fields": [
                {{
                    "field_name": "exact field name as it appears in PDF",
                    "field_type": "text/number/date/email/phone/address",
                    "description": "brief description of what this field expects",
                    "required": true/false
                }}
            ]
        }}

        Look for patterns like:
        - Name fields (First Name, Last Name, Full Name, etc.)
        - Contact information (Phone, Mobile, Email, Address)
        - Personal details (Date of Birth, Age, Gender)
        - Professional information (Designation, Company, Experience)
        - Any blank lines or spaces after labels
        - Fields with underscores, dots, or brackets for filling

        Return only valid JSON format.
        """

        messages = [{"role": "user", "content": prompt}]
        response = self.call_groq_api(messages)

        try:
            content = response['choices'][0]['message']['content']
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return json.loads(content)
        except:
            print(f"Error parsing first LLM response: {content}")
            return {"fillable_fields": []}

    def match_biodata_fields(self, fillable_fields: Dict[str, Any], biodata: Dict[str, Any]) -> Dict[str, Any]:
        """Second LLM call: Match biodata with fillable fields"""
        prompt = f"""
        You are an expert at semantic field matching. Given fillable PDF fields and user biodata,
        identify which biodata fields correspond to which PDF fields and extract their values.

        Fillable PDF Fields:
        {json.dumps(fillable_fields, indent=2)}

        User Biodata:
        {json.dumps(biodata, indent=2)}

        Tasks:
        1. Match biodata fields to PDF fields using semantic similarity
        2. Handle variations like "Phone" vs "Mobile", "Name" vs "Full Name", etc.
        3. Extract actual values from biodata for matched fields

        IMPORTANT: Return ONLY a valid JSON object in this exact format, no explanations or code:
        {{
            "matched_fields": [
                {{
                    "pdf_field": "exact PDF field name",
                    "biodata_field": "matched biodata field name",
                    "value": "actual value from biodata",
                    "confidence": 0.9
                }}
            ],
            "unmatched_pdf_fields": ["list of PDF fields not found in biodata"],
            "unused_biodata_fields": ["list of biodata fields not used"]
        }}

        Return ONLY the JSON object, nothing else.
        """

        messages = [{"role": "user", "content": prompt}]
        response = self.call_groq_api(messages)

        try:
            content = response['choices'][0]['message']['content']
            print(f"LLM Response: {content[:500]}...")

            json_data = None
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                json_data = json.loads(json_match.group(1))

            if not json_data:
                json_match = re.search(r'(\{[\s\S]*\})', content)
                if json_match:
                    json_data = json.loads(json_match.group(1))

            if not json_data:
                json_data = json.loads(content)

            # Post-process the matched fields to ensure colon handling
            json_data = self.normalize_field_names(json_data)
            return json_data

        except Exception as e:
            print(f"Error parsing LLM response: {e}")
            return self.fallback_field_matching(fillable_fields, biodata)

    def normalize_field_names(self, matched_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize field names to handle colon variations
        This ensures we can match both "Name" and "Name:" in OCR
        """
        if 'matched_fields' in matched_data:
            for field in matched_data['matched_fields']:
                pdf_field = field.get('pdf_field', '')

                # Store both versions - with and without colon
                field['pdf_field_variations'] = [
                    pdf_field,  # Original
                    pdf_field.rstrip(':'),  # Without colon
                    pdf_field.rstrip(':') + ':',  # With colon
                    pdf_field.rstrip(':').lower(),  # Lowercase without colon
                    pdf_field.rstrip(':').lower() + ':',  # Lowercase with colon
                ]

                # Remove duplicates while preserving order
                field['pdf_field_variations'] = list(dict.fromkeys(field['pdf_field_variations']))

        return matched_data

    def fallback_field_matching(self, fillable_fields: Dict[str, Any], biodata: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback method when LLM parsing fails"""
        print("Using fallback matching method...")

        matched_fields = []
        pdf_fields = fillable_fields.get('fillable_fields', [])

        field_mappings = {
            'applicant name': 'name',
            'contact name': 'name',
            'name': 'name',
            'phone': 'mobile_no',
            'phone no.': 'mobile_no',
            'phone number': 'mobile_no',
            'mobile': 'mobile_no',
            'company': 'company',
            'organization': 'company',
            'name of company': 'company',
            'address': 'address',
            'email': 'email_id',
            'email address': 'email_id',
            'date of birth': 'date_of_birth',
            'age': 'age',
            'gender': 'gender',
            'experience': 'experience',
            'designation': 'designation'
        }

        for pdf_field_obj in pdf_fields:
            pdf_field = pdf_field_obj.get('field_name', '').lower().rstrip(':')

            biodata_field = None
            for mapping_key, mapping_value in field_mappings.items():
                if mapping_key in pdf_field or pdf_field in mapping_key:
                    if mapping_value in biodata:
                        biodata_field = mapping_value
                        break

            if biodata_field:
                matched_fields.append({
                    "pdf_field": pdf_field_obj['field_name'],
                    "biodata_field": biodata_field,
                    "value": str(biodata[biodata_field]),
                    "confidence": 0.8,
                    "pdf_field_variations": [
                        pdf_field_obj['field_name'],
                        pdf_field_obj['field_name'].rstrip(':'),
                        pdf_field_obj['field_name'].rstrip(':') + ':',
                        pdf_field_obj['field_name'].lower(),
                        pdf_field_obj['field_name'].lower().rstrip(':'),
                        pdf_field_obj['field_name'].lower().rstrip(':') + ':'
                    ]
                })

        return {
            "matched_fields": matched_fields,
            "unmatched_pdf_fields": [],
            "unused_biodata_fields": []
        }

    def simple_autofill_with_pil(self, input_pdf: str, output_pdf: str, matched_data: Dict[str, Any]) -> str:
        """
        Simple autofill that finds exact keywords from JSON and fills next to them
        Now handles field name variations including colons
        """

        matched_fields = matched_data.get('matched_fields', [])
        if not matched_fields:
            print("No matched fields found")
            return output_pdf

        # Convert PDF to images
        pages = convert_from_path(input_pdf, dpi=200)

        # Setup font
        font = None
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/System/Library/Fonts/Arial.ttf",
            "C:/Windows/Fonts/arial.ttf"
        ]

        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, 22)
                break
            except:
                continue

        if not font:
            font = ImageFont.load_default()

        filled_pages = []
        total_filled = 0

        for page_idx, page in enumerate(pages):
            print(f"\nProcessing Page {page_idx + 1}...")

            # Get OCR data for this page
            text_data = pytesseract.image_to_data(page, output_type=pytesseract.Output.DICT)

            # DEBUG: Print all text found on this page
            print(f"🔍 DEBUG - All text found on page {page_idx + 1}:")
            all_text = [word.strip() for word in text_data["text"] if word.strip()]
            for i, word in enumerate(all_text):
                print(f"  {i}: '{word}'")
            print("=" * 50)

            # Create drawing context
            draw = ImageDraw.Draw(page)
            page_filled = 0

            # Process each matched field from JSON
            for field in matched_fields:
                pdf_field = field['pdf_field'].strip()
                value = str(field['value']).strip()
                field_variations = field.get('pdf_field_variations', [pdf_field])

                print(f"Looking for variations of: {field_variations} to fill with: '{value}'")

                field_found = False

                # Try each variation of the field name
                for variation in field_variations:
                    if field_found:
                        break

                    variation = variation.strip()
                    if not variation:
                        continue

                    variation_words = variation.split()

                    if len(variation_words) == 1:
                        # Single word field - direct match
                        for i, word in enumerate(text_data["text"]):
                            word_clean = word.strip()
                            variation_clean = variation.strip()

                            # Try exact match, case-insensitive match, and with/without colon
                            if (word_clean.lower() == variation_clean.lower() or
                                word_clean.lower() == variation_clean.lower().rstrip(':') or
                                word_clean.lower().rstrip(':') == variation_clean.lower().rstrip(':')):

                                field_found = self._try_fill_field(draw, text_data, i, value, font, "single word")
                                if field_found:
                                    page_filled += 1
                                    total_filled += 1
                                    print(f"✅ Found single word: '{word_clean}' (variation: '{variation}') -> filled with '{value}'")
                                    break
                    else:
                        # Multi-word field - find consecutive matching words
                        for i in range(len(text_data["text"]) - len(variation_words) + 1):
                            match_count = 0
                            start_idx = i

                            # Check if consecutive words match our field variation
                            for j, expected_word in enumerate(variation_words):
                                if i + j >= len(text_data["text"]):
                                    break

                                actual_word = text_data["text"][i + j].strip()
                                expected_clean = expected_word.strip().rstrip(':').lower()
                                actual_clean = actual_word.strip().rstrip(':').lower()

                                if actual_clean == expected_clean:
                                    match_count += 1
                                elif actual_word == "" and j < len(variation_words) - 1:
                                    # Skip empty words but don't count them
                                    continue
                                else:
                                    break

                            # If all words matched, try to fill after the last word
                            if match_count == len(variation_words):
                                last_word_idx = i + len(variation_words) - 1
                                # Find the actual last non-empty word
                                while last_word_idx >= i and not text_data["text"][last_word_idx].strip():
                                    last_word_idx -= 1

                                if last_word_idx >= i:
                                    field_found = self._try_fill_field(draw, text_data, last_word_idx, value, font, "multi-word")
                                    if field_found:
                                        page_filled += 1
                                        total_filled += 1
                                        matched_text = " ".join([text_data["text"][i+k].strip() for k in range(len(variation_words)) if i+k < len(text_data["text"]) and text_data["text"][i+k].strip()])
                                        print(f"✅ Found multi-word: '{matched_text}' (variation: '{variation}') -> filled with '{value}'")
                                        break

                if not field_found:
                    print(f"⚠️  Field '{pdf_field}' (all variations) not found on page {page_idx + 1}")

            print(f"Page {page_idx + 1}: Filled {page_filled} fields")
            filled_pages.append(page)

        print(f"\n📊 Total fields filled: {total_filled}")

        # Save the filled PDF
        if filled_pages:
            filled_pages[0].save(output_pdf, save_all=True, append_images=filled_pages[1:])
            print(f"✅ Filled PDF saved to: {output_pdf}")

        return output_pdf

    def _try_fill_field(self, draw, text_data, word_index, value, font, match_type):
        """Helper method to try filling a field at a given position"""
        try:
            # Get position of the matched word
            x = text_data["left"][word_index]
            y = text_data["top"][word_index]
            w = text_data["width"][word_index]
            h = text_data["height"][word_index]

            fill_position = None
            current_word = text_data["text"][word_index].strip()

            # Check if current word itself has fill indicators (: or _)
            if current_word.endswith(':') or '_' in current_word:
                if current_word.endswith(':'):
                    fill_position = (x + w + 10, y + int(h * 0.2))
                    print(f"🎯 Current word has colon: '{current_word}'")
                elif '_' in current_word and len(current_word) > 1:
                    try:
                        bbox = draw.textbbox((0, 0), value, font=font)
                        text_width = bbox[2] - bbox[0]
                    except:
                        text_width = len(value) * 12

                    centered_x = x + max(0, (w - text_width) // 2)
                    fill_position = (centered_x, y + int(h * 0.1))
                    print(f"🎯 Current word has underline: '{current_word}' - centering text")
            else:
                # Look for fill indicators in the next few words
                for check_idx in range(word_index + 1, min(word_index + 4, len(text_data["text"]))):
                    next_word = text_data["text"][check_idx].strip()

                    if not next_word:
                        continue

                    # Check for fill indicators
                    if (next_word.startswith(':') or
                        next_word.startswith('.') or
                        next_word.startswith('_') or
                        re.match(r'^[_:.\-]+$', next_word)):

                        # Get indicator position
                        next_x = text_data["left"][check_idx]
                        next_y = text_data["top"][check_idx]
                        next_w = text_data["width"][check_idx]
                        next_h = text_data["height"][check_idx]

                        # If it's underlines, center the text
                        if '_' in next_word and len(next_word) > 1:
                            try:
                                bbox = draw.textbbox((0, 0), value, font=font)
                                text_width = bbox[2] - bbox[0]
                            except:
                                text_width = len(value) * 12

                            centered_x = next_x + max(0, (next_w - text_width) // 2)
                            fill_position = (centered_x, next_y + int(next_h * 0.1))
                            print(f"🎯 Found underline indicator: '{next_word}' - centering text")
                        else:
                            # For : or ., place right after the indicator
                            fill_position = (next_x + next_w + 5, next_y + int(next_h * 0.2))
                            print(f"🎯 Found indicator: '{next_word}' - placing after")

                        break
                    elif re.match(r'^[a-zA-Z0-9\s]+$', next_word):
                        # Stop if we hit normal text (not an indicator)
                        break

            # If still no position found, try placing directly after the matched word
            if not fill_position:
                fill_position = (x + w + 10, y + int(h * 0.2))
                print(f"🔸 No specific indicator found, placing after word '{current_word}'")

            # Fill the text if we found a valid position
            if fill_position:
                draw.text(fill_position, value, font=font, fill="black")
                print(f"✅ Filled using {match_type} at {fill_position}")
                return True
            else:
                print(f"🔸 Could not determine fill position for '{current_word}'")
                return False

        except Exception as e:
            print(f"❌ Error in _try_fill_field: {e}")
            return False

    def autofill_pdf(self, input_pdf: str, output_pdf: str, biodata: Dict[str, Any]) -> str:
        """Complete auto-fill pipeline with simplified filling"""
        print("Step 1: Extracting fillable fields from PDF...")
        fillable_fields = self.extract_fillable_fields(input_pdf)
        print(f"Found {len(fillable_fields.get('fillable_fields', []))} fillable fields")

        # Save first JSON
        with open('fillable_fields.json', 'w') as f:
            json.dump(fillable_fields, f, indent=2)

        print("Step 2: Matching biodata with fillable fields...")
        matched_data = self.match_biodata_fields(fillable_fields, biodata)
        print(f"Matched {len(matched_data.get('matched_fields', []))} fields")

        # Save second JSON
        with open('matched_fields.json', 'w') as f:
            json.dump(matched_data, f, indent=2)

        print("Step 3: Simple auto-filling PDF...")
        return self.simple_autofill_with_pil(input_pdf, output_pdf, matched_data)

# Utility function to manually add colon variations to existing JSON
def add_colon_variations_to_json(json_file_path: str = "matched_fields.json"):
    """
    Utility function to add colon variations to an existing matched_fields.json
    """
    if not os.path.exists(json_file_path):
        print(f"❌ JSON file '{json_file_path}' not found!")
        return

    with open(json_file_path, 'r') as f:
        data = json.load(f)

    # Add variations to each matched field
    if 'matched_fields' in data:
        for field in data['matched_fields']:
            pdf_field = field.get('pdf_field', '')

            field['pdf_field_variations'] = [
                pdf_field,  # Original
                pdf_field.rstrip(':'),  # Without colon
                pdf_field.rstrip(':') + ':',  # With colon
                pdf_field.rstrip(':').lower(),  # Lowercase without colon
                pdf_field.rstrip(':').lower() + ':',  # Lowercase with colon
            ]

            # Remove duplicates while preserving order
            field['pdf_field_variations'] = list(dict.fromkeys(field['pdf_field_variations']))

    # Save the updated JSON
    with open(json_file_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"✅ Added colon variations to {json_file_path}")

# Main execution function
def main():
    # Initialize the system
    autofill_system = SimplePDFAutoFillSystem()

    # Sample biodata - replace with your actual data
    biodata = {
        "name": "John Smith",
        "first_name": "John",
        "last_name": "Smith",
        "mobile_no": "+1-234-567-8900",
        "email_id": "john.smith@email.com",
        "date_of_birth": "1985-06-15",
        "address": "123 Main Street, New York, NY 10001",
        "designation": "Software Engineer",
        "company": "Tech Corp",
        "experience": "5 years",
        "age": "38",
        "gender": "Male"
    }

    try:
        # Process the PDF
        input_pdf = "Dummy.pdf"  # Replace with your PDF path
        output_pdf = "simple_filled.pdf"

        result = autofill_system.autofill_pdf(input_pdf, output_pdf, biodata)
        print(f"✅ Auto-fill completed! Output saved to: {result}")

        # JSON files will be created:
        # - fillable_fields.json: Contains all detected fillable fields
        # - matched_fields.json: Contains matched fields with values and variations

    except Exception as e:
        print(f"❌ Error: {e}")

# Alternative function to use existing JSON files
def fill_from_existing_json(input_pdf: str, output_pdf: str, matched_fields_json: str = "matched_fields.json"):
    """
    Use this if you already have the matched_fields.json from previous run
    """

    # Check if JSON file exists
    if not os.path.exists(matched_fields_json):
        print(f"❌ JSON file '{matched_fields_json}' not found!")
        return None

    # Load the matched fields JSON
    with open(matched_fields_json, 'r') as f:
        matched_data = json.load(f)

    # Add colon variations if they don't exist
    if 'matched_fields' in matched_data:
        for field in matched_data['matched_fields']:
            if 'pdf_field_variations' not in field:
                pdf_field = field.get('pdf_field', '')
                field['pdf_field_variations'] = [
                    pdf_field,
                    pdf_field.rstrip(':'),
                    pdf_field.rstrip(':') + ':',
                    pdf_field.rstrip(':').lower(),
                    pdf_field.rstrip(':').lower() + ':'
                ]
                field['pdf_field_variations'] = list(dict.fromkeys(field['pdf_field_variations']))

    # Create system instance and fill
    autofill_system = SimplePDFAutoFillSystem()
    return autofill_system.simple_autofill_with_pil(input_pdf, output_pdf, matched_data)

# Quick debug function to just see OCR text without filling
def debug_ocr_only(input_pdf: str, page_num: int = None):
    """
    Debug function to see what OCR detects on specific page(s)
    """
    pages = convert_from_path(input_pdf, dpi=200)

    if page_num is not None:
        pages = [pages[page_num - 1]]  # Convert to 0-based index
        start_idx = page_num
    else:
        start_idx = 1

    for idx, page in enumerate(pages):
        page_number = start_idx + idx if page_num is None else page_num
        text_data = pytesseract.image_to_data(page, output_type=pytesseract.Output.DICT)

        print(f"\n🔍 OCR Text found on page {page_number}:")
        print("-" * 50)

        for i, word in enumerate(text_data["text"]):
            if word.strip():
                x, y, w, h = (text_data["left"][i], text_data["top"][i],
                            text_data["width"][i], text_data["height"][i])
                print(f"{i:3d}: '{word.strip()}' at ({x}, {y}) size ({w}x{h})")

if __name__ == "__main__":
    # Option 1: Run complete process
    main()

    # Option 2: If you already have JSON files, just fill
    # fill_from_existing_json("input.pdf", "quick_fill.pdf")
