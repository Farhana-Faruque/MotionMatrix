from fastapi import Depends
from sqlalchemy.orm import Session
from pydantic.networks import EmailStr as emailstr
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token, decode_access_token
from backend.app.repositories.user_repo import UserRepository
from backend.app.schemas.token import TokenPayload, Token
from backend.app.core.exceptions import AuthenticationException

class AuthService :
    def login(self, email: emailstr, password: str, db: Session = Depends(get_db)) -> Token:
        userRepo = UserRepository();
        user = userRepo.get_by_email(db , email)

        if not user:
            raise AuthenticationException("Invalid email or password")
        hashed_password = user.hashed_password
        if not verify_password(password, hashed_password):
            raise AuthenticationException("Invalid email or password")
        
        access_token = create_access_token(data={"sub": user.email})

        return Token(access_token=access_token, token_type="bearer")


    # def validate_token(self, token: str) -> TokenPayload:
    #     payload = decode_access_token(token)
    #     if not payload:
    #         raise InvalidTokenError("Token is invalid or expired")
    #     #TokenPayload(payload, payload)
    #     return TokenPayload(**payload)