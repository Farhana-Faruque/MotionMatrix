from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.schemas.user import UserResponse, UserCreate
from backend.app.services.user_service import create_user, get_all_users_service
from backend.app.models.user import User  # Assuming you have a User model

router = APIRouter()


@router.get(
    '/users',
    response_model=List[UserResponse],  # Note: List wrapper for multiple users
    status_code=status.HTTP_200_OK,
)
def get_all_users(db: Session = Depends(get_db)):
    """
    Get all users.

    Returns a list of all registered users.
    """
    try:
        users = get_all_users_service(db)
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving users: {str(e)}"
        )