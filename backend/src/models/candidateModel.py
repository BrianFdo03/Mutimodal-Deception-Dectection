# from sqlalchemy import Column, Integer, String, DateTime, Date, ARRAY
# from sqlalchemy.sql import func
# from backend.src.core.databaseCore import Base
# from sqlalchemy.orm import relationship

# class Candidate(Base):
#     __tablename__ = "candidates"

#     # candidate_id (PK, not null)
#     candidate_id = Column(Integer, primary_key=True, index=True, nullable=False)
    
#     # name (not null)
#     name = Column(String, nullable=False)
    
#     # NIC (unique, not null)
#     nic = Column(String, unique=True, nullable=False)
    
#     # email (not null, unique)
#     email = Column(String, unique=True, nullable=False)
    
#     # DOB (not null)
#     dob = Column(Date, nullable=False)
    
#     # education
#     education = Column(String, nullable=True) 
    
#     # contactNo (multi-valued, not null) -> e.g. ['0771234567', '0112233445']
#     contact_no = Column(ARRAY(String), nullable=False)
    
#     # sprint_id (multi-valued, not null) -> e.g. [1, 5, 12]
#     sprint_ids = Column(ARRAY(Integer), nullable=False)

#     sessions = relationship("Session", back_populates="candidate")
#     # Relationship to WorkExperience (explained below)
#     work_experiences = relationship("WorkExperience", back_populates="candidate", cascade="all, delete-orphan")

#     # Metadata for tracking
#     created_at = Column(DateTime(timezone=True), server_default=func.now())

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from backend.src.core.databaseCore import Base


class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=True)

    position = Column(String(150), nullable=False)
    experience_level = Column(String(100), nullable=True)
    status = Column(String(100), nullable=False, default="New")

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())