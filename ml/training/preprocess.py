import pandas as pd
import re

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text

def load_and_preprocess(path):
    df = pd.read_csv(path)
    df['text'] = df['text'].apply(clean_text)
    return df