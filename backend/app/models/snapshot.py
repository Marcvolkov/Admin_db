from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Snapshot(Base):
    __tablename__ = "snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    environment = Column(String, nullable=False)
    table_name = Column(String, nullable=False)
    snapshot_data = Column(Text, nullable=False)  # JSON string
    change_request_id = Column(Integer, ForeignKey("change_requests.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    change_request = relationship("ChangeRequest", back_populates="snapshots")