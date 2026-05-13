from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend..core.databaseCore import Base

class Session(Base):
    __tablename__ = "sessions"

    # session_id (primary key)
    session_id = Column(Integer, primary_key=True, index=True, nullable=False)
    
    # foreign keys
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"), nullable=False)
    interviewer_id = Column(Integer, ForeignKey("interviewers.interviewer_id"), nullable=False)
    interview_sprint_id = Column(Integer, ForeignKey("interview_sprints.interview_sprint_id"), nullable=False)
    stage_id = Column(Integer, ForeignKey("stages.stage_id"), nullable=False)
    
    # link (not null)
    link = Column(String, nullable=False)
    
    # interview_password (not null, unique)
    interview_password = Column(String, unique=True, nullable=False)
    
    # meeting_date (not null)
    meeting_date = Column(DateTime, nullable=False)
    
    # interview_video (stores the file path/URL to the video)
    interview_video = Column(String, nullable=True)
    
    # duration (stored in minutes or seconds)
    duration = Column(Float, nullable=True)
    
    # status (not null) - e.g., "Scheduled", "Completed", "Processing"
    status = Column(String, nullable=False, default="Scheduled")

    # Relationships for easy data access
    candidate = relationship("Candidate", back_populates="sessions")
    interviewer = relationship("Interviewer", back_populates="sessions")
    sprint = relationship("InterviewSprint", back_populates="sessions")
    stage = relationship("InterviewStage", back_populates="sessions")