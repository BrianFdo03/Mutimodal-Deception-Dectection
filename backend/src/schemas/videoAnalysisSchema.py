from datetime import datetime
from typing import Any
from pydantic import BaseModel


class VideoAnalysisResponse(BaseModel):
    id: int

    original_filename: str | None = None
    stored_filename: str | None = None
    uploaded_file_path: str | None = None

    analysis_type: str | None = None

    # Existing/old fields
    session_id: int | None = None
    video_name: str | None = None

    # Main/backward-compatible result
    overall_score: float | None = None
    overall_risk: str | None = None
    metadata_json: Any | None = None
    timeline_json: Any | None = None

    # Video result
    video_overall_score: float | None = None
    video_overall_risk: str | None = None
    video_timeline_json: Any | None = None
    video_metadata_json: Any | None = None

    # Audio result
    audio_overall_score: float | None = None
    audio_overall_risk: str | None = None
    audio_timeline_json: Any | None = None
    audio_metadata_json: Any | None = None

    # Fusion result
    fusion_overall_score: float | None = None
    fusion_overall_display_score: float | None = None
    fusion_overall_risk: str | None = None
    fusion_timeline_json: Any | None = None
    fusion_metadata_json: Any | None = None

    analysis_result_json: Any | None = None

    created_at: datetime | None = None

    class Config:
        from_attributes = True