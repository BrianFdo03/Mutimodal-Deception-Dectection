from datetime import datetime
from pydantic import BaseModel, EmailStr


class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    position: str
    experience_level: str | None = "Entry Level"
    status: str | None = "New"
    notes: str | None = None


class CandidateUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    position: str | None = None
    experience_level: str | None = None
    status: str | None = None
    notes: str | None = None


class CandidateResponse(BaseModel):
    candidate_id: int
    name: str
    email: str
    phone: str | None
    position: str
    experience_level: str | None
    status: str
    notes: str | None
    created_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True