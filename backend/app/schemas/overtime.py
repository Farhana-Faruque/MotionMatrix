"""
Pydantic schemas for Overtime operations.
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class OvertimeBase(BaseModel):
    worker_id: UUID
    date: date = Field(default_factory=date.today)
    hours: float = Field(..., gt=0, le=12)
    reason: Optional[str] = None


class OvertimeCreate(OvertimeBase):
    pass


class OvertimeUpdate(BaseModel):
    hours: Optional[float] = Field(None, gt=0, le=12)
    reason: Optional[str] = None
    status: Optional[str] = Field(None, description="PENDING, APPROVED, REJECTED")


class OvertimeResponse(OvertimeBase):
    id: UUID
    status: str
    approved_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
