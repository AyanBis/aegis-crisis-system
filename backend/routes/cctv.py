from fastapi import APIRouter, UploadFile, File
import shutil
import os
import random
import uuid
from datetime import datetime, timedelta

from backend.services.image_engine import analyze_image
from backend.services.decision_engine import generate_decision
from backend.services.llm_engine import generate_explanation
from utils.config import supabase

router = APIRouter()


@router.post("/cctv-frame")
def process_cctv_frame(frame: UploadFile = File(...)):

    file_path = f"temp_{frame.filename}"

    # Save frame
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(frame.file, buffer)

    # Image analysis
    prediction, confidence = analyze_image(file_path)

    os.remove(file_path)

    if prediction is None:
        return {"status": "no threat detected"}

    # Decision Engine
    decision = generate_decision(prediction, confidence, "CCTV Zone")

    print("DEBUG → CCTV Prediction:", prediction)
    print("DEBUG → CCTV Decision:", decision)

    # -------------------------------
    # Digital Twin (basic simulation)
    # -------------------------------
    if prediction == "fire":
        heart_rate = random.randint(100, 140)
        oxygen = random.randint(80, 92)
    elif prediction == "medical":
        heart_rate = random.randint(60, 120)
        oxygen = random.randint(85, 98)
    elif prediction == "threat":
        heart_rate = random.randint(110, 150)
        oxygen = random.randint(90, 100)
    else:
        heart_rate = random.randint(70, 90)
        oxygen = random.randint(95, 100)

    risk = "HIGH" if oxygen < 90 or heart_rate > 120 else "LOW"

    # -------------------------------
    # DEDUPLICATION LOGIC
    # -------------------------------
    recent_time = (datetime.utcnow() - timedelta(seconds=30)).isoformat()

    existing = supabase.table("incidents") \
        .select("*") \
        .eq("type", prediction) \
        .eq("location", "CCTV Zone") \
        .eq("status", "ACTIVE") \
        .gte("timestamp", recent_time) \
        .execute()

    if existing.data:
        # Use existing incident
        incident = existing.data[0]
        incident_id = incident["incident_id"]
        timestamp = incident["timestamp"]
        status = incident["status"]

        print("DEBUG → Using existing incident:", incident_id)

    else:
        # Create new incident
        incident_id = str(uuid.uuid4())

        response = supabase.table("incidents").insert({
            "incident_id": incident_id,
            "type": prediction,
            "confidence": confidence,
            "location": "CCTV Zone",
            "priority": decision["priority"]
        }).execute()

        timestamp = response.data[0]["timestamp"]
        status = response.data[0]["status"]

        print("DEBUG → New incident created:", incident_id)

    # -------------------------------
    # LLM Explanation
    # -------------------------------
    explanation = generate_explanation(
        prediction,
        "CCTV Zone",
        decision,
        heart_rate,
        oxygen,
        risk
    )

    # -------------------------------
    # Final Response
    # -------------------------------
    return {
        "incident_id": incident_id,
        "timestamp": timestamp,
        "status": status,
        "crisis_type": prediction,
        "confidence": confidence,
        "decision": decision,
        "digital_twin": {
            "heart_rate": heart_rate,
            "oxygen_level": oxygen,
            "risk_level": risk
        },
        "llm_explanation": explanation
    }