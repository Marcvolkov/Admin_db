from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy import text
from ..database import get_session_for_environment
from ..config import Environment
from ..models.user import User
from ..services.auth_service import get_current_user
from ..schemas.table import TableInfo, ColumnInfo, TableData
from ..routers.environments import user_environments

router = APIRouter()

def get_current_env(user_id: int) -> Environment:
    """Get current environment for user"""
    env_str = user_environments.get(user_id, Environment.DEV.value)
    return Environment(env_str)

@router.get("/", response_model=List[str])
def get_tables(current_user: User = Depends(get_current_user)):
    """Get list of all tables in current environment"""
    env = get_current_env(current_user.id)
    SessionLocal = get_session_for_environment(env)
    db = SessionLocal()
    
    try:
        # For SQLite, get table names from sqlite_master
        result = db.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        """))
        tables = [row[0] for row in result.fetchall()]
        return tables
    finally:
        db.close()

@router.get("/{table_name}/schema", response_model=TableInfo)
def get_table_schema(table_name: str, current_user: User = Depends(get_current_user)):
    """Get table schema information"""
    env = get_current_env(current_user.id)
    SessionLocal = get_session_for_environment(env)
    db = SessionLocal()
    
    try:
        # Get column information for SQLite
        result = db.execute(text(f"PRAGMA table_info({table_name})"))
        columns = []
        
        for row in result.fetchall():
            columns.append(ColumnInfo(
                name=row[1],  # column name
                type=row[2],  # data type
                nullable=not row[3],  # not null flag
                primary_key=bool(row[5])  # primary key flag
            ))
        
        if not columns:
            raise HTTPException(status_code=404, detail="Table not found")
            
        return TableInfo(name=table_name, columns=columns)
    finally:
        db.close()

@router.get("/{table_name}/data", response_model=TableData)
def get_table_data(
    table_name: str, 
    limit: int = 100, 
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get paginated table data"""
    env = get_current_env(current_user.id)
    SessionLocal = get_session_for_environment(env)
    db = SessionLocal()
    
    try:
        # Get total count
        count_result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        total_count = count_result.fetchone()[0]
        
        # Get column names
        schema_result = db.execute(text(f"PRAGMA table_info({table_name})"))
        columns = [row[1] for row in schema_result.fetchall()]
        
        # Get data
        data_result = db.execute(text(f"""
            SELECT * FROM {table_name} 
            LIMIT {limit} OFFSET {offset}
        """))
        rows = [list(row) for row in data_result.fetchall()]
        
        return TableData(
            columns=columns,
            rows=rows,
            total_count=total_count
        )
    finally:
        db.close()