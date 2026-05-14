from datetime import datetime
from pydantic import BaseModel


class SessionCreate(BaseModel):
    candidate_id: int
    stage: str
    session_date: str
    session_time: str
    meeting_mode: str | None = "Online"
    notes: str | None = None


class SessionUpdate(BaseModel):
    stage: str | None = None
    session_date: str | None = None
    session_time: str | None = None
    meeting_mode: str | None = None

    consent_status: str | None = None
    session_status: str | None = None
    analysis_status: str | None = None

    linked_analysis_id: int | None = None

    notes: str | None = None
    meeting_notes: str | None = None


class SessionResponse(BaseModel):
    session_id: int
    candidate_id: int
    candidate_name: str | None = None

    stage: str
    session_date: str
    session_time: str
    meeting_mode: str

    consent_status: str
    session_status: str
    analysis_status: str

    meeting_room_name: str | None
    candidate_join_token: str | None

    linked_analysis_id: int | None

    notes: str | None
    meeting_notes: str | None

    consent_given_at: datetime | None
    completed_at: datetime | None
    created_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True