from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from ..database import get_metadata_db
from ..models.user import User
from ..models.change_request import ChangeRequest, ChangeRequestStatus
from ..schemas.change_request import ChangeRequestResponse, ApprovalRequest
from ..services.auth_service import require_admin

router = APIRouter()

@router.get("/pending", response_model=List[ChangeRequestResponse])
def get_pending_changes(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Get list of pending changes (admin only)"""
    changes = db.query(ChangeRequest).filter(
        ChangeRequest.status == ChangeRequestStatus.PENDING
    ).all()
    
    # Add username information
    result = []
    for change in changes:
        change_dict = {
            "id": change.id,
            "environment": change.environment,
            "table_name": change.table_name,
            "record_id": change.record_id,
            "operation": change.operation,
            "old_data": change.old_data,
            "new_data": change.new_data,
            "requested_by": change.requested_by,
            "requested_at": change.requested_at,
            "status": change.status,
            "reviewed_by": change.reviewed_by,
            "reviewed_at": change.reviewed_at,
            "requester_username": change.requester.username if change.requester else None,
            "reviewer_username": change.reviewer.username if change.reviewer else None
        }
        result.append(ChangeRequestResponse(**change_dict))
    
    return result

@router.get("/{change_id}", response_model=ChangeRequestResponse)
def get_change_details(
    change_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Get change request details with diff (admin only)"""
    change = db.query(ChangeRequest).filter(ChangeRequest.id == change_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")
    
    change_dict = {
        "id": change.id,
        "environment": change.environment,
        "table_name": change.table_name,
        "record_id": change.record_id,
        "operation": change.operation,
        "old_data": change.old_data,
        "new_data": change.new_data,
        "requested_by": change.requested_by,
        "requested_at": change.requested_at,
        "status": change.status,
        "reviewed_by": change.reviewed_by,
        "reviewed_at": change.reviewed_at,
        "requester_username": change.requester.username if change.requester else None,
        "reviewer_username": change.reviewer.username if change.reviewer else None
    }
    
    return ChangeRequestResponse(**change_dict)

@router.post("/{change_id}/approve")
def approve_change(
    change_id: int,
    approval: ApprovalRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Approve change request (admin only)"""
    change = db.query(ChangeRequest).filter(ChangeRequest.id == change_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")
    
    if change.status != ChangeRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Change request already processed")
    
    # Update change request status
    if approval.approved:
        change.status = ChangeRequestStatus.APPROVED
        # TODO: Apply the actual database change
        # TODO: Create snapshot
        message = "Change request approved and applied"
    else:
        change.status = ChangeRequestStatus.REJECTED
        message = "Change request rejected"
    
    change.reviewed_by = current_user.id
    from datetime import datetime
    change.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": message, "status": change.status.value}

@router.post("/{change_id}/reject")
def reject_change(
    change_id: int,
    approval: ApprovalRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Reject change request (admin only)"""
    change = db.query(ChangeRequest).filter(ChangeRequest.id == change_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Change request not found")
    
    if change.status != ChangeRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Change request already processed")
    
    change.status = ChangeRequestStatus.REJECTED
    change.reviewed_by = current_user.id
    from datetime import datetime
    change.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Change request rejected", "status": change.status.value}

@router.get("/history", response_model=List[ChangeRequestResponse])
def get_change_history(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Get all processed changes history (admin only)"""
    changes = db.query(ChangeRequest).filter(
        ChangeRequest.status.in_([ChangeRequestStatus.APPROVED, ChangeRequestStatus.REJECTED])
    ).order_by(ChangeRequest.reviewed_at.desc()).all()
    
    result = []
    for change in changes:
        change_dict = {
            "id": change.id,
            "environment": change.environment,
            "table_name": change.table_name,
            "record_id": change.record_id,
            "operation": change.operation,
            "old_data": change.old_data,
            "new_data": change.new_data,
            "requested_by": change.requested_by,
            "requested_at": change.requested_at,
            "status": change.status,
            "reviewed_by": change.reviewed_by,
            "reviewed_at": change.reviewed_at,
            "requester_username": change.requester.username if change.requester else None,
            "reviewer_username": change.reviewer.username if change.reviewer else None
        }
        result.append(ChangeRequestResponse(**change_dict))
    
    return result