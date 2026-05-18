from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

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

    sessions = relationship(
        "InterviewSession",
        back_populates="candidate",
        cascade="all, delete-orphan",
    )