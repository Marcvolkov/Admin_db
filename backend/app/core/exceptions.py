"""
Custom exception classes for the Admin DB application.
These exceptions provide structured error handling with appropriate HTTP status codes.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException


class AdminDBException(Exception):
    """Base exception class for Admin DB application"""
    
    def __init__(
        self, 
        message: str, 
        code: str = "ADMIN_DB_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class DatabaseConnectionError(AdminDBException):
    """Raised when database connection fails"""
    
    def __init__(self, environment: str, original_error: Optional[str] = None):
        message = f"Failed to connect to {environment} database"
        if original_error:
            message += f": {original_error}"
        
        super().__init__(
            message=message,
            code="DATABASE_CONNECTION_ERROR",
            details={"environment": environment, "original_error": original_error}
        )


class TableNotFoundError(AdminDBException):
    """Raised when a table is not found"""
    
    def __init__(self, table_name: str, environment: str):
        super().__init__(
            message=f"Table '{table_name}' not found in {environment} environment",
            code="TABLE_NOT_FOUND",
            details={"table_name": table_name, "environment": environment}
        )


class RecordNotFoundError(AdminDBException):
    """Raised when a record is not found"""
    
    def __init__(self, table_name: str, record_id: Any):
        super().__init__(
            message=f"Record with ID '{record_id}' not found in table '{table_name}'",
            code="RECORD_NOT_FOUND",
            details={"table_name": table_name, "record_id": record_id}
        )


class ValidationError(AdminDBException):
    """Raised when data validation fails"""
    
    def __init__(self, field_errors: Dict[str, str]):
        message = "Validation failed"
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            details={"field_errors": field_errors}
        )


class PermissionDeniedError(AdminDBException):
    """Raised when user lacks required permissions"""
    
    def __init__(self, action: str, resource: Optional[str] = None):
        message = f"Permission denied for action: {action}"
        if resource:
            message += f" on resource: {resource}"
        
        super().__init__(
            message=message,
            code="PERMISSION_DENIED",
            details={"action": action, "resource": resource}
        )


class ChangeRequestError(AdminDBException):
    """Raised when change request operations fail"""
    
    def __init__(self, message: str, change_id: Optional[int] = None):
        super().__init__(
            message=message,
            code="CHANGE_REQUEST_ERROR",
            details={"change_id": change_id}
        )


class QueryExecutionError(AdminDBException):
    """Raised when query execution fails"""
    
    def __init__(self, query: str, error: str):
        super().__init__(
            message=f"Query execution failed: {error}",
            code="QUERY_EXECUTION_ERROR",
            details={"query": query, "error": error}
        )


class AuthenticationError(AdminDBException):
    """Raised when authentication fails"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR"
        )


class TokenExpiredError(AdminDBException):
    """Raised when JWT token is expired"""
    
    def __init__(self):
        super().__init__(
            message="Token has expired",
            code="TOKEN_EXPIRED"
        )


# HTTP Exception Factory Functions

def to_http_exception(exc: AdminDBException) -> HTTPException:
    """Convert AdminDBException to FastAPI HTTPException with appropriate status code"""
    
    status_code_map = {
        "DATABASE_CONNECTION_ERROR": 503,
        "TABLE_NOT_FOUND": 404,
        "RECORD_NOT_FOUND": 404,
        "VALIDATION_ERROR": 422,
        "PERMISSION_DENIED": 403,
        "CHANGE_REQUEST_ERROR": 400,
        "QUERY_EXECUTION_ERROR": 400,
        "AUTHENTICATION_ERROR": 401,
        "TOKEN_EXPIRED": 401,
    }
    
    status_code = status_code_map.get(exc.code, 500)
    
    detail = {
        "message": exc.message,
        "code": exc.code,
        "details": exc.details
    }
    
    return HTTPException(status_code=status_code, detail=detail)


def database_connection_error(environment: str, original_error: Optional[str] = None) -> HTTPException:
    """Factory function for database connection errors"""
    exc = DatabaseConnectionError(environment, original_error)
    return to_http_exception(exc)


def table_not_found_error(table_name: str, environment: str) -> HTTPException:
    """Factory function for table not found errors"""
    exc = TableNotFoundError(table_name, environment)
    return to_http_exception(exc)


def record_not_found_error(table_name: str, record_id: Any) -> HTTPException:
    """Factory function for record not found errors"""
    exc = RecordNotFoundError(table_name, record_id)
    return to_http_exception(exc)


def validation_error(field_errors: Dict[str, str]) -> HTTPException:
    """Factory function for validation errors"""
    exc = ValidationError(field_errors)
    return to_http_exception(exc)


def permission_denied_error(action: str, resource: Optional[str] = None) -> HTTPException:
    """Factory function for permission denied errors"""
    exc = PermissionDeniedError(action, resource)
    return to_http_exception(exc)


def change_request_error(message: str, change_id: Optional[int] = None) -> HTTPException:
    """Factory function for change request errors"""
    exc = ChangeRequestError(message, change_id)
    return to_http_exception(exc)


def query_execution_error(query: str, error: str) -> HTTPException:
    """Factory function for query execution errors"""
    exc = QueryExecutionError(query, error)
    return to_http_exception(exc)


def authentication_error(message: str = "Authentication failed") -> HTTPException:
    """Factory function for authentication errors"""
    exc = AuthenticationError(message)
    return to_http_exception(exc)


def token_expired_error() -> HTTPException:
    """Factory function for token expired errors"""
    exc = TokenExpiredError()
    return to_http_exception(exc)