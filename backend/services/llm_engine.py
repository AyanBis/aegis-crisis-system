import os
from dotenv import load_dotenv

# Try importing Gemini (new SDK)
try:
    from google import genai
    GEMINI_AVAILABLE = True
except Exception:
    GEMINI_AVAILABLE = False

# Load environment variables
load_dotenv()

# Initialize Gemini client (optional)
client = None
if GEMINI_AVAILABLE:
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    except Exception as e:
        print("[GEMINI INIT ERROR]:", e)
        client = None


def generate_explanation(crisis_type, location, decision, heart_rate, oxygen, risk):
    """
    Hybrid LLM Engine:
    - Deterministic reasoning layer (always works)
    - Optional Gemini enhancement (non-blocking)
    """

    # -------------------------------
    # ANALYTICAL SEVERITY LOGIC
    # -------------------------------
    if risk == "HIGH":
        severity_note = (
            "Immediate intervention is required due to elevated physiological risk indicators "
            "and potential escalation of the situation."
        )
    else:
        severity_note = (
            "Current indicators suggest relative stability; however, continuous monitoring "
            "is necessary to prevent potential escalation."
        )

    # -------------------------------
    # CORE EXPLANATION (PRIMARY OUTPUT)
    # -------------------------------
    base_text = (
        f"A {crisis_type.upper()} emergency has been identified at {location}. "
        f"This incident is categorized as {decision['priority']} priority based on real-time risk assessment. "
        f"Recommended response actions include: {', '.join(decision['actions'])}. "
        f"Assigned response units: {', '.join(decision['responders'])}. "
        f"Physiological indicators show a heart rate of {heart_rate} bpm and oxygen saturation at {oxygen}%, "
        f"classifying the individual under {risk} risk level. "
        f"{severity_note} Continuous monitoring and coordinated response are currently in progress."
    )

    # -------------------------------
    # GEMINI ENHANCEMENT (OPTIONAL)
    # -------------------------------
    if client:
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=(
                    "Refine this emergency response report to be more professional, structured, "
                    "and slightly more analytical. Do NOT change facts:\n\n"
                    + base_text
                ),
            )

            if response and response.text:
                output = response.text.strip()

                # Validation (critical safety)
                if (
                    len(output) > 120 and
                    output.endswith(".") and
                    "Refine" not in output
                ):
                    return output

        except Exception as e:
            print("[GEMINI ERROR]:", e)

    # -------------------------------
    # FINAL FALLBACK (ALWAYS RETURNS)
    # -------------------------------
    return base_text