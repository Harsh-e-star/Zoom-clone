from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    ParticipantCreate,
    ParticipantUpdate,
    ParticipantResponse,
)
from app import crud
from app.services.meeting_service import clean_meeting_id

router = APIRouter(prefix="/api/meetings/{meeting_id}", tags=["participants"])


@router.get("/participants", response_model=List[ParticipantResponse])
def get_meeting_participants(meeting_id: str, db: Session = Depends(get_db)):
    """Fetch all active participants in a meeting."""
    clean_id = clean_meeting_id(meeting_id)
    meeting = crud.get_meeting_by_id(db, clean_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found.",
        )
    return crud.get_participants(db, clean_id)


@router.post(
    "/participants",
    response_model=ParticipantResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_meeting_participant(
    meeting_id: str,
    participant_in: ParticipantCreate,
    db: Session = Depends(get_db),
):
    """Join a meeting as a participant."""
    clean_id = clean_meeting_id(meeting_id)
    meeting = crud.get_meeting_by_id(db, clean_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found. Please verify the meeting ID.",
        )
    return crud.add_participant(db, clean_id, participant_in)


@router.patch(
    "/participants/{participant_id}",
    response_model=ParticipantResponse,
)
def update_meeting_participant(
    meeting_id: str,
    participant_id: int,
    updates: ParticipantUpdate,
    db: Session = Depends(get_db),
):
    """Update participant state (e.g. mute/unmute audio or video)."""
    clean_id = clean_meeting_id(meeting_id)
    updated = crud.update_participant(db, clean_id, participant_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found.",
        )
    return updated


@router.delete(
    "/participants/{participant_id}",
    status_code=status.HTTP_200_OK,
)
def remove_meeting_participant(
    meeting_id: str,
    participant_id: int,
    db: Session = Depends(get_db),
):
    """Remove a participant from the meeting or handle participant leaving."""
    clean_id = clean_meeting_id(meeting_id)
    success = crud.remove_participant(db, clean_id, participant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found.",
        )
    return {"message": "Participant removed successfully."}


@router.post("/mute-all", status_code=status.HTTP_200_OK)
def mute_all_participants(meeting_id: str, db: Session = Depends(get_db)):
    """Host action to mute all participants in the meeting."""
    clean_id = clean_meeting_id(meeting_id)
    muted_count = crud.mute_all_participants(db, clean_id)
    return {
        "message": f"Successfully muted {muted_count} participant(s).",
        "muted_count": muted_count,
    }
