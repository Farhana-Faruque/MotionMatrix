from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.schemas.user import UserLogin
from backend.app.schemas.token import Token, RefreshToken, TokenPayload
from backend.app.services.auth_service import auth_service_login, auth_service_validate_token

router = APIRouter()

@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
)
def login(
    user_in: UserLogin,
    db: Session = Depends(get_db),
):
    try:
        user = auth_service_login(user_in, db)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.post(
    "/refresh",
    response_model=TokenPayload,
    status_code=status.HTTP_201_CREATED,
)
def refresh(
    old_token: RefreshToken,
    db: Session = Depends(get_db),
):
    try:
        payload = auth_service_validate_token(old_token, db=db)
        return payload
        print(payload.role)
        return payload
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
