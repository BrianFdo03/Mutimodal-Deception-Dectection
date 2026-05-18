from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from backend.src.core.databaseCore import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    session_id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(
        Integer,
        ForeignKey("candidates.candidate_id", ondelete="CASCADE"),
        nullable=False,
    )

    stage = Column(String(150), nullable=False)
    session_date = Column(String(50), nullable=False)
    session_time = Column(String(50), nullable=False)
    meeting_mode = Column(String(100), nullable=False, default="Online")

    consent_status = Column(String(100), nullable=False, default="Pending")
    session_status = Column(String(100), nullable=False, default="Scheduled")
    analysis_status = Column(String(100), nullable=False, default="Not Started")

    meeting_room_name = Column(String(255), nullable=True)
    candidate_join_token = Column(String(255), nullable=True)

    linked_analysis_id = Column(
        Integer,
        ForeignKey("video_analyses.id", ondelete="SET NULL"),
        nullable=True,
    )

    notes = Column(Text, nullable=True)
    meeting_notes = Column(Text, nullable=True)

    consent_given_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    candidate = relationship(
        "Candidate",
        back_populates="sessions",
    )

    analyses = relationship(
        "VideoAnalysis",
        back_populates="session",
        foreign_keys="VideoAnalysis.session_id",
        cascade="all, delete-orphan",
    )

    linked_analysis = relationship(
        "VideoAnalysis",
        foreign_keys=[linked_analysis_id],
        post_update=True,
    )