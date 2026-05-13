from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend..core.databaseCore import Base

class InterviewSprint(Base):
    __tablename__ = "interview_sprints"

    # interview_sprint_id (primary key)
    interview_sprint_id = Column(Integer, primary_key=True, index=True, nullable=False)
    
    # position (not null) - e.g., "Mobile App Developer"
    position = Column(String, nullable=False)
    
    # No_of_stages (not null)
    no_of_stages = Column(Integer, nullable=False)
    
    # interview_sprint_start (not null)
    interview_sprint_start = Column(Date, nullable=False)
    
    # interview_sprint_end (not null)
    interview_sprint_end = Column(Date, nullable=False)

    # Relationships
    # This will link to the Stages we create next
    stages = relationship("InterviewStage", back_populates="sprint", cascade="all, delete-orphan")

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())