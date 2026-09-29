import os
import random
import re
from typing import Optional

BASE_FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def generate_meeting_id() -> str:
    """
    Generates a realistic 10-digit Zoom meeting ID.
    Example: '8473921056'
    """
    first_digit = str(random.randint(1, 9))
    remaining = "".join(str(random.randint(0, 9)) for _ in range(9))
    return f"{first_digit}{remaining}"


def format_meeting_id(meeting_id: str) -> str:
    """
    Formats a 10-digit meeting ID with friendly Zoom-style spaces:
    '8473921056' -> '847 392 1056'
    """
    clean = clean_meeting_id(meeting_id)
    if len(clean) == 10:
        return f"{clean[0:3]} {clean[3:6]} {clean[6:10]}"
    if len(clean) == 11:
        return f"{clean[0:3]} {clean[3:7]} {clean[7:11]}"
    return clean


def clean_meeting_id(input_value: str) -> str:
    """
    Extracts and normalizes the meeting ID from various user inputs:
    - '847 392 1056' -> '8473921056'
    - '847-392-1056' -> '8473921056'
    - 'http://localhost:3000/join/8473921056' -> '8473921056'
    - '/join/8473921056' -> '8473921056'
    """
    if not input_value:
        return ""
    
    val = input_value.strip()

    # If it's a URL or contains /join/
    match = re.search(r"/join/([0-9\s-]+)", val)
    if match:
        val = match.group(1)
    
    # Strip spaces, dashes, slashes
    clean = re.sub(r"[^0-9]", "", val)
    return clean


def generate_passcode(length: int = 6) -> str:
    """Generates a secure 6-character alphanumeric passcode."""
    chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz"
    return "".join(random.choice(chars) for _ in range(length))


def build_invite_link(meeting_id: str) -> str:
    """Generates the full browser invite link for a given meeting ID."""
    clean_id = clean_meeting_id(meeting_id)
    return f"{BASE_FRONTEND_URL}/join/{clean_id}"
