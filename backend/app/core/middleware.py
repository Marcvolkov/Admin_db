"""
Middleware for error handling, logging, and request processing.
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from app.core.exceptions import AdminDBException, to_http_exception

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and responses with timing"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())[:8]
        
        # Start timer
        start_time = time.time()
        
        # Log request
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} - "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )
        
        # Add request ID to request state
        request.state.request_id = request_id
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"[{request_id}] {response.status_code} - "
                f"Duration: {duration:.3f}s"
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"[{request_id}] Error: {str(e)} - "
                f"Duration: {duration:.3f}s"
            )
            raise


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware to handle exceptions and return structured error responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except AdminDBException as e:
            # Convert custom exceptions to HTTP exceptions
            http_exc = to_http_exception(e)
            return await self._create_error_response(request, http_exc)
        except HTTPException as e:
            # Handle FastAPI HTTP exceptions
            return await self._create_error_response(request, e)
        except Exception as e:
            # Handle unexpected exceptions
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            http_exc = HTTPException(
                status_code=500,
                detail={
                    "message": "Internal server error",
                    "code": "INTERNAL_ERROR",
                    "details": {}
                }
            )
            return await self._create_error_response(request, http_exc)
    
    async def _create_error_response(self, request: Request, exc: HTTPException) -> JSONResponse:
        """Create a structured error response"""
        
        # Get request ID if available
        request_id = getattr(request.state, 'request_id', 'unknown')
        
        # Structure error response
        error_response = {
            "error": True,
            "request_id": request_id,
            "status_code": exc.status_code,
        }
        
        # Handle different detail formats
        if isinstance(exc.detail, dict):
            error_response.update(exc.detail)
        else:
            error_response["message"] = str(exc.detail)
            error_response["code"] = "HTTP_ERROR"
            error_response["details"] = {}
        
        # Log error
        logger.error(
            f"[{request_id}] HTTP {exc.status_code}: {error_response.get('message', 'Unknown error')}"
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response
        )


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response