import base64
import json
import mimetypes
import os
import re

import requests
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_VISION_MODEL", "gemini-2.0-flash")
GEMINI_API_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)


def _normalize_prediction(value):
    prediction = str(value or "none").strip().lower()
    aliases = {
        "injury": "medical",
        "injured": "medical",
        "wound": "medical",
        "bleeding": "medical",
        "blood": "medical",
        "gun": "threat",
        "firearm": "threat",
        "pistol": "threat",
        "rifle": "threat",
        "shotgun": "threat",
        "knife": "threat",
        "weapon": "threat",
        "violence": "threat",
        "assault": "threat",
        "intruder": "threat",
        "normal": "none",
        "safe": "none",
    }
    prediction = aliases.get(prediction, prediction)

    if prediction in {"fire", "medical", "threat"}:
        return prediction

    return None


def _parse_gemini_response(text):
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?|```$", "", cleaned, flags=re.IGNORECASE).strip()

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        payload = {}

    prediction = _normalize_prediction(payload.get("crisis_type"))
    confidence = payload.get("confidence", 0.0)

    if prediction is None:
        lowered = cleaned.lower()
        medical_words = ["blood", "bleeding", "wound", "injury", "injured", "hurt"]
        fire_words = ["fire", "flame", "smoke", "burning"]
        threat_words = [
            "gun",
            "firearm",
            "pistol",
            "rifle",
            "shotgun",
            "knife",
            "weapon",
            "attack",
            "violence",
            "assault",
            "intruder",
        ]

        if any(word in lowered for word in medical_words):
            prediction = "medical"
            confidence = 0.86
        elif any(word in lowered for word in fire_words):
            prediction = "fire"
            confidence = 0.86
        elif any(word in lowered for word in threat_words):
            prediction = "threat"
            confidence = 0.86

    try:
        confidence = float(confidence)
    except (TypeError, ValueError):
        confidence = 0.75

    return prediction, max(0.0, min(confidence, 0.99))


def _analyze_with_gemini(file_path):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None, 0.0

    mime_type = mimetypes.guess_type(file_path)[0] or "image/jpeg"

    with open(file_path, "rb") as image_file:
        encoded_image = base64.b64encode(image_file.read()).decode("utf-8")

    prompt = (
        "You are an emergency CCTV triage classifier. Inspect the image and classify "
        "the visible crisis as exactly one of: fire, medical, threat, none. "
        "Use medical for visible blood, bleeding, wounds, unconscious people, severe injury, "
        "or urgent first-aid situations. Use threat for guns, pistols, rifles, shotguns, "
        "knives, weapons, intruders, or physical attacks. "
        "Use fire for flames, heavy smoke, or burning. Return only JSON like "
        '{"crisis_type":"medical","confidence":0.91,"reason":"visible bleeding wound"}'
    )

    response = requests.post(
        GEMINI_API_URL,
        params={"key": api_key},
        json={
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": encoded_image,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0,
                "maxOutputTokens": 120,
            },
        },
        timeout=20,
    )
    response.raise_for_status()

    data = response.json()
    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )

    return _parse_gemini_response(text)


def _analyze_red_injury_pixels(file_path):
    try:
        with Image.open(file_path) as image:
            image = image.convert("RGB")
            image.thumbnail((320, 320))
            pixels = list(image.getdata())
    except Exception as error:
        print("[IMAGE FALLBACK ERROR]:", error)
        return None, 0.0

    if not pixels:
        return None, 0.0

    red_pixels = 0
    dark_red_pixels = 0

    for red, green, blue in pixels:
        red_dominant = (
            red > 95
            and red > green * 1.35
            and red > blue * 1.2
            and red - max(green, blue) > 35
        )
        dark_red = red > 65 and green < 95 and blue < 95 and red > green * 1.18

        if red_dominant:
            red_pixels += 1
        if dark_red:
            dark_red_pixels += 1

    total_pixels = len(pixels)
    red_ratio = red_pixels / total_pixels
    dark_red_ratio = dark_red_pixels / total_pixels

    if red_ratio >= 0.025 or dark_red_ratio >= 0.035:
        confidence = min(0.92, 0.68 + max(red_ratio, dark_red_ratio) * 5)
        print(
            "DEBUG -> Blood/injury color heuristic:",
            round(red_ratio, 4),
            round(dark_red_ratio, 4),
        )
        return "medical", confidence

    return None, 0.0


def analyze_image(file_path):
    """
    CCTV crisis detection.

    Primary path: Gemini Vision, which can recognize wounds, blood, weapons, smoke,
    and fire from the complete scene. Fallback: local red/dark-red pixel heuristic
    for visible bleeding injuries when Gemini is unavailable.
    """

    try:
        prediction, confidence = _analyze_with_gemini(file_path)
        if prediction:
            print("DEBUG -> Gemini image prediction:", prediction, confidence)
            return prediction, confidence
    except Exception as error:
        print("[GEMINI VISION ERROR]:", error)

    return _analyze_red_injury_pixels(file_path)
