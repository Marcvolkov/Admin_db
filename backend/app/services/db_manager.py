from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_session_for_environment
from ..config import Environment
from ..schemas.table import TableInfo, ColumnInfo, TableData, DataFilter

def get_table_list(environment: Environment) -> List[str]:
    """Returns all tables in the specified environment"""
    SessionLocal = get_session_for_environment(environment)
    db = SessionLocal()
    
    try:
        result = db.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """))
        tables = [row[0] for row in result.fetchall()]
        return tables
    finally:
        db.close()

def get_table_schema(environment: Environment, table_name: str) -> TableInfo:
    """Returns column information for a table"""
    SessionLocal = get_session_for_environment(environment)
    db = SessionLocal()
    
    try:
        # Get column information for PostgreSQL
        result = db.execute(text(f"""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' AND table_schema = 'public'
            ORDER BY ordinal_position
        """))
        columns = []
        
        # Get primary key information
        pk_result = db.execute(text(f"""
            SELECT column_name 
            FROM information_schema.key_column_usage 
            WHERE table_name = '{table_name}' AND constraint_name LIKE '%_pkey'
        """))
        primary_keys = [row[0] for row in pk_result.fetchall()]
        
        for row in result.fetchall():
            columns.append(ColumnInfo(
                name=row[0],
                type=row[1],
                nullable=row[2] == 'YES',
                primary_key=row[0] in primary_keys
            ))
        
        return TableInfo(name=table_name, columns=columns)
    finally:
        db.close()

def get_table_data(
    environment: Environment, 
    table_name: str, 
    filters: Optional[List[DataFilter]] = None,
    limit: int = 100, 
    offset: int = 0
) -> TableData:
    """Returns paginated table data with optional filters"""
    SessionLocal = get_session_for_environment(environment)
    db = SessionLocal()
    
    try:
        # Build WHERE clause from filters
        where_clause = ""
        if filters:
            conditions = []
            for f in filters:
                if f.operator == "eq":
                    conditions.append(f"{f.column} = '{f.value}'")
                elif f.operator == "like":
                    conditions.append(f"{f.column} LIKE '%{f.value}%'")
                # Add more operators as needed
            if conditions:
                where_clause = "WHERE " + " AND ".join(conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM {table_name} {where_clause}"
        count_result = db.execute(text(count_query))
        total_count = count_result.fetchone()[0]
        
        # Get column names
        schema_result = db.execute(text(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' AND table_schema = 'public'
            ORDER BY ordinal_position
        """))
        columns = [row[0] for row in schema_result.fetchall()]
        
        # Get data
        data_query = f"SELECT * FROM {table_name} {where_clause} LIMIT {limit} OFFSET {offset}"
        data_result = db.execute(text(data_query))
        rows = [list(row) for row in data_result.fetchall()]
        
        return TableData(
            columns=columns,
            rows=rows,
            total_count=total_count
        )
    finally:
        db.close()

def execute_query(environment: Environment, query: str) -> Dict[str, Any]:
    """Execute a predefined query safely"""
    SessionLocal = get_session_for_environment(environment)
    db = SessionLocal()
    
    try:
        result = db.execute(text(query))
        
        if result.returns_rows:
            columns = list(result.keys())
            rows = [list(row) for row in result.fetchall()]
            return {
                "columns": columns,
                "rows": rows,
                "row_count": len(rows)
            }
        else:
            return {
                "message": "Query executed successfully",
                "rows_affected": result.rowcount
            }
    finally:
        db.close()