from transformers import pipeline

# Load pretrained model (only once)
classifier = pipeline("image-classification", model="google/vit-base-patch16-224")


def analyze_image(file_path):
    """
    Image classification using pretrained Vision Transformer
    Maps generic labels → crisis categories
    """

    try:
        results = classifier(file_path)

        label = results[0]["label"].lower()
        confidence = float(results[0]["score"])

        print("DEBUG → Image Label:", label)

        # -------------------------------
        # FIRE DETECTION
        # -------------------------------
        fire_keywords = [
            "fire", "flame", "smoke", "burn", "explosion", "volcano"
        ]

        # -------------------------------
        # THREAT DETECTION
        # -------------------------------
        threat_keywords = [
            "gun", "weapon", "rifle", "knife", "pistol", "bomb"
        ]

        # -------------------------------
        # MEDICAL DETECTION (weak heuristic)
        # -------------------------------
        medical_keywords = [
            "person", "human", "patient", "ambulance"
        ]

        # Mapping logic
        if any(word in label for word in fire_keywords):
            return "fire", confidence

        if any(word in label for word in threat_keywords):
            return "threat", confidence

        if any(word in label for word in medical_keywords):
            return "medical", 0.6  # lower confidence

        return None, None

    except Exception as e:
        print("Image model error:", e)
        return None, None