from fastapi import APIRouter, UploadFile, File, HTTPException

from backend.src.services.videoAnalysisService import analyze_uploaded_video


router = APIRouter(
    prefix="/video-analysis",
    tags=["Video Analysis"]
)


@router.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    """
    Uploads a video and returns dynamic deception/inconsistency timeline.
    """

    try:
        result = analyze_uploaded_video(file)

        return {
            "success": True,
            "message": "Video analysis completed successfully.",
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