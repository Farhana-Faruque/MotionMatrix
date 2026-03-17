"""
Pydantic schemas for Attendance operations.
"""

from datetime import date, time, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AttendanceBase(BaseModel):
    worker_id: UUID = Field(..., description="Worker ID")
    date: date = Field(default_factory=date.today)
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    status: str = Field(default="PRESENT", description="PRESENT, ABSENT, ON_LEAVE, HALF_DAY, LATE")
    remarks: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    id: UUID
    recorded_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
