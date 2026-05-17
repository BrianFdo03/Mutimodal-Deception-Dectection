from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from backend.src.models.candidateModel import Candidate
from backend.src.models.sessionModel import InterviewSession
from backend.src.schemas.sessionSchema import SessionCreate, SessionUpdate


def create_interview_session(db: Session, session_data: SessionCreate):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.candidate_id == session_data.candidate_id)
        .first()
    )

    if candidate is None:
        raise ValueError("Candidate not found.")

    meeting_room_name = f"recruitAI-session-{uuid4().hex[:12]}"
    candidate_join_token = uuid4().hex

    session = InterviewSession(
        candidate_id=session_data.candidate_id,
        stage=session_data.stage,
        session_date=session_data.session_date,
        session_time=session_data.session_time,
        meeting_mode=session_data.meeting_mode or "Online",
        notes=session_data.notes,
        consent_status="Pending",
        session_status="Scheduled",
        analysis_status="Not Started",
        meeting_room_name=meeting_room_name,
        candidate_join_token=candidate_join_token,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def get_all_interview_sessions(db: Session):
    return (
        db.query(InterviewSession)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )


def get_interview_session_by_id(db: Session, session_id: int):
    return (
        db.query(InterviewSession)
        .filter(InterviewSession.session_id == session_id)
        .first()
    )


def update_interview_session(
    db: Session,
    session_id: int,
    session_data: SessionUpdate
):
    session = get_interview_session_by_id(db, session_id)

    if session is None:
        return None

    update_data = session_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(session, field, value)

    if update_data.get("consent_status") == "Given" and not session.consent_given_at:
        session.consent_given_at = datetime.now(timezone.utc)

    if update_data.get("session_status") == "Completed" and not session.completed_at:
        session.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session)

    return session


def mark_consent_given(db: Session, session_id: int):
    session = get_interview_session_by_id(db, session_id)

    if session is None:
        return None

    session.consent_status = "Given"
    session.session_status = "Ready"
    session.consent_given_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session)

    return session


def delete_interview_session(db: Session, session_id: int):
    session = get_interview_session_by_id(db, session_id)

    if session is None:
        return None

    db.delete(session)
    db.commit()

    return session


def validate_candidate_session_access(
    db: Session,
    session_id: int,
    token: str
):
    """
    Validates whether a candidate-facing link is allowed to access
    the requested interview session.
    """

    session = get_interview_session_by_id(
        db=db,
        session_id=session_id
    )

    if session is None:
        return None

    if session.candidate_join_token != token:
        return None

    return session


def mark_candidate_consent_given(
    db: Session,
    session_id: int,
    token: str
):
    """
    Records candidate consent using the candidate-facing token.
    """

    session = validate_candidate_session_access(
        db=db,
        session_id=session_id,
        token=token
    )

    if session is None:
        return None

    session.consent_status = "Given"
    session.session_status = "Ready"
    session.consent_given_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session)

    return session