from sqlalchemy.orm import Session

from backend.src.models.candidateModel import Candidate
from backend.src.schemas.candidateSchema import CandidateCreate, CandidateUpdate


def create_candidate(db: Session, candidate_data: CandidateCreate):
    existing_candidate = (
        db.query(Candidate)
        .filter(Candidate.email == candidate_data.email)
        .first()
    )

    if existing_candidate:
        raise ValueError("A candidate with this email already exists.")

    candidate = Candidate(
        name=candidate_data.name,
        email=candidate_data.email,
        phone=candidate_data.phone,
        position=candidate_data.position,
        experience_level=candidate_data.experience_level,
        status=candidate_data.status or "New",
        notes=candidate_data.notes,
    )

    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    return candidate


def get_all_candidates(db: Session):
    return (
        db.query(Candidate)
        .order_by(Candidate.created_at.desc())
        .all()
    )


def get_candidate_by_id(db: Session, candidate_id: int):
    return (
        db.query(Candidate)
        .filter(Candidate.candidate_id == candidate_id)
        .first()
    )


def update_candidate(
    db: Session,
    candidate_id: int,
    candidate_data: CandidateUpdate
):
    candidate = get_candidate_by_id(db, candidate_id)

    if candidate is None:
        return None

    update_data = candidate_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(candidate, field, value)

    db.commit()
    db.refresh(candidate)

    return candidate


def delete_candidate(db: Session, candidate_id: int):
    candidate = get_candidate_by_id(db, candidate_id)

    if candidate is None:
        return None

    db.delete(candidate)
    db.commit()

    return candidate