"""
Custom exception classes for consistent error handling.

This module provides a hierarchy of custom exceptions that map to HTTP status
codes and include structured error information for API responses.

Exception Hierarchy:
    MotionMatrixException (Base)
    ├── AuthenticationException (401)
    ├── AuthorizationException (403)
    ├── NotFoundException (404)
    ├── ValidationException (422)
    ├── DuplicateException (409)
    └── BusinessLogicException (400)

Example:
    from app.core.exceptions import NotFoundException
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException(
            message="User not found",
            details={"user_id": user_id}
        )
"""

import logging
from typing import Any, Dict, Optional

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Configure logging
logger = logging.getLogger(__name__)


# ============================================================================
# Base Exception Class
# ============================================================================

class MotionMatrixException(Exception):
    """
    Base exception class for all custom application exceptions.
    
    This serves as the parent class for all custom exceptions in the
    application. It provides a consistent structure for error information
    including status code, error code, message, and optional details.
    
    Attributes:
        status_code: HTTP status code (default: 500)
        error_code: Machine-readable error identifier
        message: Human-readable error message
        details: Optional dictionary with additional context
        
    Example:
        raise MotionMatrixException(
            status_code=400,
            error_code="INVALID_INPUT",
            message="The provided input is invalid",
            details={"field": "email", "value": "invalid"}
        )
    """
    
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_SERVER_ERROR",
        message: str = "An unexpected error occurred",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the exception.
        
        Args:
            status_code: HTTP status code for the error
            error_code: Machine-readable error code (UPPERCASE_SNAKE_CASE)
            message: Human-readable error message
            details: Optional dictionary with additional error context
        """
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details or {}
        
        # Call parent Exception constructor
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert exception to dictionary for JSON serialization.
        
        Returns:
            dict: Exception data as dictionary
            
        Example:
            >>> exc = MotionMatrixException(message="Error occurred")
            >>> exc.to_dict()
            {
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "Error occurred",
                "details": {}
            }
        """
        response = {
            "error_code": self.error_code,
            "message": self.message,
        }
        
        # Only include details if they exist
        if self.details:
            response["details"] = self.details
        
        return response
    
    def __str__(self) -> str:
        """String representation of the exception."""
        if self.details:
            return f"{self.error_code}: {self.message} (Details: {self.details})"
        return f"{self.error_code}: {self.message}"
    
    def __repr__(self) -> str:
        """Developer-friendly representation of the exception."""
        return (
            f"{self.__class__.__name__}("
            f"status_code={self.status_code}, "
            f"error_code='{self.error_code}', "
            f"message='{self.message}', "
            f"details={self.details})"
        )


# ============================================================================
# Authentication Exceptions (401 Unauthorized)
# ============================================================================

class AuthenticationException(MotionMatrixException):
    """
    Exception raised when authentication fails.
    
    Use this exception when:
    - User provides invalid credentials
    - JWT token is missing, invalid, or expired
    - Authentication token cannot be verified
    - Session has expired
    
    HTTP Status: 401 Unauthorized
    
    Example:
        # Invalid credentials
        raise AuthenticationException(
            message="Invalid email or password"
        )
        
        # Expired token
        raise AuthenticationException(
            error_code="TOKEN_EXPIRED",
            message="Your session has expired",
            details={"expired_at": "2024-01-15T10:30:00Z"}
        )
    """
    
    def __init__(
        self,
        message: str = "Authentication failed",
        error_code: str = "AUTHENTICATION_FAILED",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize authentication exception.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            details: Optional additional context
        """
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=error_code,
            message=message,
            details=details
        )


class InvalidCredentialsException(AuthenticationException):
    """Exception for invalid username/password."""
    
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(
            message=message,
            error_code="INVALID_CREDENTIALS"
        )


class TokenExpiredException(AuthenticationException):
    """Exception for expired authentication tokens."""
    
    def __init__(self, message: str = "Authentication token has expired"):
        super().__init__(
            message=message,
            error_code="TOKEN_EXPIRED"
        )


class InvalidTokenException(AuthenticationException):
    """Exception for invalid or malformed tokens."""
    
    def __init__(self, message: str = "Invalid authentication token"):
        super().__init__(
            message=message,
            error_code="INVALID_TOKEN"
        )


class MissingTokenException(AuthenticationException):
    """Exception for missing authentication token."""
    
    def __init__(self, message: str = "Authentication token is required"):
        super().__init__(
            message=message,
            error_code="MISSING_TOKEN"
        )


# ============================================================================
# Authorization Exceptions (403 Forbidden)
# ============================================================================

class AuthorizationException(MotionMatrixException):
    """
    Exception raised when user lacks required permissions.
    
    Use this exception when:
    - User is authenticated but doesn't have required role
    - User tries to access resources they don't own
    - User tries to perform actions above their permission level
    - Feature requires admin privileges
    
    HTTP Status: 403 Forbidden
    
    Example:
        # Insufficient role
        raise AuthorizationException(
            message="Admin privileges required",
            details={"required_role": "admin", "user_role": "employee"}
        )
        
        # Resource access denied
        raise AuthorizationException(
            error_code="RESOURCE_ACCESS_DENIED",
            message="You don't have permission to access this resource",
            details={"resource_id": 123, "resource_type": "report"}
        )
    """
    
    def __init__(
        self,
        message: str = "You don't have permission to perform this action",
        error_code: str = "AUTHORIZATION_FAILED",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize authorization exception.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            details: Optional additional context (e.g., required role)
        """
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=error_code,
            message=message,
            details=details
        )


class InsufficientPermissionsException(AuthorizationException):
    """Exception for insufficient permissions."""
    
    def __init__(
        self,
        required_role: Optional[str] = None,
        message: str = "Insufficient permissions"
    ):
        details = {"required_role": required_role} if required_role else None
        super().__init__(
            message=message,
            error_code="INSUFFICIENT_PERMISSIONS",
            details=details
        )


class ResourceAccessDeniedException(AuthorizationException):
    """Exception for denied resource access."""
    
    def __init__(
        self,
        resource_type: Optional[str] = None,
        message: str = "Access to this resource is denied"
    ):
        details = {"resource_type": resource_type} if resource_type else None
        super().__init__(
            message=message,
            error_code="RESOURCE_ACCESS_DENIED",
            details=details
        )


# ============================================================================
# Not Found Exceptions (404 Not Found)
# ============================================================================

class NotFoundException(MotionMatrixException):
    """
    Exception raised when a requested resource is not found.
    
    Use this exception when:
    - Database query returns no results
    - Requested ID doesn't exist
    - File or resource path doesn't exist
    - API endpoint doesn't exist (handled by FastAPI)
    
    HTTP Status: 404 Not Found
    
    Example:
        # User not found
        raise NotFoundException(
            message="User not found",
            details={"user_id": 123}
        )
        
        # Report not found
        raise NotFoundException(
            error_code="REPORT_NOT_FOUND",
            message="The requested report does not exist",
            details={"report_id": "monthly-2024-01"}
        )
    """
    
    def __init__(
        self,
        message: str = "Resource not found",
        error_code: str = "RESOURCE_NOT_FOUND",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize not found exception.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            details: Optional context (e.g., ID that wasn't found)
        """
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=error_code,
            message=message,
            details=details
        )


class UserNotFoundException(NotFoundException):
    """Exception for user not found."""
    
    def __init__(self, user_id: Optional[int] = None):
        details = {"user_id": user_id} if user_id else None
        super().__init__(
            message="User not found",
            error_code="USER_NOT_FOUND",
            details=details
        )


class DepartmentNotFoundException(NotFoundException):
    """Exception for department not found."""
    
    def __init__(self, department_id: Optional[int] = None):
        details = {"department_id": department_id} if department_id else None
        super().__init__(
            message="Department not found",
            error_code="DEPARTMENT_NOT_FOUND",
            details=details
        )


class AttendanceNotFoundException(NotFoundException):
    """Exception for attendance record not found."""
    
    def __init__(self, attendance_id: Optional[int] = None):
        details = {"attendance_id": attendance_id} if attendance_id else None
        super().__init__(
            message="Attendance record not found",
            error_code="ATTENDANCE_NOT_FOUND",
            details=details
        )


# ============================================================================
# Validation Exceptions (422 Unprocessable Entity)
# ============================================================================

class ValidationException(MotionMatrixException):
    """
    Exception raised when data validation fails.
    
    Use this exception when:
    - Required fields are missing
    - Field values are invalid or out of range
    - Data format is incorrect
    - Business validation rules fail
    
    HTTP Status: 422 Unprocessable Entity
    
    Example:
        # Invalid email format
        raise ValidationException(
            message="Invalid email format",
            details={"field": "email", "value": "notanemail"}
        )
        
        # Multiple validation errors
        raise ValidationException(
            error_code="MULTIPLE_VALIDATION_ERRORS",
            message="Multiple fields have validation errors",
            details={
                "errors": [
                    {"field": "email", "message": "Invalid format"},
                    {"field": "age", "message": "Must be >= 18"}
                ]
            }
        )
    """
    
    def __init__(
        self,
        message: str = "Validation failed",
        error_code: str = "VALIDATION_FAILED",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize validation exception.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            details: Validation error details (field, value, errors, etc.)
        """
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code=error_code,
            message=message,
            details=details
        )


class InvalidFieldException(ValidationException):
    """Exception for invalid field value."""
    
    def __init__(self, field: str, message: str = "Invalid field value"):
        super().__init__(
            message=message,
            error_code="INVALID_FIELD",
            details={"field": field}
        )


class MissingFieldException(ValidationException):
    """Exception for missing required field."""
    
    def __init__(self, field: str, message: str = "Required field is missing"):
        super().__init__(
            message=message,
            error_code="MISSING_FIELD",
            details={"field": field}
        )


class InvalidDateRangeException(ValidationException):
    """Exception for invalid date range."""
    
    def __init__(self, message: str = "Invalid date range"):
        super().__init__(
            message=message,
            error_code="INVALID_DATE_RANGE"
        )


# ============================================================================
# Duplicate/Conflict Exceptions (409 Conflict)
# ============================================================================

class DuplicateException(MotionMatrixException):
    """
    Exception raised when a unique constraint is violated.
    
    Use this exception when:
    - Email already exists in database
    - Username is already taken
    - Duplicate record creation attempted
    - Unique constraint violation occurs
    
    HTTP Status: 409 Conflict
    
    Example:
        # Email already exists
        raise DuplicateException(
            message="Email address already registered",
            details={"field": "email", "value": "user@example.com"}
        )
        
        # Username taken
        raise DuplicateException(
            error_code="USERNAME_TAKEN",
            message="This username is already in use",
            details={"username": "john_doe"}
        )
    """
    
    def __init__(
        self,
        message: str = "Resource already exists",
        error_code: str = "DUPLICATE_RESOURCE",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize duplicate exception.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            details: Context about the duplicate (field, value, etc.)
        """
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code=error_code,
            message=message,
            details=details
        )


class EmailAlreadyExistsException(DuplicateException):
    """Exception for duplicate email address."""
    
    def __init__(self, email: Optional[str] = None):
        details = {"email": email} if email else None
        super().__init__(
            message="Email address already registered",
            error_code="EMAIL_ALREADY_EXISTS",
            details=details
        )


class UsernameAlreadyExistsException(DuplicateException):
    """Exception for duplicate username."""
    
    def __init__(self, username: Optional[str] = None):
        details = {"username": username} if username else None
        super().__init__(
            message="Username already taken",
            error_code="USERNAME_ALREADY_EXISTS",
            details=details
        )


class AttendanceAlreadyExistsException(DuplicateException):
    """Exception for duplicate attendance record."""
    
    def __init__(self, date: Optional[str] = None):
        details = {"date": date} if date else None
        super().__init__(
            message="Attendance record already exists for this date",
            error_code="ATTENDANCE_ALREADY_EXISTS",
            details=details
        )


# ============================================================================
# Business Logic Exceptions (400 Bad Request)
# ============================================================================

class BusinessLogicException(MotionMatrixException):
    """
    Exception raised when business rules are violated.
    
    Use this exception when:
    - Operation violates business rules
    - Action is not allowed in current state
    - Prerequisites are not met
    - Logical constraint is violated
    
    HTTP Status: 400 Bad Request
    
    Example:
        # Cannot delete active user
        raise BusinessLogicException(
            error_code="CANNOT_DELETE_ACTIVE_USER",
            message="Cannot delete user with active sessions",
            details={"user_id": 123, "active_sessions": 3}
        )
        
        # Insufficient balance
        raise BusinessLogicException(
            error_code="INSUFFICIENT_BALANCE",
            message="Account balance too low for this operation",
            details={"required": 100.0, "available": 50.0}
        )
    """
    
    def __init__(
        self,
        message: str = "Business logic constraint violated",
        error_code: str = "BUSINESS_LOGIC_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize business logic exception.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            details: Context about the business rule violation
        """
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=error_code,
            message=message,
            details=details
        )


class AlreadyClockedInException(BusinessLogicException):
    """Exception for attempting to clock in when already clocked in."""
    
    def __init__(self, message: str = "Already clocked in for today"):
        super().__init__(
            message=message,
            error_code="ALREADY_CLOCKED_IN"
        )


class NotClockedInException(BusinessLogicException):
    """Exception for attempting to clock out when not clocked in."""
    
    def __init__(self, message: str = "Not clocked in yet"):
        super().__init__(
            message=message,
            error_code="NOT_CLOCKED_IN"
        )


class InvalidOperationException(BusinessLogicException):
    """Exception for invalid operation in current state."""
    
    def __init__(self, message: str = "Operation not allowed in current state"):
        super().__init__(
            message=message,
            error_code="INVALID_OPERATION"
        )


class QuotaExceededException(BusinessLogicException):
    """Exception for exceeded quota or limit."""
    
    def __init__(
        self,
        quota_type: str,
        limit: int,
        message: str = "Quota exceeded"
    ):
        super().__init__(
            message=message,
            error_code="QUOTA_EXCEEDED",
            details={"quota_type": quota_type, "limit": limit}
        )


# ============================================================================
# Exception Handlers for FastAPI
# ============================================================================

async def motion_matrix_exception_handler(
    request: Request,
    exc: MotionMatrixException
) -> JSONResponse:
    """
    Global exception handler for MotionMatrixException and subclasses.
    
    This handler catches all custom exceptions and returns a consistent
    JSON response format with appropriate HTTP status codes.
    
    Args:
        request: The FastAPI request object
        exc: The exception instance
        
    Returns:
        JSONResponse: Formatted error response
        
    Example:
        # In main.py
        app.add_exception_handler(
            MotionMatrixException,
            motion_matrix_exception_handler
        )
    """
    # Log the exception for debugging
    logger.warning(
        f"{exc.__class__.__name__}: {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    # Return JSON response
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """
    Handler for FastAPI/Pydantic validation errors.
    
    Converts Pydantic validation errors into our standard error format.
    
    Args:
        request: The FastAPI request object
        exc: The validation error
        
    Returns:
        JSONResponse: Formatted validation error response
        
    Example:
        # In main.py
        app.add_exception_handler(
            RequestValidationError,
            validation_exception_handler
        )
    """
    # Extract validation errors
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    # Log validation error
    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={"errors": errors}
    )
    
    # Return formatted response
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": {"errors": errors}
        }
    )


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
) -> JSONResponse:
    """
    Handler for standard HTTP exceptions.
    
    Converts standard HTTPException to our error format.
    
    Args:
        request: The FastAPI request object
        exc: The HTTP exception
        
    Returns:
        JSONResponse: Formatted error response
    """
    # Map status codes to error codes
    error_codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        500: "INTERNAL_SERVER_ERROR",
    }
    
    error_code = error_codes.get(exc.status_code, "HTTP_ERROR")
    
    logger.warning(
        f"HTTP {exc.status_code} on {request.method} {request.url.path}",
        extra={"detail": exc.detail}
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": error_code,
            "message": exc.detail
        }
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    Handler for unhandled exceptions.
    
    Catches any unexpected exceptions and returns a generic error response
    without exposing internal details to the client.
    
    Args:
        request: The FastAPI request object
        exc: The unhandled exception
        
    Returns:
        JSONResponse: Generic error response
    """
    # Log the full exception for debugging
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}",
        exc_info=exc,
        extra={"exception_type": type(exc).__name__}
    )
    
    # Return generic error (don't expose internal details)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred. Please try again later."
        }
    )


# ============================================================================
# Exception Handler Registration Helper
# ============================================================================

def register_exception_handlers(app) -> None:
    """
    Register all exception handlers with the FastAPI application.
    
    This helper function registers all custom exception handlers to ensure
    consistent error responses across the application.
    
    Args:
        app: FastAPI application instance
        
    Example:
        from fastapi import FastAPI
        from app.core.exceptions import register_exception_handlers
        
        app = FastAPI()
        register_exception_handlers(app)
    """
    # Custom exceptions
    app.add_exception_handler(
        MotionMatrixException,
        motion_matrix_exception_handler
    )
    
    # Validation errors
    app.add_exception_handler(
        RequestValidationError,
        validation_exception_handler
    )
    
    # HTTP exceptions
    app.add_exception_handler(
        StarletteHTTPException,
        http_exception_handler
    )
    
    # Catch-all for unhandled exceptions
    app.add_exception_handler(
        Exception,
        unhandled_exception_handler
    )
    
    logger.info("Exception handlers registered successfully")


# ============================================================================
# Module Initialization
# ============================================================================

logger.info("Exception handling module initialized")