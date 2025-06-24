from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ..models.user import User
from ..services.auth_service import require_admin
from ..services.query_service import query_service
from ..schemas.query import PredefinedQuery, QueryResult, QueryExecution
from ..config import Environment

router = APIRouter()

@router.get("/{environment}/{table_name}", response_model=List[PredefinedQuery])
def get_queries_for_table(
    environment: str,
    table_name: str,
    current_user: User = Depends(require_admin)
):
    """Get all predefined queries for a specific table"""
    try:
        # Validate environment
        env = Environment(environment)
        
        # Get queries for the table
        queries = query_service.get_queries_for_table(table_name)
        return queries
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{environment}/{table_name}/{query_id}", response_model=QueryResult)
async def execute_query(
    environment: str,
    table_name: str,
    query_id: str,
    execution: QueryExecution,
    current_user: User = Depends(require_admin)
):
    """Execute a predefined query with parameters"""
    try:
        # Validate environment
        env = Environment(environment)
        
        # Execute the query
        result = await query_service.execute_query(
            environment=env,
            table_name=table_name,
            query_id=query_id,
            parameters=execution.parameters
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")