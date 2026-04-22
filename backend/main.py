from fastapi import FastAPI
from backend.routes.report import router as report_router
from backend.routes.cctv import router as cctv_router
from backend.routes.incident import router as incident_router

app = FastAPI(title="Aegis Crisis API")


@app.get("/")
def home():
    return {"message": "Aegis API Running"}


# Include routes
app.include_router(report_router)
app.include_router(cctv_router)
app.include_router(incident_router)