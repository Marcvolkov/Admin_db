from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from enum import Enum

class ParameterType(str, Enum):
    INTEGER = "integer"
    DECIMAL = "decimal"
    TEXT = "text"
    SELECT = "select"
    DATE = "date"
    BOOLEAN = "boolean"

class QueryParameter(BaseModel):
    """Schema for query parameter definition"""
    name: str = Field(..., description="Parameter name")
    type: ParameterType = Field(..., description="Parameter data type")
    description: str = Field(..., description="Parameter description")
    default: Optional[Union[str, int, float, bool]] = Field(None, description="Default value")
    required: bool = Field(True, description="Whether parameter is required")
    
    # Validation constraints
    min: Optional[Union[int, float]] = Field(None, description="Minimum value (for numeric types)")
    max: Optional[Union[int, float]] = Field(None, description="Maximum value (for numeric types)")
    maxLength: Optional[int] = Field(None, description="Maximum length (for text type)")
    options: Optional[List[str]] = Field(None, description="Valid options (for select type)")

class PredefinedQuery(BaseModel):
    """Schema for predefined query definition"""
    id: str = Field(..., description="Unique query identifier")
    name: str = Field(..., description="Human-readable query name")
    description: str = Field(..., description="Query description")
    sql: str = Field(..., description="SQL template with parameter placeholders")
    parameters: List[QueryParameter] = Field(default_factory=list, description="Query parameters")
    
    class Config:
        schema_extra = {
            "example": {
                "id": "users_recent",
                "name": "Recent Users",
                "description": "Users created in the last N days",
                "sql": "SELECT * FROM users WHERE created_at >= NOW() - INTERVAL '{days} days'",
                "parameters": [
                    {
                        "name": "days",
                        "type": "integer",
                        "description": "Number of days",
                        "default": 30,
                        "min": 1,
                        "max": 365
                    }
                ]
            }
        }

class QueryExecution(BaseModel):
    """Schema for query execution request"""
    query_id: str = Field(..., description="ID of the query to execute")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Query parameters")
    
    class Config:
        schema_extra = {
            "example": {
                "query_id": "users_recent",
                "parameters": {
                    "days": 7
                }
            }
        }

class QueryResult(BaseModel):
    """Schema for query execution result"""
    query_id: str = Field(..., description="Executed query ID")
    query_name: str = Field(..., description="Executed query name")
    columns: List[str] = Field(..., description="Result column names")
    rows: List[Dict[str, Any]] = Field(..., description="Result rows")
    row_count: int = Field(..., description="Number of rows returned")
    executed_sql: str = Field(..., description="The actual SQL that was executed")
    parameters: Dict[str, Any] = Field(..., description="Parameters used in execution")
    
    class Config:
        schema_extra = {
            "example": {
                "query_id": "users_recent",
                "query_name": "Recent Users",
                "columns": ["id", "username", "email", "created_at"],
                "rows": [
                    {"id": 1, "username": "admin", "email": "admin@example.com", "created_at": "2024-01-15T10:30:00"},
                    {"id": 2, "username": "user", "email": "user@example.com", "created_at": "2024-01-14T15:45:00"}
                ],
                "row_count": 2,
                "executed_sql": "SELECT * FROM users WHERE created_at >= NOW() - INTERVAL '7 days'",
                "parameters": {"days": 7}
            }
        }

class QueriesListResponse(BaseModel):
    """Schema for listing available queries for a table"""
    table_name: str = Field(..., description="Table name")
    queries: List[PredefinedQuery] = Field(..., description="Available queries")
    
    class Config:
        schema_extra = {
            "example": {
                "table_name": "users",
                "queries": [
                    {
                        "id": "users_all",
                        "name": "All Users",
                        "description": "Retrieve all users",
                        "sql": "SELECT * FROM users ORDER BY created_at DESC",
                        "parameters": []
                    }
                ]
            }
        }