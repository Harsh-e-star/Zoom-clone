from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    status = Column(String(50), default="Available", nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    meetings = relationship("Meeting", back_populates="host")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(String(32), unique=True, index=True, nullable=False)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    invite_link = Column(String(255), nullable=False)
    status = Column(String(50), default="scheduled", nullable=False)  # "scheduled", "active", "completed"
    passcode = Column(String(20), default="123456", nullable=False)
    passcode_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    host = relationship("User", back_populates="meetings")
    participants = relationship(
        "Participant",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="Participant.joined_at",
    )
    messages = relationship(
        "Message",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )
    settings = relationship(
        "MeetingSettings",
        back_populates="meeting",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(
        String(32),
        ForeignKey("meetings.meeting_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    display_name = Column(String(100), nullable=False)
    role = Column(String(20), default="participant", nullable=False)  # "host", "participant"
    is_muted = Column(Boolean, default=False, nullable=False)
    is_camera_off = Column(Boolean, default=False, nullable=False)
    is_host = Column(Boolean, default=False, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)

    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User")


# Alias for meeting_participants as specified in requirement 41
MeetingParticipant = Participant


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(
        String(32),
        ForeignKey("meetings.meeting_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    participant_id = Column(Integer, nullable=True)
    sender_name = Column(String(100), nullable=False)
    sender_role = Column(String(20), default="participant", nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="messages")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    audio_device = Column(String(100), default="default", nullable=False)
    video_device = Column(String(100), default="default", nullable=False)
    mute_on_join = Column(Boolean, default=False, nullable=False)
    video_off_on_join = Column(Boolean, default=False, nullable=False)
    theme = Column(String(20), default="light", nullable=False)
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="settings")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="reset_tokens")


class MeetingSettings(Base):
    __tablename__ = "meeting_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(
        String(32),
        ForeignKey("meetings.meeting_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    waiting_room = Column(Boolean, default=False, nullable=False)
    allow_screen_share = Column(Boolean, default=True, nullable=False)
    mute_participants_on_entry = Column(Boolean, default=False, nullable=False)
    lock_meeting = Column(Boolean, default=False, nullable=False)

    meeting = relationship("Meeting", back_populates="settings")
