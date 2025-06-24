import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from sqlalchemy import text
from app.database import get_session_for_environment
from app.config import Environment
from app.schemas.query import PredefinedQuery, QueryParameter, QueryResult, QueryExecution

class QueryService:
    """Service for managing and executing predefined queries"""
    
    def __init__(self):
        self.queries_file = Path(__file__).parent.parent / "data" / "queries.json"
        self._queries_cache: Optional[Dict[str, List[PredefinedQuery]]] = None
    
    def _load_queries(self) -> Dict[str, List[PredefinedQuery]]:
        """Load predefined queries from JSON file"""
        if self._queries_cache is not None:
            return self._queries_cache
            
        try:
            with open(self.queries_file, 'r') as f:
                queries_data = json.load(f)
            
            queries = {}
            for table_name, table_queries in queries_data.items():
                queries[table_name] = [
                    PredefinedQuery(**query_data) for query_data in table_queries
                ]
            
            self._queries_cache = queries
            return queries
        except FileNotFoundError:
            print(f"Queries file not found: {self.queries_file}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing queries JSON: {e}")
            return {}
    
    def get_queries_for_table(self, table_name: str) -> List[PredefinedQuery]:
        """Get all predefined queries for a specific table"""
        queries = self._load_queries()
        return queries.get(table_name, [])
    
    def get_query_by_id(self, table_name: str, query_id: str) -> Optional[PredefinedQuery]:
        """Get a specific query by table name and query ID"""
        queries = self.get_queries_for_table(table_name)
        for query in queries:
            if query.id == query_id:
                return query
        return None
    
    def validate_parameters(self, query: PredefinedQuery, parameters: Dict[str, Any]) -> Dict[str, str]:
        """Validate query parameters and return validation errors"""
        errors = {}
        
        for param in query.parameters:
            value = parameters.get(param.name)
            
            # Check required parameters
            if value is None or value == "":
                if param.default is None:
                    errors[param.name] = f"Parameter '{param.name}' is required"
                continue
            
            # Type validation
            if param.type == "integer":
                try:
                    int_value = int(value)
                    if hasattr(param, 'min') and param.min is not None and int_value < param.min:
                        errors[param.name] = f"Value must be at least {param.min}"
                    if hasattr(param, 'max') and param.max is not None and int_value > param.max:
                        errors[param.name] = f"Value must be at most {param.max}"
                except (ValueError, TypeError):
                    errors[param.name] = "Must be a valid integer"
            
            elif param.type == "decimal":
                try:
                    float_value = float(value)
                    if hasattr(param, 'min') and param.min is not None and float_value < param.min:
                        errors[param.name] = f"Value must be at least {param.min}"
                    if hasattr(param, 'max') and param.max is not None and float_value > param.max:
                        errors[param.name] = f"Value must be at most {param.max}"
                except (ValueError, TypeError):
                    errors[param.name] = "Must be a valid number"
            
            elif param.type == "text":
                if hasattr(param, 'maxLength') and param.maxLength is not None:
                    if len(str(value)) > param.maxLength:
                        errors[param.name] = f"Text must be at most {param.maxLength} characters"
            
            elif param.type == "select":
                if hasattr(param, 'options') and param.options is not None:
                    if value not in param.options:
                        errors[param.name] = f"Must be one of: {', '.join(param.options)}"
        
        return errors
    
    def build_query_sql(self, query: PredefinedQuery, parameters: Dict[str, Any]) -> str:
        """Build the final SQL query by substituting parameters"""
        sql = query.sql
        
        # Apply default values for missing parameters
        final_params = {}
        for param in query.parameters:
            if param.name in parameters and parameters[param.name] is not None:
                final_params[param.name] = parameters[param.name]
            elif param.default is not None:
                final_params[param.name] = param.default
        
        # Simple parameter substitution (for predefined trusted queries only)
        # In production, consider using proper parameter binding
        try:
            return sql.format(**final_params)
        except KeyError as e:
            raise ValueError(f"Missing required parameter: {e}")
    
    async def execute_query(
        self, 
        environment: Environment, 
        table_name: str, 
        query_id: str, 
        parameters: Dict[str, Any]
    ) -> QueryResult:
        """Execute a predefined query with given parameters"""
        
        # Get the query definition
        query = self.get_query_by_id(table_name, query_id)
        if not query:
            raise ValueError(f"Query '{query_id}' not found for table '{table_name}'")
        
        # Validate parameters
        validation_errors = self.validate_parameters(query, parameters)
        if validation_errors:
            raise ValueError(f"Parameter validation failed: {validation_errors}")
        
        # Build the SQL
        sql = self.build_query_sql(query, parameters)
        
        # Execute the query
        SessionLocal = get_session_for_environment(environment)
        session = SessionLocal()
        try:
            result = session.execute(text(sql))
            
            # Convert result to list of dictionaries
            columns = list(result.keys()) if result.keys() else []
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            
            return QueryResult(
                query_id=query_id,
                query_name=query.name,
                columns=columns,
                rows=rows,
                row_count=len(rows),
                executed_sql=sql,
                parameters=parameters
            )
            
        except Exception as e:
            raise ValueError(f"Query execution failed: {str(e)}")
        finally:
            session.close()

# Global instance
query_service = QueryService()