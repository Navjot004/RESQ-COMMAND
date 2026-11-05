from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status

from app.core.mongodb import database
from app.schemas.incident import IncidentCreate, IncidentUpdate

router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"]
)


def serialize_incident(incident):
    return {
        "id": str(incident["_id"]),
        "title": incident["title"],
        "description": incident["description"],
        "location": incident["location"],
        "latitude": incident["latitude"],
        "longitude": incident["longitude"],
        "priority": incident["priority"],
        "status": incident["status"],
        "created_at": incident["created_at"],
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_incident(payload: IncidentCreate):
    if payload.priority not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        raise HTTPException(400, "Invalid priority")

    incident = payload.model_dump()

    incident["status"] = "ACTIVE"
    incident["created_at"] = datetime.now(timezone.utc)

    result = await database.incidents.insert_one(incident)

    incident["_id"] = result.inserted_id

    return {
        "message": "Incident created successfully",
        "incident": serialize_incident(incident)
    }


@router.get("/")
async def get_incidents():
    incidents = []

    cursor = database.incidents.find().sort("created_at", -1)

    async for incident in cursor:
        incidents.append(serialize_incident(incident))

    return incidents


@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    if not ObjectId.is_valid(incident_id):
        raise HTTPException(400, "Invalid incident ID")

    incident = await database.incidents.find_one({
        "_id": ObjectId(incident_id)
    })

    if not incident:
        raise HTTPException(404, "Incident not found")

    return serialize_incident(incident)


@router.patch("/{incident_id}")
async def update_incident(
    incident_id: str,
    payload: IncidentUpdate
):
    if not ObjectId.is_valid(incident_id):
        raise HTTPException(400, "Invalid incident ID")

    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(400, "No update data provided")

    if "priority" in updates and updates["priority"] not in [
        "LOW", "MEDIUM", "HIGH", "CRITICAL"
    ]:
        raise HTTPException(400, "Invalid priority")

    if "status" in updates:
      updates["status"] = updates["status"].upper()

    if updates["status"] not in [
        "ACTIVE", "CONTAINED", "RESOLVED"
    ]:
        raise HTTPException(400, "Invalid status")

    result = await database.incidents.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": updates}
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Incident not found")

    incident = await database.incidents.find_one({
        "_id": ObjectId(incident_id)
    })

    return {
        "message": "Incident updated successfully",
        "incident": serialize_incident(incident)
    }


@router.delete("/{incident_id}")
async def delete_incident(incident_id: str):
    if not ObjectId.is_valid(incident_id):
        raise HTTPException(400, "Invalid incident ID")

    result = await database.incidents.delete_one({
        "_id": ObjectId(incident_id)
    })

    if result.deleted_count == 0:
        raise HTTPException(404, "Incident not found")

    return {"message": "Incident deleted successfully"}