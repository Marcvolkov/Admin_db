from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from ..models.change_request import OperationType, ChangeRequestStatus

class ChangeRequestCreate(BaseModel):
    environment: str
    table_name: str
    record_id: Optional[str] = None
    operation: OperationType
    old_data: Optional[Dict[str, Any]] = None
    new_data: Optional[Dict[str, Any]] = None

class ChangeRequestUpdate(BaseModel):
    status: ChangeRequestStatus
    comment: Optional[str] = None

class ChangeRequestResponse(BaseModel):
    id: int
    environment: str
    table_name: str
    record_id: Optional[str]
    operation: OperationType
    old_data: Optional[Dict[str, Any]]
    new_data: Optional[Dict[str, Any]]
    requested_by: int
    requested_at: datetime
    status: ChangeRequestStatus
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    requester_username: Optional[str] = None
    reviewer_username: Optional[str] = None
    
    class Config:
        from_attributes = True

class ApprovalRequest(BaseModel):
    approved: bool
    comment: Optional[str] = None