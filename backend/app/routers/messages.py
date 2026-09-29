from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import MessageCreate, MessageResponse
from app import crud
from app.services.meeting_service import clean_meeting_id

router = APIRouter(prefix="/api/meetings/{meeting_id}/messages", tags=["messages"])


@router.get("", response_model=List[MessageResponse])
def get_meeting_messages(meeting_id: str, db: Session = Depends(get_db)):
    """Fetch chat history for a meeting."""
    clean_id = clean_meeting_id(meeting_id)
    meeting = crud.get_meeting_by_id(db, clean_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found.",
        )
    return crud.get_messages(db, clean_id)


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_meeting_message(
    meeting_id: str,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
):
    """Send a new message to the meeting chat."""
    clean_id = clean_meeting_id(meeting_id)
    meeting = crud.get_meeting_by_id(db, clean_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found.",
        )
    return crud.create_message(db, clean_id, message_in)
