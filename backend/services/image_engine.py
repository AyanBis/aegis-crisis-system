import os

# Toggle image model (IMPORTANT)
USE_IMAGE_MODEL = False

if USE_IMAGE_MODEL:
    from transformers import pipeline
    classifier = pipeline("image-classification", model="google/vit-base-patch16-224")
else:
    classifier = None


def analyze_image(file_path):
    """
    Image classification using pretrained Vision Transformer
    Maps generic labels → crisis categories
    """

    # -------------------------------
    # DISABLED MODE (for debugging)
    # -------------------------------
    if not USE_IMAGE_MODEL:
        return None, 0.0

    try:
        results = classifier(file_path)

        label = results[0]["label"].lower()
        confidence = float(results[0]["score"])

        print("DEBUG → Image Label:", label)

        fire_keywords = ["fire", "flame", "smoke", "burn", "explosion", "volcano"]
        threat_keywords = ["gun", "weapon", "rifle", "knife", "pistol", "bomb"]
        medical_keywords = ["person", "human", "patient", "ambulance"]

        if any(word in label for word in fire_keywords):
            return "fire", confidence

        if any(word in label for word in threat_keywords):
            return "threat", confidence

        if any(word in label for word in medical_keywords):
            return "medical", 0.6

        return None, None

    except Exception as e:
        print("Image model error:", e)
        return None, None