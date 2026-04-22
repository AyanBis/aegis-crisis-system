from transformers import pipeline

# Initialize improved model
generator = pipeline(
    "text-generation",
    model="gpt2-medium"
)


def generate_explanation(crisis_type, location, decision, heart_rate, oxygen, risk):
    """
    Generates a detailed and professional emergency explanation.
    Uses deterministic base + guarded LLM refinement.
    """

    # -------------------------------
    # Strong deterministic base text
    # -------------------------------
    base_text = (
        f"A {crisis_type.upper()} emergency has been detected at {location}. "
        f"This incident has been classified as {decision['priority']} priority. "
        f"Immediate response actions include: {', '.join(decision['actions'])}. "
        f"Response teams ({', '.join(decision['responders'])}) have been dispatched. "
        f"The affected individual is currently in {risk} condition with a heart rate of {heart_rate} bpm "
        f"and oxygen saturation level of {oxygen}%. "
        f"The situation is under continuous monitoring."
    )

    try:
        prompt = (
            "Improve the clarity and professionalism of this emergency report "
            "without changing its meaning:\n\n"
            f"{base_text}\n\nImproved version:"
        )

        result = generator(
            prompt,
            max_new_tokens=100,
            do_sample=False,
            pad_token_id=50256
        )

        output = result[0]["generated_text"]

        # -------------------------------
        # Extract improved part
        # -------------------------------
        if "Improved version:" in output:
            output = output.split("Improved version:")[-1].strip()

        # Clean line breaks
        if "\n" in output:
            output = output.split("\n")[0].strip()

        # -------------------------------
        # Strong validation (CRITICAL)
        # -------------------------------
        if (
            len(output) < 100 or
            output.endswith(("and", "is", "with", "level", "of")) or
            not output.endswith(".") or
            "Improve" in output or
            ":" in output
        ):
            return base_text

        return output

    except Exception as e:
        print("[LLM ERROR]:", e)
        return base_text