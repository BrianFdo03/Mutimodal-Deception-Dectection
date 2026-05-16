from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.src.core.databaseCore import get_db
from backend.src.schemas.sessionSchema import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
)
from backend.src.services.sessionService import (
    create_interview_session,
    get_all_interview_sessions,
    get_interview_session_by_id,
    update_interview_session,
    mark_consent_given,
    delete_interview_session,
    validate_candidate_session_access,
    mark_candidate_consent_given,
)

router = APIRouter(
    prefix="/sessions",
    tags=["Interview Sessions"]
)


def serialize_session(session):
    return {
        "session_id": session.session_id,
        "candidate_id": session.candidate_id,
        "candidate_name": session.candidate.name if session.candidate else None,

        "stage": session.stage,
        "session_date": session.session_date,
        "session_time": session.session_time,
        "meeting_mode": session.meeting_mode,

        "consent_status": session.consent_status,
        "session_status": session.session_status,
        "analysis_status": session.analysis_status,

        "meeting_room_name": session.meeting_room_name,
        "candidate_join_token": session.candidate_join_token,

        "linked_analysis_id": session.linked_analysis_id,

        "notes": session.notes,
        "meeting_notes": session.meeting_notes,

        "consent_given_at": session.consent_given_at,
        "completed_at": session.completed_at,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


def add_candidate_links(data, request: Request, session):
    """
    Adds frontend candidate-facing URLs to the session response.

    These URLs point to the React frontend, not the FastAPI backend.
    """

    frontend_base_url = "http://localhost:5173"

    data["candidate_consent_url"] = (
        f"{frontend_base_url}/candidate-consent/"
        f"{session.session_id}?token={session.candidate_join_token}"
    )

    data["candidate_meeting_url"] = (
        f"{frontend_base_url}/candidate-meeting/"
        f"{session.session_id}?token={session.candidate_join_token}"
    )

    return data


@router.post("/")
def create_session_endpoint(
    session_data: SessionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        session = create_interview_session(db, session_data)

        data = serialize_session(session)
        data = add_candidate_links(data, request, session)

        return {
            "success": True,
            "data": data
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/")
def get_sessions_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    sessions = get_all_interview_sessions(db)

    return {
        "success": True,
        "count": len(sessions),
        "data": [
        add_candidate_links(
            serialize_session(session),
            request,
            session
        )
        for session in sessions
    ]
    }


@router.get("/{session_id}/candidate-access")
def get_candidate_session_access_endpoint(
    session_id: int,
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Candidate-facing endpoint.

    Validates the candidate token and returns safe session details.
    """

    session = validate_candidate_session_access(
        db=db,
        session_id=session_id,
        token=token
    )

    if session is None:
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired candidate session link."
        )

    data = serialize_session(session)
    data = add_candidate_links(data, request, session)

    return {
        "success": True,
        "data": data
    }


@router.patch("/{session_id}/candidate-consent")
def mark_candidate_consent_endpoint(
    session_id: int,
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Candidate-facing endpoint.

    Records candidate consent after validating the candidate token.
    """

    session = mark_candidate_consent_given(
        db=db,
        session_id=session_id,
        token=token
    )

    if session is None:
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired candidate session link."
        )

    data = serialize_session(session)
    data = add_candidate_links(data, request, session)

    return {
        "success": True,
        "message": "Candidate consent recorded successfully.",
        "data": data
    }


@router.get("/{session_id}")
def get_session_endpoint(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    session = get_interview_session_by_id(db, session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    data = serialize_session(session)
    data = add_candidate_links(data, request, session)

    return {
        "success": True,
        "data": data
    }


@router.patch("/{session_id}")
def update_session_endpoint(
    session_id: int,
    session_data: SessionUpdate,
    db: Session = Depends(get_db)
):
    session = update_interview_session(db, session_id, session_data)

    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    return {
        "success": True,
        "data": serialize_session(session)
    }


@router.patch("/{session_id}/consent")
def mark_consent_endpoint(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = mark_consent_given(db, session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    return {
        "success": True,
        "message": "Candidate consent recorded successfully.",
        "data": serialize_session(session)
    }


@router.delete("/{session_id}")
def delete_session_endpoint(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = delete_interview_session(db, session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    return {
        "success": True,
        "message": "Interview session deleted successfully.",
        "data": {
            "session_id": session_id
        }
    }