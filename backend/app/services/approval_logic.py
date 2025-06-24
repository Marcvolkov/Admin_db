from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any
from datetime import datetime
from ..database import get_metadata_db, get_session_for_environment
from ..models.change_request import ChangeRequest, OperationType, ChangeRequestStatus
from ..models.snapshot import Snapshot
from ..config import Environment
import json

def create_change_request(
    db: Session,
    environment: str,
    table_name: str,
    operation: OperationType,
    record_id: str = None,
    old_data: Dict[str, Any] = None,
    new_data: Dict[str, Any] = None,
    requested_by: int = None
) -> ChangeRequest:
    """Create a new change request"""
    change_request = ChangeRequest(
        environment=environment,
        table_name=table_name,
        record_id=record_id,
        operation=operation,
        old_data=json.dumps(old_data) if old_data else None,
        new_data=json.dumps(new_data) if new_data else None,
        requested_by=requested_by,
        status=ChangeRequestStatus.PENDING
    )
    
    db.add(change_request)
    db.commit()
    db.refresh(change_request)
    return change_request

def get_pending_changes(db: Session) -> list[ChangeRequest]:
    """Get all pending change requests"""
    return db.query(ChangeRequest).filter(
        ChangeRequest.status == ChangeRequestStatus.PENDING
    ).all()

def approve_change(db: Session, change_id: int, user_id: int) -> Dict[str, Any]:
    """Approve a change request and apply it to the database"""
    change = db.query(ChangeRequest).filter(ChangeRequest.id == change_id).first()
    if not change:
        raise ValueError("Change request not found")
    
    if change.status != ChangeRequestStatus.PENDING:
        raise ValueError("Change request already processed")
    
    # Create snapshot before applying change
    snapshot_id = create_table_snapshot(
        Environment(change.environment), 
        change.table_name, 
        change_id
    )
    
    # Apply the database change
    try:
        apply_database_change(change)
        
        # Update change request status
        change.status = ChangeRequestStatus.APPROVED
        change.reviewed_by = user_id
        change.reviewed_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Change approved and applied",
            "snapshot_id": snapshot_id
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Failed to apply change: {str(e)}")

def reject_change(db: Session, change_id: int, user_id: int, reason: str = None) -> Dict[str, Any]:
    """Reject a change request"""
    change = db.query(ChangeRequest).filter(ChangeRequest.id == change_id).first()
    if not change:
        raise ValueError("Change request not found")
    
    if change.status != ChangeRequestStatus.PENDING:
        raise ValueError("Change request already processed")
    
    change.status = ChangeRequestStatus.REJECTED
    change.reviewed_by = user_id
    change.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Change request rejected",
        "reason": reason
    }

def apply_database_change(change_request: ChangeRequest) -> None:
    """Apply the actual database change"""
    env = Environment(change_request.environment)
    SessionLocal = get_session_for_environment(env)
    db = SessionLocal()
    
    try:
        if change_request.operation == OperationType.CREATE:
            # Insert new record
            new_data = json.loads(change_request.new_data)
            columns = ", ".join(new_data.keys())
            values = ", ".join([f"'{v}'" for v in new_data.values()])
            query = f"INSERT INTO {change_request.table_name} ({columns}) VALUES ({values})"
            db.execute(text(query))
            
        elif change_request.operation == OperationType.UPDATE:
            # Update existing record
            new_data = json.loads(change_request.new_data)
            set_clause = ", ".join([f"{k} = '{v}'" for k, v in new_data.items()])
            query = f"UPDATE {change_request.table_name} SET {set_clause} WHERE id = {change_request.record_id}"
            db.execute(text(query))
            
        elif change_request.operation == OperationType.DELETE:
            # Delete record
            query = f"DELETE FROM {change_request.table_name} WHERE id = {change_request.record_id}"
            db.execute(text(query))
        
        db.commit()
    finally:
        db.close()

def create_table_snapshot(environment: Environment, table_name: str, change_request_id: int) -> int:
    """Create a snapshot of table data before change"""
    SessionLocal = get_session_for_environment(environment)
    db = SessionLocal()
    metadata_db = next(get_metadata_db())
    
    try:
        # Get all data from table
        result = db.execute(text(f"SELECT * FROM {table_name}"))
        rows = []
        
        for row in result.fetchall():
            row_dict = dict(row._mapping)
            # Convert datetime objects to ISO format strings
            for key, value in row_dict.items():
                if isinstance(value, datetime):
                    row_dict[key] = value.isoformat()
                elif hasattr(value, '__str__') and str(type(value)) == "<class 'decimal.Decimal'>":
                    row_dict[key] = str(value)
            rows.append(row_dict)
        
        # Create snapshot record
        snapshot = Snapshot(
            environment=environment.value,
            table_name=table_name,
            snapshot_data=json.dumps(rows, default=str),
            change_request_id=change_request_id
        )
        
        metadata_db.add(snapshot)
        metadata_db.commit()
        metadata_db.refresh(snapshot)
        
        return snapshot.id
    finally:
        db.close()
        metadata_db.close()