from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_metadata_db
from ..models.user import User
from ..models.snapshot import Snapshot
from ..schemas.snapshot import SnapshotResponse, SnapshotListResponse
from ..services.auth_service import require_admin
import json

router = APIRouter()

@router.get("/", response_model=List[SnapshotListResponse])
def get_snapshots(
    environment: Optional[str] = Query(None, description="Filter by environment"),
    table_name: Optional[str] = Query(None, description="Filter by table name"),
    change_request_id: Optional[int] = Query(None, description="Filter by change request ID"),
    limit: int = Query(50, description="Number of snapshots to return"),
    offset: int = Query(0, description="Number of snapshots to skip"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Get list of snapshots with optional filtering (admin only)"""
    query = db.query(Snapshot)
    
    if environment:
        query = query.filter(Snapshot.environment == environment)
    if table_name:
        query = query.filter(Snapshot.table_name == table_name)
    if change_request_id:
        query = query.filter(Snapshot.change_request_id == change_request_id)
    
    snapshots = query.order_by(Snapshot.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for snapshot in snapshots:
        # Parse snapshot data to get row count
        try:
            data = json.loads(snapshot.snapshot_data)
            row_count = len(data) if isinstance(data, list) else 0
        except:
            row_count = 0
        
        result.append(SnapshotListResponse(
            id=snapshot.id,
            environment=snapshot.environment,
            table_name=snapshot.table_name,
            change_request_id=snapshot.change_request_id,
            created_at=snapshot.created_at,
            row_count=row_count,
            data_size=len(snapshot.snapshot_data)
        ))
    
    return result

@router.get("/{snapshot_id}", response_model=SnapshotResponse)
def get_snapshot(
    snapshot_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Get specific snapshot data (admin only)"""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    # Parse snapshot data
    try:
        snapshot_data = json.loads(snapshot.snapshot_data)
    except json.JSONDecodeError:
        snapshot_data = []
    
    return SnapshotResponse(
        id=snapshot.id,
        environment=snapshot.environment,
        table_name=snapshot.table_name,
        change_request_id=snapshot.change_request_id,
        created_at=snapshot.created_at,
        snapshot_data=snapshot_data,
        row_count=len(snapshot_data) if isinstance(snapshot_data, list) else 0,
        data_size=len(snapshot.snapshot_data)
    )

@router.get("/change-request/{change_request_id}", response_model=List[SnapshotListResponse])
def get_snapshots_for_change_request(
    change_request_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Get all snapshots for a specific change request (admin only)"""
    snapshots = db.query(Snapshot).filter(
        Snapshot.change_request_id == change_request_id
    ).order_by(Snapshot.created_at.desc()).all()
    
    if not snapshots:
        raise HTTPException(status_code=404, detail="No snapshots found for this change request")
    
    result = []
    for snapshot in snapshots:
        # Parse snapshot data to get row count
        try:
            data = json.loads(snapshot.snapshot_data)
            row_count = len(data) if isinstance(data, list) else 0
        except:
            row_count = 0
        
        result.append(SnapshotListResponse(
            id=snapshot.id,
            environment=snapshot.environment,
            table_name=snapshot.table_name,
            change_request_id=snapshot.change_request_id,
            created_at=snapshot.created_at,
            row_count=row_count,
            data_size=len(snapshot.snapshot_data)
        ))
    
    return result

@router.delete("/{snapshot_id}")
def delete_snapshot(
    snapshot_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Delete a snapshot (admin only) - for cleanup of old snapshots"""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    db.delete(snapshot)
    db.commit()
    
    return {"message": f"Snapshot {snapshot_id} deleted successfully"}

@router.get("/stats/summary")
def get_snapshot_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_metadata_db)
):
    """Get snapshot statistics summary (admin only)"""
    total_snapshots = db.query(Snapshot).count()
    
    # Get snapshots by environment
    from sqlalchemy import func
    env_stats = db.query(Snapshot.environment, func.count(Snapshot.id)).group_by(Snapshot.environment).all()
    
    # Get snapshots by table
    table_stats = db.query(Snapshot.table_name, func.count(Snapshot.id)).group_by(Snapshot.table_name).all()
    
    return {
        "total_snapshots": total_snapshots,
        "by_environment": {env: count for env, count in env_stats},
        "by_table": {table: count for table, count in table_stats}
    }