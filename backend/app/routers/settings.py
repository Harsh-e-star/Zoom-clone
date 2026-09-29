from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth_utils import get_current_user_optional, get_current_user
from app.models import User
from app.schemas import UserSettingsResponse, UserSettingsUpdate
from app import crud

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=UserSettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Retrieve user settings. Falls back to default Harsh user if unauthenticated in dev."""
    user_id = current_user.id if current_user else 1
    settings = crud.get_or_create_user_settings(db, user_id)
    return UserSettingsResponse.model_validate(settings)


@router.put("", response_model=UserSettingsResponse)
def update_settings(
    settings_in: UserSettingsUpdate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Update settings for the current user and persist in SQLite."""
    user_id = current_user.id if current_user else 1
    updated = crud.update_user_settings(db, user_id, settings_in)
    return UserSettingsResponse.model_validate(updated)
