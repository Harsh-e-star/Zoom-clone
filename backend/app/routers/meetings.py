from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
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
    db: Session = Depends(get_db),
):
    """Create an instant meeting and return its ID, passcode, and invite link."""
    return crud.create_instant_meeting(db, meeting_in, host_name="Harsh")


@router.post(
    "/schedule",
    response_model=MeetingResponse,
    status_code=status.HTTP_201_CREATED,
)
def schedule_meeting(
    meeting_in: MeetingSchedule,
    db: Session = Depends(get_db),
):
    """Schedule a meeting for a future date and time."""
    return crud.create_scheduled_meeting(db, meeting_in, host_name="Harsh")


@router.delete("/{meeting_id}", status_code=status.HTTP_200_OK)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """Delete a meeting and its associated records."""
    success = crud.delete_meeting(db, meeting_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found.",
        )
    return {"message": "Meeting deleted successfully", "meeting_id": meeting_id}
