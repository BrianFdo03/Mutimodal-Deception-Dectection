from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.src.core.databaseCore import get_db
from backend.src.schemas.candidateSchema import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
)
from backend.src.services.candidateService import (
    create_candidate,
    get_all_candidates,
    get_candidate_by_id,
    update_candidate,
    delete_candidate,
)

router = APIRouter(
    prefix="/candidates",
    tags=["Candidates"]
)


@router.post("/", response_model=CandidateResponse)
def create_candidate_endpoint(
    candidate_data: CandidateCreate,
    db: Session = Depends(get_db)
):
    try:
        return create_candidate(db, candidate_data)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/", response_model=list[CandidateResponse])
def get_candidates_endpoint(
    db: Session = Depends(get_db)
):
    return get_all_candidates(db)


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate_endpoint(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    candidate = get_candidate_by_id(db, candidate_id)

    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    return candidate


@router.patch("/{candidate_id}", response_model=CandidateResponse)
def update_candidate_endpoint(
    candidate_id: int,
    candidate_data: CandidateUpdate,
    db: Session = Depends(get_db)
):
    candidate = update_candidate(db, candidate_id, candidate_data)

    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    return candidate


@router.delete("/{candidate_id}")
def delete_candidate_endpoint(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    candidate = delete_candidate(db, candidate_id)

    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    return {
        "success": True,
        "message": "Candidate deleted successfully.",
        "data": {
            "candidate_id": candidate_id
        }
    }