import random
import pandas as pd

# Base templates for each class
fire_templates = [
    "fire in room {}",
    "smoke coming from {}",
    "fire alarm ringing in {}",
    "burning smell in {}",
    "flames seen near {}",
    "kitchen fire at {}",
    "help there is smoke in {}",
    "fire spreading in {}"
]

medical_templates = [
    "person fainted in {}",
    "someone unconscious in {}",
    "medical emergency at {}",
    "guest having chest pain in {}",
    "person not breathing in {}",
    "need ambulance in {}",
    "someone collapsed near {}"
]

threat_templates = [
    "man with weapon in {}",
    "suspicious person near {}",
    "possible gunshot at {}",
    "intruder detected in {}",
    "person acting aggressively in {}",
    "fight happening at {}"
]

normal_templates = [
    "everything is normal in {}",
    "no issues in {}",
    "just checking in at {}",
    "all good in {}",
    "routine check at {}",
    "nothing unusual in {}"
]

locations = [
    "room 101", "room 202", "room 303",
    "lobby", "corridor", "kitchen",
    "entrance", "parking area", "elevator",
    "floor 1", "floor 2", "floor 3"
]

def generate_samples(templates, label, count):
    data = []
    for _ in range(count):
        sentence = random.choice(templates).format(random.choice(locations))

        # Add noise variations
        if random.random() > 0.7:
            sentence = sentence.upper()
        if random.random() > 0.7:
            sentence = sentence + "!!!"
        if random.random() > 0.7:
            sentence = sentence.replace(" ", "")

        data.append([sentence, label])
    return data


# Generate data
data = []
data += generate_samples(fire_templates, "fire", 250)
data += generate_samples(medical_templates, "medical", 250)
data += generate_samples(threat_templates, "threat", 250)
data += generate_samples(normal_templates, "normal", 250)

# Create DataFrame
df = pd.DataFrame(data, columns=["text", "label"])

# Shuffle dataset
df = df.sample(frac=1).reset_index(drop=True)

# Save
df.to_csv("../../data/raw/crisis_data.csv", index=False)

print("Dataset generated with", len(df), "samples")