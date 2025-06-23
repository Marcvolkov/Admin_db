from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from ..database import Base

class OperationType(PyEnum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"

class ChangeRequestStatus(PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ChangeRequest(Base):
    __tablename__ = "change_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    environment = Column(String, nullable=False)
    table_name = Column(String, nullable=False)
    record_id = Column(String, nullable=True)  # NULL for CREATE operations
    operation = Column(Enum(OperationType), nullable=False)
    old_data = Column(Text, nullable=True)  # JSON string
    new_data = Column(Text, nullable=True)  # JSON string
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(ChangeRequestStatus), nullable=False, default=ChangeRequestStatus.PENDING)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    requester = relationship("User", foreign_keys=[requested_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    snapshots = relationship("Snapshot", back_populates="change_request")