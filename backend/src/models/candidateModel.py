from sqlalchemy import Column, Integer, String, DateTime, Date, ARRAY
from sqlalchemy.sql import func
from backend.src.core.databaseCore import Base
from sqlalchemy.orm import relationship

class Candidate(Base):
    __tablename__ = "candidates"

    # candidate_id (PK, not null)
    candidate_id = Column(Integer, primary_key=True, index=True, nullable=False)
    
    # name (not null)
    name = Column(String, nullable=False)
    
    # NIC (unique, not null)
    nic = Column(String, unique=True, nullable=False)
    
    # email (not null, unique)
    email = Column(String, unique=True, nullable=False)
    
    # DOB (not null)
    dob = Column(Date, nullable=False)
    
    # education
    education = Column(String, nullable=True) 
    
    # contactNo (multi-valued, not null) -> e.g. ['0771234567', '0112233445']
    contact_no = Column(ARRAY(String), nullable=False)
    
    # sprint_id (multi-valued, not null) -> e.g. [1, 5, 12]
    sprint_ids = Column(ARRAY(Integer), nullable=False)

    # Relationship to WorkExperience (explained below)
    work_experiences = relationship("WorkExperience", back_populates="candidate", cascade="all, delete-orphan")

    # Metadata for tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())