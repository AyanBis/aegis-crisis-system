def generate_decision(crisis_type, confidence, location):
    """
    Generates response actions based on crisis type.
    """

    decision = {
        "priority": "LOW",
        "actions": [],
        "responders": []
    }

    # FIRE CASE
    if crisis_type == "fire":
        decision["priority"] = "HIGH"
        decision["actions"] = [
            f"Trigger fire alarm at {location}",
            f"Dispatch fire response team to {location}",
            "Evacuate nearby areas",
            "Disable elevators"
        ]
        decision["responders"] = ["fire_team", "security"]

    # MEDICAL CASE
    elif crisis_type == "medical":
        decision["priority"] = "HIGH"
        decision["actions"] = [
            f"Send medical team to {location}",
            "Call ambulance",
            "Provide immediate first aid"
        ]
        decision["responders"] = ["medical_team"]

    # THREAT CASE
    elif crisis_type == "threat":
        decision["priority"] = "HIGH"
        decision["actions"] = [
            f"Alert security at {location}",
            "Lockdown affected area",
            "Notify authorities"
        ]
        decision["responders"] = ["security"]

    # NORMAL CASE
    else:
        decision["priority"] = "LOW"
        decision["actions"] = [
            "No immediate action required",
            "Continue monitoring"
        ]
        decision["responders"] = []

    # Confidence-based adjustment (important)
    if confidence < 0.6:
        decision["priority"] = "MEDIUM"
        decision["actions"].append("Verify situation before escalation")

    return decision