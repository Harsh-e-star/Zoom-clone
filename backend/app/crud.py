from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Meeting, Participant, Message
from app.schemas import (
    MeetingCreate,
    MeetingSchedule,
    ParticipantCreate,
    ParticipantUpdate,
    MessageCreate,
)
from app.services.meeting_service import (
    generate_meeting_id,
    clean_meeting_id,
    generate_passcode,
    build_invite_link,
)


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
) -> Meeting:
    # Ensure unique meeting ID
    meeting_id = generate_meeting_id()
    while db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first() is not None:
        meeting_id = generate_meeting_id()

    passcode = meeting_in.passcode or generate_passcode(6)
    invite_link = build_invite_link(meeting_id)

    db_meeting = Meeting(
        meeting_id=meeting_id,
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
        display_name=host_name,
        role="host",
        is_muted=False,
        is_camera_off=False,
        joined_at=datetime.utcnow(),
    )
    db.add(host_participant)

    # Add 2 realistic simulated participants so the meeting room is interactive right away
    guest1 = Participant(
        meeting_id=meeting_id,
        display_name="John Doe",
        role="participant",
        is_muted=False,
        is_camera_off=False,
        joined_at=datetime.utcnow(),
    )
    guest2 = Participant(
        meeting_id=meeting_id,
        display_name="Sarah Miller",
        role="participant",
        is_muted=True,
        is_camera_off=False,
        joined_at=datetime.utcnow(),
    )
    db.add_all([guest1, guest2])

    # Initial welcome messages in chat
    msg1 = Message(
        meeting_id=meeting_id,
        sender_name="MeetSpace System",
        sender_role="system",
        message="Welcome to the meeting! Meeting ID: " + meeting_id,
        created_at=datetime.utcnow(),
    )
    msg2 = Message(
        meeting_id=meeting_id,
        sender_name="John Doe",
        sender_role="participant",
        message="Hey Harsh, sound and video look great on my end!",
        created_at=datetime.utcnow(),
    )
    db.add_all([msg1, msg2])

    db.commit()
    db.refresh(db_meeting)
    return db_meeting


def create_scheduled_meeting(
    db: Session,
    meeting_in: MeetingSchedule,
    host_name: str = "Harsh",
) -> Meeting:
    meeting_id = generate_meeting_id()
    while db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first() is not None:
        meeting_id = generate_meeting_id()

    # Parse date and time: YYYY-MM-DD and HH:MM
    dt_str = f"{meeting_in.date} {meeting_in.time}"
    try:
        scheduled_dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
    except ValueError:
        scheduled_dt = datetime.utcnow() + timedelta(days=1)

    passcode = meeting_in.passcode or generate_passcode(6)
    invite_link = build_invite_link(meeting_id)

    db_meeting = Meeting(
        meeting_id=meeting_id,
        title=meeting_in.title,
        description=meeting_in.description,
        scheduled_at=scheduled_dt,
        duration_minutes=meeting_in.duration_minutes,
        invite_link=invite_link,
        status="scheduled",
        passcode=passcode,
        created_at=datetime.utcnow(),
    )
    db.add(db_meeting)
    db.flush()

    host_participant = Participant(
        meeting_id=meeting_id,
        display_name=host_name,
        role="host",
        is_muted=False,
        is_camera_off=False,
        joined_at=datetime.utcnow(),
    )
    db.add(host_participant)

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


def get_participants(db: Session, meeting_id: str) -> List[Participant]:
    clean_id = clean_meeting_id(meeting_id)
    return (
        db.query(Participant)
        .filter(Participant.meeting_id == clean_id)
        .filter(Participant.left_at.is_(None))
        .all()
    )


def add_participant(
    db: Session,
    meeting_id: str,
    part_in: ParticipantCreate,
) -> Participant:
    clean_id = clean_meeting_id(meeting_id)
    # Check if participant with same name already joined
    existing = (
        db.query(Participant)
        .filter(Participant.meeting_id == clean_id)
        .filter(Participant.display_name == part_in.display_name)
        .filter(Participant.left_at.is_(None))
        .first()
    )
    if existing:
        return existing

    participant = Participant(
        meeting_id=clean_id,
        display_name=part_in.display_name,
        role=part_in.role,
        is_muted=part_in.is_muted,
        is_camera_off=part_in.is_camera_off,
        joined_at=datetime.utcnow(),
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def update_participant(
    db: Session,
    meeting_id: str,
    participant_id: int,
    updates: ParticipantUpdate,
) -> Optional[Participant]:
    clean_id = clean_meeting_id(meeting_id)
    participant = (
        db.query(Participant)
        .filter(Participant.meeting_id == clean_id)
        .filter(Participant.id == participant_id)
        .first()
    )
    if not participant:
        return None

    if updates.is_muted is not None:
        participant.is_muted = updates.is_muted
    if updates.is_camera_off is not None:
        participant.is_camera_off = updates.is_camera_off
    if updates.role is not None:
        participant.role = updates.role

    db.commit()
    db.refresh(participant)
    return participant


def remove_participant(
    db: Session,
    meeting_id: str,
    participant_id: int,
) -> bool:
    clean_id = clean_meeting_id(meeting_id)
    participant = (
        db.query(Participant)
        .filter(Participant.meeting_id == clean_id)
        .filter(Participant.id == participant_id)
        .first()
    )
    if not participant:
        return False
    participant.left_at = datetime.utcnow()
    db.commit()
    return True


def mute_all_participants(db: Session, meeting_id: str) -> int:
    clean_id = clean_meeting_id(meeting_id)
    # Mute all except host
    count = (
        db.query(Participant)
        .filter(Participant.meeting_id == clean_id)
        .filter(Participant.role != "host")
        .filter(Participant.left_at.is_(None))
        .update({Participant.is_muted: True})
    )
    db.commit()
    return count


def get_messages(db: Session, meeting_id: str) -> List[Message]:
    clean_id = clean_meeting_id(meeting_id)
    return (
        db.query(Message)
        .filter(Message.meeting_id == clean_id)
        .order_by(Message.created_at.asc())
        .all()
    )


def create_message(
    db: Session,
    meeting_id: str,
    msg_in: MessageCreate,
) -> Message:
    clean_id = clean_meeting_id(meeting_id)
    msg = Message(
        meeting_id=clean_id,
        sender_name=msg_in.sender_name,
        sender_role=msg_in.sender_role,
        message=msg_in.message,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def seed_sample_data(db: Session):
    """
    Seeds initial realistic meetings if the database is currently empty.
    Uses dates relative to today so meetings always look fresh and realistic!
    """
    meeting_count = db.query(Meeting).count()
    if meeting_count > 0:
        return

    now = datetime.utcnow()

    # 1. Upcoming meetings
    sample_upcoming = [
        {
            "meeting_id": "8473921056",
            "title": "Team Standup & Sprint Sync",
            "description": "Daily standup to discuss blockers, PR reviews, and sprint delivery milestones.",
            "scheduled_at": now + timedelta(hours=2, minutes=30),
            "duration_minutes": 30,
            "status": "scheduled",
            "passcode": "392105",
        },
        {
            "meeting_id": "5124098731",
            "title": "DSA Study Session: Dynamic Programming",
            "description": "Deep dive into DP on trees, knapsack variants, and memoization patterns.",
            "scheduled_at": now + timedelta(days=1, hours=4),
            "duration_minutes": 60,
            "status": "scheduled",
            "passcode": "409873",
        },
        {
            "meeting_id": "7631849205",
            "title": "AI Project Architecture Review",
            "description": "Reviewing system architecture, latency budgets, and model inference pipelines.",
            "scheduled_at": now + timedelta(days=2, hours=1),
            "duration_minutes": 45,
            "status": "scheduled",
            "passcode": "184920",
        },
    ]

    # 2. Recent meetings
    sample_recent = [
        {
            "meeting_id": "6294810375",
            "title": "Fullstack Engineering Sync",
            "description": "Discussion on frontend caching, state synchronization, and DB indexing.",
            "scheduled_at": now - timedelta(days=1, hours=3),
            "duration_minutes": 45,
            "status": "completed",
            "passcode": "481037",
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
        {
            "meeting_id": "4105829371",
            "title": "Product Design Q3 Retro",
            "description": "Reviewing UX metrics, user feedback on navigation, and release retro.",
            "scheduled_at": now - timedelta(days=4),
            "duration_minutes": 50,
            "status": "completed",
            "passcode": "582937",
        },
    ]

    for item in sample_upcoming + sample_recent:
        meeting = Meeting(
            meeting_id=item["meeting_id"],
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

        # Add Host and simulated participants
        db.add(
            Participant(
                meeting_id=meeting.meeting_id,
                display_name="Harsh",
                role="host",
                is_muted=False,
                is_camera_off=False,
                joined_at=meeting.created_at,
            )
        )
        db.add(
            Participant(
                meeting_id=meeting.meeting_id,
                display_name="John Doe",
                role="participant",
                is_muted=False,
                is_camera_off=False,
                joined_at=meeting.created_at + timedelta(minutes=1),
            )
        )
        db.add(
            Participant(
                meeting_id=meeting.meeting_id,
                display_name="Sarah Miller",
                role="participant",
                is_muted=True,
                is_camera_off=False,
                joined_at=meeting.created_at + timedelta(minutes=2),
            )
        )

        # Add sample chat messages for recent meetings
        if item["status"] == "completed":
            db.add(
                Message(
                    meeting_id=meeting.meeting_id,
                    sender_name="John Doe",
                    sender_role="participant",
                    message="Great discussion everyone, slides are shared in Slack!",
                    created_at=meeting.scheduled_at + timedelta(minutes=25),
                )
            )

    db.commit()
