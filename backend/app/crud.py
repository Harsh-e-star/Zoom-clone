import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
    Meeting,
    Participant,
    Message,
    User,
    UserSettings,
    PasswordResetToken,
    MeetingSettings,
)
from app.schemas import (
    MeetingCreate,
    MeetingSchedule,
    ParticipantCreate,
    ParticipantUpdate,
    MessageCreate,
    UserSignup,
    UserProfileUpdate,
    UserSettingsUpdate,
)
from app.auth_utils import hash_password, verify_password
from app.services.meeting_service import (
    generate_meeting_id,
    clean_meeting_id,
    generate_passcode,
    build_invite_link,
)


# --- User CRUD & Auth ---
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_in: UserSignup) -> User:
    hashed = hash_password(user_in.password)
    user = User(
        name=user_in.name.strip(),
        email=user_in.email.strip().lower(),
        password_hash=hashed,
        status="Available",
        timezone="UTC",
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    # Create default user settings
    settings = UserSettings(
        user_id=user.id,
        audio_device="default",
        video_device="default",
        mute_on_join=False,
        video_off_on_join=False,
        theme="light",
        notifications_enabled=True,
    )
    db.add(settings)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_user_profile(db: Session, user_id: int, profile_in: UserProfileUpdate) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    if profile_in.name is not None:
        user.name = profile_in.name.strip()
    if profile_in.status is not None:
        user.status = profile_in.status.strip()
    if profile_in.timezone is not None:
        user.timezone = profile_in.timezone.strip()
    if profile_in.avatar_url is not None:
        user.avatar_url = profile_in.avatar_url.strip()
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def get_or_create_user_settings(db: Session, user_id: int) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_user_settings(db: Session, user_id: int, settings_in: UserSettingsUpdate) -> UserSettings:
    settings = get_or_create_user_settings(db, user_id)
    if settings_in.audio_device is not None:
        settings.audio_device = settings_in.audio_device
    if settings_in.video_device is not None:
        settings.video_device = settings_in.video_device
    if settings_in.mute_on_join is not None:
        settings.mute_on_join = settings_in.mute_on_join
    if settings_in.video_off_on_join is not None:
        settings.video_off_on_join = settings_in.video_off_on_join
    if settings_in.theme is not None:
        settings.theme = settings_in.theme
    if settings_in.notifications_enabled is not None:
        settings.notifications_enabled = settings_in.notifications_enabled
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings


def create_password_reset_token(db: Session, email: str) -> Optional[str]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    token = secrets.token_urlsafe(32)
    reset_entry = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=1),
        used=False,
    )
    db.add(reset_entry)
    db.commit()
    return token


def reset_password_with_token(db: Session, token: str, new_password: str) -> bool:
    reset_entry = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == token, PasswordResetToken.used == False)
        .first()
    )
    if not reset_entry or reset_entry.expires_at < datetime.utcnow():
        return False
    user = get_user_by_id(db, reset_entry.user_id)
    if not user:
        return False
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    reset_entry.used = True
    db.commit()
    return True


# --- Meetings CRUD ---
def get_meetings(db: Session, skip: int = 0, limit: int = 100) -> List[Meeting]:
    return (
        db.query(Meeting)
        .order_by(Meeting.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_upcoming_meetings(db: Session) -> List[Meeting]:
    """Returns meetings scheduled in the future or with status 'scheduled'."""
    now = datetime.utcnow()
    return (
        db.query(Meeting)
        .filter(Meeting.status.in_(["scheduled", "active"]))
        .filter((Meeting.scheduled_at >= now - timedelta(hours=2)) | (Meeting.scheduled_at.is_(None)))
        .order_by(Meeting.scheduled_at.asc().nulls_last(), Meeting.created_at.desc())
        .all()
    )


def get_recent_meetings(db: Session, limit: int = 10) -> List[Meeting]:
    """Returns past or recently active meetings."""
    now = datetime.utcnow()
    return (
        db.query(Meeting)
        .filter((Meeting.status == "completed") | (Meeting.scheduled_at < now - timedelta(hours=2)))
        .order_by(Meeting.scheduled_at.desc().nulls_last(), Meeting.created_at.desc())
        .limit(limit)
        .all()
    )


def get_meeting_by_id(db: Session, meeting_id: str) -> Optional[Meeting]:
    clean_id = clean_meeting_id(meeting_id)
    return db.query(Meeting).filter(Meeting.meeting_id == clean_id).first()


def create_instant_meeting(
    db: Session,
    meeting_in: MeetingCreate,
    host_name: str = "Harsh",
    host_id: Optional[int] = None,
) -> Meeting:
    # Ensure unique meeting ID
    meeting_id = generate_meeting_id()
    while db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first() is not None:
        meeting_id = generate_meeting_id()

    passcode = meeting_in.passcode or generate_passcode(6)
    invite_link = build_invite_link(meeting_id)

    db_meeting = Meeting(
        meeting_id=meeting_id,
        host_id=host_id,
        title=meeting_in.title or "Instant Meeting",
        description=meeting_in.description,
        scheduled_at=datetime.utcnow(),
        duration_minutes=45,
        invite_link=invite_link,
        status="active",
        passcode=passcode,
        created_at=datetime.utcnow(),
    )
    db.add(db_meeting)
    db.flush()

    # Add host as primary participant
    host_participant = Participant(
        meeting_id=meeting_id,
        user_id=host_id,
        display_name=host_name,
        role="host",
        is_muted=False,
        is_camera_off=False,
        is_host=True,
        joined_at=datetime.utcnow(),
    )
    db.add(host_participant)

    # Add 2 realistic simulated participants so the meeting room is interactive
    guest1 = Participant(
        meeting_id=meeting_id,
        display_name="Rahul Sharma",
        role="participant",
        is_muted=True,
        is_camera_off=False,
        is_host=False,
        joined_at=datetime.utcnow() + timedelta(seconds=1),
    )
    guest2 = Participant(
        meeting_id=meeting_id,
        display_name="Priya Patel",
        role="participant",
        is_muted=False,
        is_camera_off=False,
        is_host=False,
        joined_at=datetime.utcnow() + timedelta(seconds=2),
    )
    db.add(guest1)
    db.add(guest2)

    # Add default meeting settings
    m_settings = MeetingSettings(
        meeting_id=meeting_id,
        waiting_room=False,
        allow_screen_share=True,
        mute_participants_on_entry=False,
        lock_meeting=False,
    )
    db.add(m_settings)

    # Initial system message
    system_msg = Message(
        meeting_id=meeting_id,
        sender_name="System",
        sender_role="system",
        message="Welcome to MeetSpace Workplace! Meeting is encrypted end-to-end.",
        created_at=datetime.utcnow(),
    )
    db.add(system_msg)

    db.commit()
    db.refresh(db_meeting)
    return db_meeting


def schedule_meeting(
    db: Session,
    schedule_in: MeetingSchedule,
    host_name: str = "Harsh",
    host_id: Optional[int] = None,
) -> Meeting:
    meeting_id = generate_meeting_id()
    while db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first() is not None:
        meeting_id = generate_meeting_id()

    # Parse ISO date and 24h time strings safely
    scheduled_datetime = datetime.strptime(
        f"{schedule_in.date} {schedule_in.time}", "%Y-%m-%d %H:%M"
    )

    passcode = schedule_in.passcode or generate_passcode(6)
    invite_link = build_invite_link(meeting_id)

    db_meeting = Meeting(
        meeting_id=meeting_id,
        host_id=host_id,
        title=schedule_in.title,
        description=schedule_in.description,
        scheduled_at=scheduled_datetime,
        duration_minutes=schedule_in.duration_minutes,
        invite_link=invite_link,
        status="scheduled",
        passcode=passcode,
        created_at=datetime.utcnow(),
    )
    db.add(db_meeting)
    db.flush()

    # Add host as pre-registered participant
    host_participant = Participant(
        meeting_id=meeting_id,
        user_id=host_id,
        display_name=host_name,
        role="host",
        is_muted=False,
        is_camera_off=False,
        is_host=True,
        joined_at=datetime.utcnow(),
    )
    db.add(host_participant)

    m_settings = MeetingSettings(
        meeting_id=meeting_id,
        waiting_room=False,
        allow_screen_share=True,
        mute_participants_on_entry=False,
        lock_meeting=False,
    )
    db.add(m_settings)

    db.commit()
    db.refresh(db_meeting)
    return db_meeting


def delete_meeting(db: Session, meeting_id: str) -> bool:
    clean_id = clean_meeting_id(meeting_id)
    meeting = db.query(Meeting).filter(Meeting.meeting_id == clean_id).first()
    if not meeting:
        return False
    db.delete(meeting)
    db.commit()
    return True


# --- Participant Management ---
def get_meeting_participants(db: Session, meeting_id: str) -> List[Participant]:
    clean_id = clean_meeting_id(meeting_id)
    return (
        db.query(Participant)
        .filter(Participant.meeting_id == clean_id)
        .order_by(Participant.joined_at.asc())
        .all()
    )


def add_participant_to_meeting(
    db: Session,
    meeting_id: str,
    participant_in: ParticipantCreate,
) -> Participant:
    clean_id = clean_meeting_id(meeting_id)
    new_p = Participant(
        meeting_id=clean_id,
        user_id=participant_in.user_id,
        display_name=participant_in.display_name.strip(),
        role=participant_in.role or "participant",
        is_muted=participant_in.is_muted,
        is_camera_off=participant_in.is_camera_off,
        is_host=(participant_in.role == "host"),
        joined_at=datetime.utcnow(),
    )
    db.add(new_p)

    sys_msg = Message(
        meeting_id=clean_id,
        sender_name="System",
        sender_role="system",
        message=f"{new_p.display_name} joined the meeting",
        created_at=datetime.utcnow(),
    )
    db.add(sys_msg)

    db.commit()
    db.refresh(new_p)
    return new_p


def update_participant(
    db: Session,
    meeting_id: str,
    participant_id: int,
    participant_in: ParticipantUpdate,
) -> Optional[Participant]:
    clean_id = clean_meeting_id(meeting_id)
    p = (
        db.query(Participant)
        .filter(Participant.id == participant_id, Participant.meeting_id == clean_id)
        .first()
    )
    if not p:
        return None

    if participant_in.is_muted is not None:
        p.is_muted = participant_in.is_muted
    if participant_in.is_camera_off is not None:
        p.is_camera_off = participant_in.is_camera_off
    if participant_in.role is not None:
        p.role = participant_in.role
        p.is_host = (participant_in.role == "host")

    db.commit()
    db.refresh(p)
    return p


def remove_participant(db: Session, meeting_id: str, participant_id: int) -> bool:
    clean_id = clean_meeting_id(meeting_id)
    p = (
        db.query(Participant)
        .filter(Participant.id == participant_id, Participant.meeting_id == clean_id)
        .first()
    )
    if not p:
        return False

    name = p.display_name
    db.delete(p)

    sys_msg = Message(
        meeting_id=clean_id,
        sender_name="System",
        sender_role="system",
        message=f"{name} left the meeting",
        created_at=datetime.utcnow(),
    )
    db.add(sys_msg)

    db.commit()
    return True


def mute_all_participants(db: Session, meeting_id: str) -> int:
    clean_id = clean_meeting_id(meeting_id)
    count = (
        db.query(Participant)
        .filter(
            Participant.meeting_id == clean_id,
            Participant.role != "host",
        )
        .update({"is_muted": True}, synchronize_session=False)
    )

    sys_msg = Message(
        meeting_id=clean_id,
        sender_name="System",
        sender_role="system",
        message="Host muted all participants",
        created_at=datetime.utcnow(),
    )
    db.add(sys_msg)

    db.commit()
    return count


# --- Chat Messages ---
def get_meeting_messages(db: Session, meeting_id: str) -> List[Message]:
    clean_id = clean_meeting_id(meeting_id)
    return (
        db.query(Message)
        .filter(Message.meeting_id == clean_id)
        .order_by(Message.created_at.asc())
        .all()
    )


def create_meeting_message(
    db: Session,
    meeting_id: str,
    message_in: MessageCreate,
) -> Message:
    clean_id = clean_meeting_id(meeting_id)
    msg = Message(
        meeting_id=clean_id,
        participant_id=message_in.participant_id,
        sender_name=message_in.sender_name.strip(),
        sender_role=message_in.sender_role or "participant",
        message=message_in.message.strip(),
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# --- Database Seeder ---
def seed_database_if_empty(db: Session):
    """Seed demo user (Harsh) and realistic Zoom meetings if database is fresh."""
    # 1. Seed Demo User
    demo_user = get_user_by_email(db, "harsh@meetspace.local")
    if not demo_user:
        demo_user = User(
            name="Harsh",
            email="harsh@meetspace.local",
            password_hash=hash_password("Harsh@12345"),
            status="Available",
            timezone="UTC",
            is_active=True,
            created_at=datetime.utcnow(),
        )
        db.add(demo_user)
        db.flush()

        demo_settings = UserSettings(
            user_id=demo_user.id,
            audio_device="default",
            video_device="default",
            mute_on_join=False,
            video_off_on_join=False,
            theme="light",
            notifications_enabled=True,
        )
        db.add(demo_settings)
        db.commit()
        db.refresh(demo_user)

    # 1b. Seed Second Test User (Requirement 66)
    second_user = get_user_by_email(db, "testuser@meetspace.local")
    if not second_user:
        second_user = User(
            name="Test User",
            email="testuser@meetspace.local",
            password_hash=hash_password("Test@12345"),
            status="Available",
            timezone="UTC",
            is_active=True,
            created_at=datetime.utcnow(),
        )
        db.add(second_user)
        db.flush()

        second_settings = UserSettings(
            user_id=second_user.id,
            audio_device="default",
            video_device="default",
            mute_on_join=False,
            video_off_on_join=False,
            theme="light",
            notifications_enabled=True,
        )
        db.add(second_settings)
        db.commit()

    # 2. Seed Meetings if empty
    existing_count = db.query(Meeting).count()
    if existing_count > 0:
        return

    now = datetime.utcnow()

    # Exact realistic meetings required in Requirement 58:
    # Engineering Sync, AI Project Review, Team Standup, Product Design Discussion, DSA Study Session
    sample_upcoming = [
        {
            "meeting_id": "8473921056",
            "title": "Team Standup",
            "description": "Daily standup to discuss blockers, PR reviews, and sprint delivery milestones.",
            "scheduled_at": now + timedelta(hours=1),
            "duration_minutes": 30,
            "status": "scheduled",
            "passcode": "392105",
        },
        {
            "meeting_id": "5124098731",
            "title": "Engineering Sync",
            "description": "Cross-functional engineering sync on distributed systems and API latency budgets.",
            "scheduled_at": now + timedelta(days=1, hours=2),
            "duration_minutes": 45,
            "status": "scheduled",
            "passcode": "409873",
        },
        {
            "meeting_id": "7631849205",
            "title": "AI Project Review",
            "description": "Architecture review of LLM inference pipelines, token streaming, and latency optimizations.",
            "scheduled_at": now + timedelta(days=2, hours=3),
            "duration_minutes": 60,
            "status": "scheduled",
            "passcode": "184920",
        },
        {
            "meeting_id": "9283741029",
            "title": "Product Design Discussion",
            "description": "Reviewing 2026 Zoom Workplace layout parity, user flow feedback, and design tokens.",
            "scheduled_at": now + timedelta(days=3, hours=1),
            "duration_minutes": 45,
            "status": "scheduled",
            "passcode": "283741",
        },
        {
            "meeting_id": "6192834710",
            "title": "DSA Study Session",
            "description": "Deep dive into dynamic programming on trees, graphs, and system design trade-offs.",
            "scheduled_at": now + timedelta(days=4, hours=4),
            "duration_minutes": 60,
            "status": "scheduled",
            "passcode": "192834",
        },
    ]

    sample_recent = [
        {
            "meeting_id": "3814052603",
            "title": "Q3 Architecture Planning",
            "description": "Quarterly planning for cloud infrastructure, autoscaling, and database migrations.",
            "scheduled_at": now - timedelta(days=1, hours=3),
            "duration_minutes": 45,
            "status": "completed",
            "passcode": "405260",
        },
        {
            "meeting_id": "9382014765",
            "title": "Weekly 1-on-1 Mentorship",
            "description": "Career growth alignment, design doc feedback, and goal tracking.",
            "scheduled_at": now - timedelta(days=2, hours=5),
            "duration_minutes": 30,
            "status": "completed",
            "passcode": "201476",
        },
    ]

    for item in sample_upcoming + sample_recent:
        meeting = Meeting(
            meeting_id=item["meeting_id"],
            host_id=demo_user.id,
            title=item["title"],
            description=item["description"],
            scheduled_at=item["scheduled_at"],
            duration_minutes=item["duration_minutes"],
            invite_link=build_invite_link(item["meeting_id"]),
            status=item["status"],
            passcode=item["passcode"],
            created_at=item["scheduled_at"] - timedelta(days=1),
        )
        db.add(meeting)
        db.flush()

        db.add(
            Participant(
                meeting_id=meeting.meeting_id,
                user_id=demo_user.id,
                display_name="Harsh",
                role="host",
                is_muted=False,
                is_camera_off=False,
                is_host=True,
                joined_at=meeting.created_at,
            )
        )
        db.add(
            Participant(
                meeting_id=meeting.meeting_id,
                display_name="Rahul Sharma",
                role="participant",
                is_muted=True,
                is_camera_off=False,
                is_host=False,
                joined_at=meeting.created_at + timedelta(minutes=1),
            )
        )
        db.add(
            Participant(
                meeting_id=meeting.meeting_id,
                display_name="Priya Patel",
                role="participant",
                is_muted=False,
                is_camera_off=False,
                is_host=False,
                joined_at=meeting.created_at + timedelta(minutes=2),
            )
        )

        db.add(
            MeetingSettings(
                meeting_id=meeting.meeting_id,
                waiting_room=False,
                allow_screen_share=True,
                mute_participants_on_entry=False,
                lock_meeting=False,
            )
        )

        if item["status"] == "completed":
            db.add(
                Message(
                    meeting_id=meeting.meeting_id,
                    sender_name="Rahul Sharma",
                    sender_role="participant",
                    message="Great meeting everyone, the design specifications look crystal clear!",
                    created_at=meeting.scheduled_at + timedelta(minutes=20),
                )
            )

    db.commit()


# Backward compatibility alias
seed_sample_data = seed_database_if_empty
create_scheduled_meeting = schedule_meeting
get_participants = get_meeting_participants
add_participant = add_participant_to_meeting
get_messages = get_meeting_messages
create_message = create_meeting_message
