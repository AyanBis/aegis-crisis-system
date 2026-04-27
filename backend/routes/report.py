from fastapi import APIRouter, UploadFile, File, Form
import joblib
import os
import random
import shutil
import uuid
import tempfile

from backend.services.decision_engine import generate_decision
from backend.services.llm_engine import generate_explanation
from backend.services.voice_engine import transcribe_audio
from backend.services.image_engine import analyze_image
from utils.config import supabase

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "crisis_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "models", "vectorizer.pkl")

model = None
vectorizer = None


def get_text_model():
    global model, vectorizer

    if model is None or vectorizer is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
            raise RuntimeError(
                "Text model files are missing. Add models/crisis_model.pkl and "
                "models/vectorizer.pkl to the deployment."
            )

        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)

    return model, vectorizer


# -------------------------------
# STRONG RULE ENGINE
# -------------------------------
def rule_based_classification(text):
    text = text.lower()

    medical_keywords = [
        "faint", "fainted", "unconscious", "collapse", "collapsed",
        "not breathing", "passed out", "not responding",
        "man down", "person down", "someone down",
        "injured", "bleeding", "needs help", "emergency help"
    ]

    fire_keywords = [
        "fire", "smoke", "burning", "flames", "on fire"
    ]

    threat_keywords = [
        "gun", "weapon", "attack", "threat", "fight", "shooting"
    ]

    for phrase in medical_keywords:
        if phrase in text:
            return "medical", 0.95

    for phrase in fire_keywords:
        if phrase in text:
            return "fire", 0.95

    for phrase in threat_keywords:
        if phrase in text:
            return "threat", 0.95

    return None, None


@router.post("/report")
def report_incident(
    text: str = Form(None),
    location: str = Form(None),
    audio: UploadFile = File(None),
    image: UploadFile = File(None)
):

    try:
        text_input = text
        location_input = location if location else "Unknown"

        # -------------------------------
        # AUDIO INPUT
        # -------------------------------
        if audio:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                shutil.copyfileobj(audio.file, tmp)
                tmp_path = tmp.name

            text_input = transcribe_audio(tmp_path)
            os.remove(tmp_path)

            print("DEBUG → Transcribed text:", text_input)

        # -------------------------------
        # FALLBACK
        # -------------------------------
        if text_input is None:
            text_input = "unknown situation"

        # -------------------------------
        # RULE FIRST
        # -------------------------------
        rule_pred, rule_conf = rule_based_classification(text_input)

        if rule_pred:
            prediction = rule_pred
            confidence = rule_conf
            print("DEBUG → Rule override:", prediction)

        else:
            # -------------------------------
            # ML MODEL
            # -------------------------------
            model, vectorizer = get_text_model()
            text_vec = vectorizer.transform([text_input])
            prediction = model.predict(text_vec)[0]
            confidence = float(max(model.predict_proba(text_vec)[0]))

            print("DEBUG → ML prediction:", prediction, confidence)

            # -------------------------------
            # LOW CONFIDENCE SAFETY
            # -------------------------------
            if confidence < 0.6:
                print("DEBUG → Low confidence fallback triggered")
                prediction = "unknown"

            # -------------------------------
            # SEMANTIC FALLBACK (KEY FIX)
            # -------------------------------
            if prediction == "fire" and confidence < 0.7:
                text_lower = text_input.lower()

                if any(word in text_lower for word in [
                    "down", "help", "emergency", "problem", "hurt"
                ]):
                    print("DEBUG → Semantic override to medical")
                    prediction = "medical"
                    confidence = 0.7

        # -------------------------------
        # IMAGE OVERRIDE
        # -------------------------------
        if image:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                shutil.copyfileobj(image.file, tmp)
                tmp_path = tmp.name

            img_pred, img_conf = analyze_image(tmp_path)
            os.remove(tmp_path)

            if img_pred and img_conf > confidence:
                prediction = img_pred
                confidence = img_conf
                print("DEBUG → Image override:", prediction)

        # -------------------------------
        # DECISION ENGINE
        # -------------------------------
        decision = generate_decision(prediction, confidence, location_input)

        print("DEBUG → Final:", prediction, location_input)

        # -------------------------------
        # INCIDENT TRACKING
        # -------------------------------
        incident_id = str(uuid.uuid4())

        response = supabase.table("incidents").insert({
            "incident_id": incident_id,
            "type": prediction,
            "confidence": confidence,
            "location": location_input,
            "priority": decision["priority"]
        }).execute()

        timestamp = response.data[0]["timestamp"]
        status = response.data[0]["status"]

        # -------------------------------
        # DIGITAL TWIN
        # -------------------------------
        heart_rate = random.randint(80, 130)
        oxygen = random.randint(80, 100)
        risk = "HIGH" if oxygen < 90 or heart_rate > 120 else "LOW"

        supabase.table("digital_twins").insert({
            "user_id": location_input,
            "heart_rate": heart_rate,
            "oxygen_level": oxygen,
            "risk_level": risk
        }).execute()

        # -------------------------------
        # LLM EXPLANATION
        # -------------------------------
        explanation = generate_explanation(
            prediction,
            location_input,
            decision,
            heart_rate,
            oxygen,
            risk
        )

        return {
            "incident_id": incident_id,
            "timestamp": timestamp,
            "status": status,
            "crisis_type": prediction,
            "confidence": confidence,
            "location": location_input,
            "decision": decision,
            "digital_twin": {
                "heart_rate": heart_rate,
                "oxygen_level": oxygen,
                "risk_level": risk
            },
            "llm_explanation": explanation
        }

    except Exception as e:
        return {"error": str(e)}
