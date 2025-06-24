from fastapi import APIRouter, Depends, HTTPException
from typing import List
import json
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_metadata_db, get_session_for_environment
from ..models.user import User
from ..models.change_request import ChangeRequest, ChangeRequestStatus, OperationType
from ..schemas.change_request import ChangeRequestResponse, ApprovalRequest
from ..services.auth_service import require_admin
from ..services.approval_logic import create_table_snapshot
from ..config import Environment

router = APIRouter()

def safe_json_parse(json_str):
    """Safely parse JSON string, return None if invalid"""
    if not json_str:
        return None
    try:
        return json.loads(json_str) if isinstance(json_str, str) else json_str
    except (json.JSONDecodeError, TypeError):
        return None

def apply_database_change(change: ChangeRequest) -> bool:
    """Apply the approved change to the actual database"""
    try:
        # Get database session for the environment
        env = Environment(change.environment)
        SessionLocal = get_session_for_environment(env)
        db = SessionLocal()
        
        try:
            # Validate table name to prevent SQL injection
            table_name = change.table_name
            if not table_name.replace('_', '').isalnum():
                raise ValueError("Invalid table name")
            
            if change.operation == OperationType.CREATE:
                # Insert new record
                new_data = safe_json_parse(change.new_data)
                if not new_data:
                    raise ValueError("No new data for CREATE operation")
                
                # Build INSERT query
                columns = list(new_data.keys())
                placeholders = [f":{col}" for col in columns]
                query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
                
                db.execute(text(query), new_data)
                
            elif change.operation == OperationType.UPDATE:
                # Update existing record
                new_data = safe_json_parse(change.new_data)
                if not new_data or not change.record_id:
                    raise ValueError("No new data or record ID for UPDATE operation")
                
                # Build UPDATE query
                set_clauses = [f"{col} = :{col}" for col in new_data.keys()]
                query = f"UPDATE {table_name} SET {', '.join(set_clauses)} WHERE id = :record_id"
                
                # Add record_id to parameters
                params = new_data.copy()
                params['record_id'] = change.record_id
                
                db.execute(text(query), params)
                
            elif change.operation == OperationType.DELETE:
                # Delete record
                if not change.record_id:
                    raise ValueError("No record ID for DELETE operation")
                
                query = f"DELETE FROM {table_name} WHERE id = :record_id"
                db.execute(text(query), {"record_id": change.record_id})
            
            db.commit()
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error applying database change: {e}")
        return False

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
            "old_data": safe_json_parse(change.old_data),
            "new_data": safe_json_parse(change.new_data),
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
        "old_data": safe_json_parse(change.old_data),
        "new_data": safe_json_parse(change.new_data),
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
        try:
            # Create snapshot before applying change
            snapshot_id = create_table_snapshot(
                Environment(change.environment), 
                change.table_name, 
                change.id
            )
            
            # Apply the actual database change
            success = apply_database_change(change)
            if success:
                change.status = ChangeRequestStatus.APPROVED
                message = f"Change request approved and applied (snapshot #{snapshot_id} created)"
            else:
                change.status = ChangeRequestStatus.REJECTED
                message = "Change request approved but failed to apply - marked as rejected"
        except Exception as e:
            change.status = ChangeRequestStatus.REJECTED
            message = f"Failed to create snapshot or apply change: {str(e)}"
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
            "old_data": safe_json_parse(change.old_data),
            "new_data": safe_json_parse(change.new_data),
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