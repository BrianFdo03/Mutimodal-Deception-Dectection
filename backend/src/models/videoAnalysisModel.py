from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from backend.src.core.databaseCore import Base


class VideoAnalysis(Base):
    __tablename__ = "video_analyses"

    id = Column(Integer, primary_key=True, index=True)

    original_filename = Column(String(255), nullable=True)
    stored_filename = Column(String(255), nullable=True)
    uploaded_file_path = Column(String(500), nullable=True)

    analysis_type = Column(String(50), nullable=False, default="multimodal")

    # Backward-compatible/main displayed result

    # # Later you can connect this to Session table using ForeignKey.
    # # For now, keep it nullable so we can test video analysis independently.
    session_id = Column(
        Integer,
        ForeignKey("interview_sessions.session_id", ondelete="SET NULL"),
        nullable=True,
    )
    video_name = Column(String, nullable=False)
    overall_score = Column(Float, nullable=True)
    overall_risk = Column(String(50), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    timeline_json = Column(JSONB, nullable=True)

    # Video-specific result
    video_overall_score = Column(Float, nullable=True)
    video_overall_risk = Column(String(50), nullable=True)
    video_timeline_json = Column(JSONB, nullable=True)
    video_metadata_json = Column(JSONB, nullable=True)

    # Audio-specific result
    audio_overall_score = Column(Float, nullable=True)
    audio_overall_risk = Column(String(50), nullable=True)
    audio_timeline_json = Column(JSONB, nullable=True)
    audio_metadata_json = Column(JSONB, nullable=True)

    # Fusion-specific result
    fusion_overall_score = Column(Float, nullable=True)
    fusion_overall_display_score = Column(Float, nullable=True)
    fusion_overall_risk = Column(String(50), nullable=True)
    fusion_timeline_json = Column(JSONB, nullable=True)
    fusion_metadata_json = Column(JSONB, nullable=True)

    # Full package
    analysis_result_json = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship(
        "InterviewSession",
        back_populates="analyses",
        foreign_keys=[session_id],
    )