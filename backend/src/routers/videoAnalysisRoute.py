from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from pathlib import Path
from fastapi import Request

from backend.src.core.databaseCore import get_db
from backend.src.services.videoAnalysisService import (
    analyze_uploaded_video,
    get_video_analysis_by_id,
    get_all_video_analyses,
    delete_video_analysis_by_id,
)


router = APIRouter(
    prefix="/video-analysis",
    tags=["Video Analysis"]
)


@router.post("/analyze")
async def analyze_video(
    file: UploadFile = File(...),
    session_id: int | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Uploads a video, runs dynamic video analysis,
    saves result to PostgreSQL, and returns saved analysis.
    """

    try:
        result = analyze_uploaded_video(
            file=file,
            db=db,
            session_id=session_id
        )

        return {
            "success": True,
            "message": "Video analysis completed and saved successfully.",
            "data": result
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Video analysis failed: {str(error)}"
        )
    

@router.get("/history/all")
def get_video_analysis_history(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Retrieves all saved video analysis records.
    """

    analyses = get_all_video_analyses(db=db)

    history = []

    for analysis in analyses:
        video_url = None
        video_file_exists = False

        if analysis.uploaded_file_path:
            video_path = Path(analysis.uploaded_file_path)
            video_file_exists = video_path.exists()

            if video_file_exists:
                filename = video_path.name
                video_url = str(request.base_url) + f"uploads/{filename}"

        timeline = analysis.timeline_json or []
        high_risk_count = len([
            item for item in timeline
            if item.get("risk") == "high"
        ])
        medium_risk_count = len([
            item for item in timeline
            if item.get("risk") == "medium"
        ])

        history.append({
            "analysis_id": analysis.id,
            "session_id": analysis.session_id,
            "video_name": analysis.video_name,
            "uploaded_file_path": analysis.uploaded_file_path,
            "video_url": video_url,
            "video_file_exists": video_file_exists,
            "overall_score": analysis.overall_score,
            "overall_risk": analysis.overall_risk,
            "segment_count": len(timeline),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "created_at": analysis.created_at
        })

    return {
        "success": True,
        "count": len(history),
        "data": history
    }


@router.get("/{analysis_id}")
def get_video_analysis(
    analysis_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Retrieves a previously saved video analysis result.
    """

    analysis = get_video_analysis_by_id(
        db=db,
        analysis_id=analysis_id
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Video analysis result not found."
        )
    
    video_url = None

    if analysis.uploaded_file_path:
        video_path = Path(analysis.uploaded_file_path)

        if video_path.exists():
            filename = video_path.name
            video_url = str(request.base_url) + f"uploads/{filename}"

    return {
        "success": True,
        "data": {
            "analysis_id": analysis.id,
            "session_id": analysis.session_id,
            "video_name": analysis.video_name,
            "uploaded_file_path": analysis.uploaded_file_path,
            "video_url": video_url,
            "overall_score": analysis.overall_score,
            "overall_risk": analysis.overall_risk,
            "metadata": analysis.metadata_json,
            "timeline": analysis.timeline_json,
            "created_at": analysis.created_at
        }
    }


@router.delete("/{analysis_id}")
def delete_video_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletes a saved video analysis result and its uploaded video file.
    """

    analysis, deleted_file_path, file_deleted = delete_video_analysis_by_id(
        db=db,
        analysis_id=analysis_id
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Video analysis result not found."
        )

    return {
        "success": True,
        "message": "Video analysis deleted successfully.",
        "data": {
            "analysis_id": analysis_id,
            "deleted_file_path": deleted_file_path,
            "file_deleted": file_deleted
        }
    }