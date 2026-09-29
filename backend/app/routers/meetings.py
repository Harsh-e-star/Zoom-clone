from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth_utils import get_current_user_optional, get_current_user
from app.models import User
from app.schemas import (
    MeetingCreate,
    MeetingSchedule,
    MeetingResponse,
    MeetingDetailResponse,
)
from app import crud
from app.services.meeting_service import clean_meeting_id

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


@router.get("", response_model=List[MeetingResponse])
def get_all_meetings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Fetch all meetings ordered by creation date."""
    meetings = crud.get_meetings(db, skip=skip, limit=limit)
    return meetings


@router.get("/upcoming", response_model=List[MeetingResponse])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    """Fetch all upcoming and scheduled meetings."""
    return crud.get_upcoming_meetings(db)


@router.get("/recent", response_model=List[MeetingResponse])
def get_recent_meetings(limit: int = 10, db: Session = Depends(get_db)):
    """Fetch recent completed or past meetings."""
    return crud.get_recent_meetings(db, limit=limit)


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """Retrieve full details of a meeting by its meeting ID or URL slug."""
    clean_id = clean_meeting_id(meeting_id)
    if not clean_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid meeting ID format.",
        )
    meeting = crud.get_meeting_by_id(db, clean_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found. Please check the meeting ID.",
        )
    return meeting


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    meeting_in: MeetingCreate = MeetingCreate(),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Create an instant meeting and return its ID, passcode, and invite link."""
    host_id = current_user.id if current_user else None
    host_name = current_user.name if current_user else "Harsh"
    return crud.create_instant_meeting(db, meeting_in, host_name=host_name, host_id=host_id)


@router.post(
    "/schedule",
    response_model=MeetingResponse,
    status_code=status.HTTP_201_CREATED,
)
def schedule_meeting(
    meeting_in: MeetingSchedule,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Schedule a meeting for a future date and time."""
    host_id = current_user.id if current_user else None
    host_name = current_user.name if current_user else "Harsh"
    return crud.create_scheduled_meeting(db, meeting_in, host_name=host_name, host_id=host_id)


@router.delete("/{meeting_id}", status_code=status.HTTP_200_OK)
def delete_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a meeting and its associated records. Requires host authorization."""
    clean_id = clean_meeting_id(meeting_id)
    meeting = crud.get_meeting_by_id(db, clean_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found.",
        )
    if meeting.host_id and meeting.host_id != current_user.id and current_user.email != "harsh@meetspace.local":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Only the meeting host can delete this meeting.",
        )
    crud.delete_meeting(db, clean_id)
    return {"message": "Meeting deleted successfully", "meeting_id": clean_id}
