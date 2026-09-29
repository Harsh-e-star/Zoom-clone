from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# --- Participant Schemas ---
class ParticipantBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="participant")
    is_muted: bool = Field(default=False)
    is_camera_off: bool = Field(default=False)


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantUpdate(BaseModel):
    is_muted: Optional[bool] = None
    is_camera_off: Optional[bool] = None
    role: Optional[str] = None


class ParticipantResponse(ParticipantBase):
    id: int
    meeting_id: str
    joined_at: datetime
    left_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Message Schemas ---
class MessageBase(BaseModel):
    sender_name: str = Field(..., min_length=1, max_length=100)
    sender_role: str = Field(default="participant")
    message: str = Field(..., min_length=1, max_length=2000)


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: int
    meeting_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Meeting Schemas ---
class MeetingBase(BaseModel):
    title: str = Field(default="Instant Meeting", min_length=1, max_length=255)
    description: Optional[str] = None


class MeetingCreate(MeetingBase):
    passcode: Optional[str] = Field(default=None, max_length=20)


class MeetingSchedule(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    time: str = Field(..., description="Time formatted as HH:MM (24h)")
    duration_minutes: int = Field(default=30, gt=0, le=1440, description="Duration in minutes (1 - 1440)")
    passcode: Optional[str] = Field(default=None, max_length=20)

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Duration must be a positive integer")
        return v


class MeetingResponse(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: int
    invite_link: str
    status: str
    passcode: str
    created_at: datetime
    participant_count: Optional[int] = 0

    class Config:
        from_attributes = True


class MeetingDetailResponse(MeetingResponse):
    participants: List[ParticipantResponse] = []
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True
