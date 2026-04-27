from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 1. Import the middleware
from backend.routes.report import router as report_router
from backend.routes.cctv import router as cctv_router
from backend.routes.incident import router as incident_router
from utils.config import get_supabase_config_status

app = FastAPI(title="Aegis Crisis API")

# 2. Add the CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vocal-gecko-cfe1a9.netlify.app"],  # Allows requests from any origin (perfect for local dev)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def home():
    return {"message": "Aegis API Running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "supabase": get_supabase_config_status(),
    }

# Include routes
app.include_router(report_router)
app.include_router(cctv_router)
app.include_router(incident_router)
