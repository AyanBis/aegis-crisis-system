# Aegis Crisis System

AI-powered multimodal crisis detection and response platform with Digital Twin visualization.

---

## Overview

Aegis Crisis System is an intelligent emergency response platform that detects and analyzes crisis situations in real-time using multiple input sources such as:

- Text reports  
- Audio inputs  
- Images  
- CCTV feeds  

The system uses Machine Learning, decision engines, and AI reasoning to:
- Identify the type of crisis
- Assess risk levels
- Recommend immediate actions
- Visualize human condition using a Digital Twin dashboard

---

## Key Features

### Multimodal Detection
- Text classification (ML model)
- Audio to speech processing and analysis
- Image-based crisis detection
- Real-time CCTV frame processing

### Intelligent Decision Engine
- Priority classification (LOW / MEDIUM / HIGH)
- Automated response generation
- Responder assignment (fire, medical, security)

### Digital Twin System
- Heart rate simulation
- Oxygen level estimation
- Risk assessment (LOW / HIGH)
- Real-time visualization on dashboard

### Dashboard (Frontend)
- Live incident monitoring
- Incident cards with priority and status
- Detailed modal with Digital Twin and AI explanation
- Resolve incident functionality

---

## Tech Stack

### Backend
- FastAPI
- Python
- Scikit-learn
- Transformers (for explanation generation)

### Frontend
- Next.js / React
- Tailwind CSS
- Framer Motion

### Database
- Supabase

---

## System Architecture

'''
Input (Text / Audio / Image / CCTV)
        ↓
AI/ML Models (Classification and Analysis)
        ↓
Decision Engine
        ↓
Digital Twin Simulation
        ↓
Database (Supabase)
        ↓
Dashboard UI (Real-time Monitoring)
'''

---

## How to Run

### Backend

cd backend  
uvicorn main:app --reload  

### Frontend

cd frontend  
npm install  
npm run dev  

---

## API Endpoints

- POST /report → Report incident (text, audio, or image)
- POST /cctv-frame → CCTV-based detection
- GET /incidents → Retrieve all incidents
- GET /incident/{id} → Get details of a specific incident
- POST /resolve-incident → Mark an incident as resolved

---

## Example Use Cases

- Fire detection in buildings
- Medical emergencies in public spaces
- Threat detection in crowded environments
- Smart surveillance systems

---

## Future Improvements

- Real-time WebSocket-based updates
- Map-based incident tracking
- Predictive risk analysis
- IoT sensor integration
- Advanced biometric Digital Twin models

---