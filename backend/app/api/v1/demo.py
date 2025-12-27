from fastapi import APIRouter
from backend.app.core.config import settings

router = APIRouter()

@router.get("/ping")
def ping():
    return {
        "message": "pong",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
