from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.config import supabase

router = APIRouter()


class ResolveRequest(BaseModel):
    incident_id: str


@router.post("/resolve-incident")
def resolve_incident(request: ResolveRequest):
    # Check if incident exists
    existing = supabase.table("incidents") \
        .select("*") \
        .eq("incident_id", request.incident_id) \
        .execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Update status
    supabase.table("incidents") \
        .update({"status": "RESOLVED"}) \
        .eq("incident_id", request.incident_id) \
        .execute()

    return {
        "incident_id": request.incident_id,
        "status": "RESOLVED",
        "message": "Incident marked as resolved"
    }