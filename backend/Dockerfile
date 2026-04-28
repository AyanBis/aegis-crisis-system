# Use an official lightweight Python image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# IMPORTANT: Install ffmpeg so Whisper AI can process audio
RUN apt-get update && apt-get install -y ffmpeg

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

# Google Cloud Run provides a PORT environment variable, we must use it
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]