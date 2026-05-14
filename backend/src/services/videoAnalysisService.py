from pathlib import Path
import shutil
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from backend.ml.video.predict_timeline import predict_video_timeline
from backend.src.models.videoAnalysisModel import VideoAnalysis


BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def save_uploaded_video(file: UploadFile) -> Path:
    """
    Saves uploaded video to backend/uploads/ and returns the saved path.
    """

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in [".mp4", ".mov", ".avi", ".mkv"]:
        raise ValueError(
            "Unsupported video format. Please upload MP4, MOV, AVI, or MKV."
        )

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    saved_path = UPLOAD_DIR / unique_filename

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return saved_path


def save_video_analysis_result(
    db: Session,
    result: dict,
    uploaded_file_path: Path,
    session_id: int | None = None
) -> VideoAnalysis:
    """
    Saves video analysis result to PostgreSQL.
    """

    analysis = VideoAnalysis(
        session_id=session_id,
        video_name=result["video_name"],
        uploaded_file_path=str(uploaded_file_path),
        overall_score=float(result["overall_score"]),
        overall_risk=result["overall_risk"],
        metadata_json=result.get("metadata"),
        timeline_json=result.get("timeline")
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis


def analyze_uploaded_video(
    file: UploadFile,
    db: Session,
    session_id: int | None = None
):
    """
    Saves uploaded video, runs video timeline inference,
    saves result to DB, and returns response.
    """

    saved_video_path = save_uploaded_video(file)

    result = predict_video_timeline(saved_video_path)

    saved_analysis = save_video_analysis_result(
        db=db,
        result=result,
        uploaded_file_path=saved_video_path,
        session_id=session_id
    )

    return {
        "analysis_id": saved_analysis.id,
        "session_id": saved_analysis.session_id,
        "video_name": saved_analysis.video_name,
        "overall_score": saved_analysis.overall_score,
        "overall_risk": saved_analysis.overall_risk,
        "metadata": saved_analysis.metadata_json,
        "timeline": saved_analysis.timeline_json,
        "created_at": saved_analysis.created_at
    }


def get_video_analysis_by_id(db: Session, analysis_id: int):
    """
    Gets saved video analysis result by ID.
    """

    return db.query(VideoAnalysis).filter(VideoAnalysis.id == analysis_id).first()


def get_all_video_analyses(db: Session):
    """
    Gets all saved video analysis records, newest first.
    """

    return (
        db.query(VideoAnalysis)
        .order_by(VideoAnalysis.created_at.desc())
        .all()
    )