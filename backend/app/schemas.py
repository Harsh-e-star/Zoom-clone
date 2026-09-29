from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# --- Auth & User Schemas ---
class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)


class UserSignup(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    timezone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None
    status: str = "Available"
    timezone: str = "UTC"
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=100)


# --- User Settings Schemas ---
class UserSettingsBase(BaseModel):
    audio_device: str = "default"
    video_device: str = "default"
    mute_on_join: bool = False
    video_off_on_join: bool = False
    theme: str = "light"
    notifications_enabled: bool = True


class UserSettingsUpdate(BaseModel):
    audio_device: Optional[str] = None
    video_device: Optional[str] = None
    mute_on_join: Optional[bool] = None
    video_off_on_join: Optional[bool] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None


class UserSettingsResponse(UserSettingsBase):
    id: int
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Participant Schemas ---
class ParticipantBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="participant")
    is_muted: bool = Field(default=False)
    is_camera_off: bool = Field(default=False)


class ParticipantCreate(ParticipantBase):
    user_id: Optional[int] = None


class ParticipantUpdate(BaseModel):
    is_muted: Optional[bool] = None
    is_camera_off: Optional[bool] = None
    role: Optional[str] = None


class ParticipantResponse(ParticipantBase):
    id: int
    meeting_id: str
    user_id: Optional[int] = None
    is_host: bool = False
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
    participant_id: Optional[int] = None


class MessageResponse(MessageBase):
    id: int
    meeting_id: str
    participant_id: Optional[int] = None
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


class MeetingSettingsResponse(BaseModel):
    waiting_room: bool = False
    allow_screen_share: bool = True
    mute_participants_on_entry: bool = False
    lock_meeting: bool = False

    class Config:
        from_attributes = True


class MeetingResponse(BaseModel):
    id: int
    meeting_id: str
    host_id: Optional[int] = None
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
    settings: Optional[MeetingSettingsResponse] = None
