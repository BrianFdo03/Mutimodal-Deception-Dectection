from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from backend.src.core.databaseCore import Base


class VideoAnalysis(Base):
    __tablename__ = "video_analyses"

    id = Column(Integer, primary_key=True, index=True)

    # Later you can connect this to Session table using ForeignKey.
    # For now, keep it nullable so we can test video analysis independently.
    session_id = Column(Integer, nullable=True)

    video_name = Column(String, nullable=False)
    uploaded_file_path = Column(String, nullable=True)

    overall_score = Column(Float, nullable=False)
    overall_risk = Column(String, nullable=False)

    metadata_json = Column(JSON, nullable=True)
    timeline_json = Column(JSON, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())