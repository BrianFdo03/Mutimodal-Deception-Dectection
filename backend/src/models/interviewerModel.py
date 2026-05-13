from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.src.core.databaseCore import Base

class Interviewer(Base):
    __tablename__ = "interviewers"

    # interviewer_id (primary key)
    interviewer_id = Column(Integer, primary_key=True, index=True, nullable=False)
    
    # name (not null)
    name = Column(String, nullable=False)
    
    # contactNo (not null)
    contact_no = Column(String, nullable=False)
    
    # email (not null, unique)
    email = Column(String, unique=True, nullable=False)
    
    # position (not null)
    position = Column(String, nullable=False)
    
    # password (not null)
    # Note: In a real app, this stores the HASH, not the plain text.
    password = Column(String, nullable=False)

    # Metadata for tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sessions = relationship("Session", back_populates="interviewer")