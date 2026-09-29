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


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(String(32), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    invite_link = Column(String(255), nullable=False)
    status = Column(String(50), default="scheduled", nullable=False)  # "scheduled", "active", "completed"
    passcode = Column(String(20), default="123456", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
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


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(
        String(32),
        ForeignKey("meetings.meeting_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    display_name = Column(String(100), nullable=False)
    role = Column(String(20), default="participant", nullable=False)  # "host", "participant"
    is_muted = Column(Boolean, default=False, nullable=False)
    is_camera_off = Column(Boolean, default=False, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)

    meeting = relationship("Meeting", back_populates="participants")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(
        String(32),
        ForeignKey("meetings.meeting_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    sender_name = Column(String(100), nullable=False)
    sender_role = Column(String(20), default="participant", nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="messages")
