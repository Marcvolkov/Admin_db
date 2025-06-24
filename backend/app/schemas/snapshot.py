from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SnapshotBase(BaseModel):
    """Base schema for snapshot"""
    environment: str = Field(..., description="Environment name")
    table_name: str = Field(..., description="Table name")
    change_request_id: int = Field(..., description="Associated change request ID")

class SnapshotListResponse(SnapshotBase):
    """Schema for snapshot list response (without data)"""
    id: int = Field(..., description="Snapshot ID")
    created_at: datetime = Field(..., description="When snapshot was created")
    row_count: int = Field(..., description="Number of rows in snapshot")
    data_size: int = Field(..., description="Size of snapshot data in bytes")
    
    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "environment": "dev",
                "table_name": "users",
                "change_request_id": 5,
                "created_at": "2024-01-15T10:30:00Z",
                "row_count": 150,
                "data_size": 25600
            }
        }

class SnapshotResponse(SnapshotBase):
    """Schema for full snapshot response (with data)"""
    id: int = Field(..., description="Snapshot ID")
    created_at: datetime = Field(..., description="When snapshot was created")
    snapshot_data: List[Dict[str, Any]] = Field(..., description="Complete table data at time of snapshot")
    row_count: int = Field(..., description="Number of rows in snapshot")
    data_size: int = Field(..., description="Size of snapshot data in bytes")
    
    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "environment": "dev", 
                "table_name": "users",
                "change_request_id": 5,
                "created_at": "2024-01-15T10:30:00Z",
                "snapshot_data": [
                    {"id": 1, "username": "admin", "email": "admin@example.com"},
                    {"id": 2, "username": "user", "email": "user@example.com"}
                ],
                "row_count": 2,
                "data_size": 145
            }
        }

class SnapshotCreate(SnapshotBase):
    """Schema for creating a snapshot"""
    snapshot_data: str = Field(..., description="JSON string of table data")
    
    class Config:
        schema_extra = {
            "example": {
                "environment": "dev",
                "table_name": "users", 
                "change_request_id": 5,
                "snapshot_data": "[{\"id\":1,\"username\":\"admin\"}]"
            }
        }

class SnapshotStats(BaseModel):
    """Schema for snapshot statistics"""
    total_snapshots: int = Field(..., description="Total number of snapshots")
    by_environment: Dict[str, int] = Field(..., description="Snapshot count by environment")
    by_table: Dict[str, int] = Field(..., description="Snapshot count by table")
    
    class Config:
        schema_extra = {
            "example": {
                "total_snapshots": 25,
                "by_environment": {
                    "dev": 10,
                    "test": 8,
                    "stage": 5,
                    "prod": 2
                },
                "by_table": {
                    "users": 12,
                    "products": 13
                }
            }
        }