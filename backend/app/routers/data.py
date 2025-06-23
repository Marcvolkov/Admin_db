from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from sqlalchemy.orm import Session
from ..database import get_metadata_db
from ..models.user import User
from ..models.change_request import ChangeRequest, OperationType, ChangeRequestStatus
from ..services.auth_service import require_admin
from ..routers.environments import user_environments
from ..config import Environment
import json

router = APIRouter()

def get_current_env(user_id: int) -> Environment:
    """Get current environment for user"""
    env_str = user_environments.get(user_id, Environment.DEV.value)
    return Environment(env_str)

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
        new_data=json.dumps(record_data),
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
    
    # TODO: Get old data from the actual table
    old_data = {"id": record_id}  # Simplified for now
    
    # Create change request
    change_request = ChangeRequest(
        environment=env.value,
        table_name=table_name,
        record_id=record_id,
        operation=OperationType.UPDATE,
        old_data=json.dumps(old_data),
        new_data=json.dumps(record_data),
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
    
    # TODO: Get old data from the actual table
    old_data = {"id": record_id}  # Simplified for now
    
    # Create change request
    change_request = ChangeRequest(
        environment=env.value,
        table_name=table_name,
        record_id=record_id,
        operation=OperationType.DELETE,
        old_data=json.dumps(old_data),
        requested_by=current_user.id,
        status=ChangeRequestStatus.PENDING
    )
    
    db.add(change_request)
    db.commit()
    db.refresh(change_request)
    
    return {"message": "Change request created", "change_request_id": change_request.id}