from sqlalchemy import Column, Integer, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.src.core.databaseCore import Base

class InterviewStage(Base):
    __tablename__ = "stages"

    # stage_id (primary key)
    stage_id = Column(Integer, primary_key=True, index=True, nullable=False)
    
    # interview_sprint_id (foreign key)
    # This links the stage to its parent Sprint
    interview_sprint_id = Column(Integer, ForeignKey("interview_sprints.interview_sprint_id"), nullable=False)
    
    # stage_start
    stage_start = Column(Date, nullable=False)
    
    # stage_end
    stage_end = Column(Date, nullable=False)

    # Relationships
    # Link back to the parent Sprint
    sprint = relationship("InterviewSprint", back_populates="stages")
    
    # Link forward to the Sessions in this stage
    sessions = relationship("Session", back_populates="stage", cascade="all, delete-orphan")

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())