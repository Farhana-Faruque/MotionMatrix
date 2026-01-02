from fastapi import Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_refresh_token, decode_access_token
from backend.app.repositories.user_repo import UserRepository
from backend.app.schemas.token import TokenPayload, Token, RefreshToken
from backend.app.core.exceptions import AuthenticationException, InvalidTokenException, BusinessLogicException
from backend.app.schemas.user import UserLogin
from backend.app.utils.enums import UserRole

def auth_service_login(user_login: UserLogin, db: Session = Depends(get_db)) -> Token:
    user_repo = UserRepository()
    user = user_repo.get_by_email(user_login.email, db)

    if not user:
        raise AuthenticationException("Invalid email or password")
    hashed_password = user.hashed_password
    if not verify_password(user_login.password, hashed_password):
        raise AuthenticationException("Invalid email or password")

    access_token = create_refresh_token(data={"sub": user.email})

    return Token(access_token=access_token, token_type="bearer")


def auth_service_validate_token(token: RefreshToken, db: Session = Depends(get_db)) -> TokenPayload:
    payload = decode_access_token(token.refresh_token)
    if not payload:
        raise InvalidTokenException("Token is invalid or expired")

    dt = datetime.fromtimestamp(int(payload['exp'])) + timedelta(days=7)    # exp date increased 7 days

    user_email = payload['sub']
    user_repo = UserRepository()
    user = user_repo.get_by_email(email=user_email, db=db)
    token = TokenPayload(sub=user.id, role=UserRole(user.role), email=user.email, exp=dt)

    return token
