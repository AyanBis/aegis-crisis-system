import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

from preprocess import load_and_preprocess

# Load dataset
df = load_and_preprocess("../../data/raw/crisis_data.csv")

X = df['text']
y = df['label']

# Vectorization
vectorizer = TfidfVectorizer()
X_vec = vectorizer.fit_transform(X)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X_vec, y, test_size=0.2, random_state=42
)

# Model
model = LogisticRegression()
model.fit(X_train, y_train)

# Evaluation
y_pred = model.predict(X_test)
print("\nModel Performance:\n")
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "../../models/crisis_model.pkl")
joblib.dump(vectorizer, "../../models/vectorizer.pkl")

print("\nModel and vectorizer saved successfully.")