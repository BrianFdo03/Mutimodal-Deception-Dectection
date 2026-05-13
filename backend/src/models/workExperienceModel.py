from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from backend.src.core.databaseCore import Base

class WorkExperience(Base):
    __tablename__ = "work_experiences"

    # work_experience_id (primary key)
    id = Column(Integer, primary_key=True, index=True, nullable=False)
    
    # candidate_id (foreign key, not null)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"), nullable=False)
    
    # company (not null)
    company = Column(String, nullable=False)
    
    # start_year (not null)
    start_year = Column(Integer, nullable=False)
    
    # end_year (not null)
    # Note: Use String or Integer. If they still work there, you might store 0 or a specific value.
    end_year = Column(Integer, nullable=False)
    
    # position (not null)
    position = Column(String, nullable=False)

    # Relationship back to the Candidate object
    candidate = relationship("Candidate", back_populates="work_experiences")