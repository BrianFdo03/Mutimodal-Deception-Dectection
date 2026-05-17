from pathlib import Path
import shutil
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from backend.ml.video.predict_timeline import predict_video_timeline
from backend.ml.audio.predict_timeline import predict_audio_timeline
from backend.ml.fusion.fuse_timelines import fuse_video_audio_timelines

from backend.src.models.videoAnalysisModel import VideoAnalysis


BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def save_uploaded_video(file: UploadFile) -> Path:
    """
    Saves uploaded video to backend/uploads/ and returns the saved path.
    """

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in [".mp4", ".mov", ".avi", ".mkv", ".webm", ".wmv"]:
        raise ValueError(
            "Unsupported video format. Please upload MP4, MOV, AVI, MKV, WEBM, or WMV."
        )

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    saved_path = UPLOAD_DIR / unique_filename

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return saved_path


# def save_video_analysis_result(
#     db: Session,
#     result: dict,
#     uploaded_file_path: Path,
#     session_id: int | None = None
# ) -> VideoAnalysis:
#     """
#     Saves video analysis result to PostgreSQL.
#     """

#     analysis = VideoAnalysis(
#         session_id=session_id,
#         video_name=result["video_name"],
#         uploaded_file_path=str(uploaded_file_path),
#         overall_score=float(result["overall_score"]),
#         overall_risk=result["overall_risk"],
#         metadata_json=result.get("metadata"),
#         timeline_json=result.get("timeline")
#     )

#     db.add(analysis)
#     db.commit()
#     db.refresh(analysis)

#     return analysis

def safe_float(value):
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def save_video_analysis_result(
    db: Session,
    result: dict,
    uploaded_file_path,
    session_id: int | None = None
):
    """
    Saves multimodal video/audio/fusion analysis result to database.
    """

    video_result = result["video"]
    audio_result = result["audio"]
    fusion_result = result["fusion"]

    analysis = VideoAnalysis(
        session_id=session_id,

        # Keep original naming for compatibility
        video_name=video_result.get("video_name"),
        uploaded_file_path=str(uploaded_file_path),

        analysis_type="multimodal",

        # Main/backward-compatible result = fusion result
        overall_score=safe_float(fusion_result.get("overall_score")),
        overall_risk=fusion_result.get("overall_risk"),
        metadata_json=fusion_result.get("metadata"),
        timeline_json=fusion_result.get("timeline"),

        # Video-specific result
        video_overall_score=safe_float(video_result.get("overall_score")),
        video_overall_risk=video_result.get("overall_risk"),
        video_metadata_json=video_result.get("metadata"),
        video_timeline_json=video_result.get("timeline"),

        # Audio-specific result
        audio_overall_score=safe_float(audio_result.get("overall_score")),
        audio_overall_risk=audio_result.get("overall_risk"),
        audio_metadata_json=audio_result.get("metadata"),
        audio_timeline_json=audio_result.get("timeline"),

        # Fusion-specific result
        fusion_overall_score=safe_float(fusion_result.get("overall_score")),
        fusion_overall_display_score=safe_float(
            fusion_result.get("overall_display_score")
        ),
        fusion_overall_risk=fusion_result.get("overall_risk"),
        fusion_metadata_json=fusion_result.get("metadata"),
        fusion_timeline_json=fusion_result.get("timeline"),

        # Full result package
        analysis_result_json=result,
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis


# def analyze_uploaded_video(
#     file: UploadFile,
#     db: Session,
#     session_id: int | None = None
# ):
#     """
#     Saves uploaded video, runs video timeline inference,
#     saves result to DB, and returns response.
#     """

#     saved_video_path = save_uploaded_video(file)

#     result = predict_video_timeline(saved_video_path)

#     saved_analysis = save_video_analysis_result(
#         db=db,
#         result=result,
#         uploaded_file_path=saved_video_path,
#         session_id=session_id
#     )

#     return {
#         "analysis_id": saved_analysis.id,
#         "session_id": saved_analysis.session_id,
#         "video_name": saved_analysis.video_name,
#         "overall_score": saved_analysis.overall_score,
#         "overall_risk": saved_analysis.overall_risk,
#         "metadata": saved_analysis.metadata_json,
#         "timeline": saved_analysis.timeline_json,
#         "created_at": saved_analysis.created_at
#     }

def analyze_uploaded_video(
    file: UploadFile,
    db: Session,
    session_id: int | None = None
):
    """
    Saves uploaded video, runs video + audio + fusion timeline inference,
    saves multimodal result to DB, and returns response.
    """

    # 1. Save uploaded video file
    saved_video_path = save_uploaded_video(file)

    # 2. Run video model
    video_result = predict_video_timeline(saved_video_path)

    # 3. Run audio model
    audio_result = predict_audio_timeline(saved_video_path)

    # 4. Run multimodal fusion
    fusion_result = fuse_video_audio_timelines(
        video_result=video_result,
        audio_result=audio_result,
        video_weight=0.6,
        audio_weight=0.4
    )

    # 5. Store full multimodal result
    result = {
        "video": video_result,
        "audio": audio_result,
        "fusion": fusion_result,
    }

    # 6. Save result to database
    saved_analysis = save_video_analysis_result(
        db=db,
        result=result,
        uploaded_file_path=saved_video_path,
        session_id=session_id
    )

    # 7. Return frontend-friendly response
    return {
        "analysis_id": saved_analysis.id,
        "session_id": saved_analysis.session_id,
        "video_name": saved_analysis.video_name,

        "analysis_type": saved_analysis.analysis_type,

        # Main result = fusion result
        "overall_score": saved_analysis.overall_score,
        "overall_risk": saved_analysis.overall_risk,
        "metadata": saved_analysis.metadata_json,
        "timeline": saved_analysis.timeline_json,

        # Modality-specific results
        "video": {
            "overall_score": saved_analysis.video_overall_score,
            "overall_risk": saved_analysis.video_overall_risk,
            "metadata": saved_analysis.video_metadata_json,
            "timeline": saved_analysis.video_timeline_json,
        },

        "audio": {
            "overall_score": saved_analysis.audio_overall_score,
            "overall_risk": saved_analysis.audio_overall_risk,
            "metadata": saved_analysis.audio_metadata_json,
            "timeline": saved_analysis.audio_timeline_json,
        },

        "fusion": {
            "overall_score": saved_analysis.fusion_overall_score,
            "overall_display_score": saved_analysis.fusion_overall_display_score,
            "overall_risk": saved_analysis.fusion_overall_risk,
            "metadata": saved_analysis.fusion_metadata_json,
            "timeline": saved_analysis.fusion_timeline_json,
        },

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