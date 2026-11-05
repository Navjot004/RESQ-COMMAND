from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str
    location: str
    latitude: float
    longitude: float
    priority: str = "MEDIUM"


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None


class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    location: str
    latitude: float
    longitude: float
    priority: str
    status: str
    created_at: datetime