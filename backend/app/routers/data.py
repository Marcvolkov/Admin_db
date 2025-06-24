from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_metadata_db, get_session_for_environment
from ..models.user import User
from ..models.change_request import ChangeRequest, OperationType, ChangeRequestStatus
from ..services.auth_service import require_admin
from ..routers.environments import user_environments
from ..config import Environment
import json
from datetime import datetime
from decimal import Decimal

router = APIRouter()

def get_current_env(user_id: int) -> Environment:
    """Get current environment for user"""
    env_str = user_environments.get(user_id, Environment.DEV.value)
    return Environment(env_str)

def safe_json_dumps(data: Dict[str, Any]) -> str:
    """Safely serialize data to JSON, handling datetime and decimal objects"""
    def object_serializer(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return str(obj)
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
    
    return json.dumps(data, default=object_serializer)

def get_current_record(table_name: str, record_id: str, environment: Environment) -> Dict[str, Any]:
    """Fetch current record data from the database"""
    try:
        SessionLocal = get_session_for_environment(environment)
        db = SessionLocal()
        
        try:
            # Safely quote the table name to prevent SQL injection
            # First, validate table name (only allow alphanumeric and underscores)
            if not table_name.replace('_', '').isalnum():
                raise HTTPException(status_code=400, detail="Invalid table name")
            
            # Get the record using parameterized query
            result = db.execute(
                text(f"SELECT * FROM {table_name} WHERE id = :record_id"),
                {"record_id": record_id}
            )
            
            record = result.fetchone()
            if not record:
                return {}
            
            # Convert record to dictionary
            column_names = result.keys()
            return dict(zip(column_names, record))
            
        finally:
            db.close()
            
    except Exception:
        # Log the error but don't raise it - return empty dict for graceful degradation
        return {}


@router.post("/{table_name}/records")
def create_record(
    table_name: str,
    record_data: Dict[str, Any],
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Create new record (admin only) - creates change request"""
    env = get_current_env(current_user.id)
    
    # Create change request
    change_request = ChangeRequest(
        environment=env.value,
        table_name=table_name,
        operation=OperationType.CREATE,
        new_data=safe_json_dumps(record_data),
        requested_by=current_user.id,
        status=ChangeRequestStatus.PENDING
    )
    
    db.add(change_request)
    db.commit()
    db.refresh(change_request)
    
    return {"message": "Change request created", "change_request_id": change_request.id}

@router.put("/{table_name}/records/{record_id}")
def update_record(
    table_name: str,
    record_id: str,
    record_data: Dict[str, Any],
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Update record (admin only) - creates change request"""
    env = get_current_env(current_user.id)
    
    # Get current record data before update
    try:
        old_data = get_current_record(table_name, record_id, env)
    except Exception:
        # If we can't get old data, use minimal data for now
        old_data = {"id": record_id}
    
    # Create change request
    change_request = ChangeRequest(
        environment=env.value,
        table_name=table_name,
        record_id=record_id,
        operation=OperationType.UPDATE,
        old_data=safe_json_dumps(old_data),
        new_data=safe_json_dumps(record_data),
        requested_by=current_user.id,
        status=ChangeRequestStatus.PENDING
    )
    
    db.add(change_request)
    db.commit()
    db.refresh(change_request)
    
    return {"message": "Change request created", "change_request_id": change_request.id}

@router.delete("/{table_name}/records/{record_id}")
def delete_record(
    table_name: str,
    record_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Delete record (admin only) - creates change request"""
    env = get_current_env(current_user.id)
    
    # Get current record data before deletion
    old_data = get_current_record(table_name, record_id, env)
    
    # Create change request
    change_request = ChangeRequest(
        environment=env.value,
        table_name=table_name,
        record_id=record_id,
        operation=OperationType.DELETE,
        old_data=safe_json_dumps(old_data),
        requested_by=current_user.id,
        status=ChangeRequestStatus.PENDING
    )
    
    db.add(change_request)
    db.commit()
    db.refresh(change_request)
    
    return {"message": "Change request created", "change_request_id": change_request.id}