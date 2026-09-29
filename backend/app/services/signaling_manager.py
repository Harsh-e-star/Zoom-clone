import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import WebSocket

logger = logging.getLogger("signaling")
logger.setLevel(logging.INFO)


class ParticipantConnection:
    def __init__(
        self,
        participant_id: str,
        user_id: Optional[int],
        display_name: str,
        role: str,
        websocket: WebSocket,
        is_muted: bool = False,
        camera_enabled: bool = True,
        is_host: bool = False,
    ):
        self.participant_id = participant_id
        self.user_id = user_id
        self.display_name = display_name
        self.role = role
        self.websocket = websocket
        self.is_muted = is_muted
        self.camera_enabled = camera_enabled
        self.is_host = is_host
        self.screen_sharing = False
        self.last_seen = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "participant_id": self.participant_id,
            "user_id": self.user_id,
            "display_name": self.display_name,
            "role": self.role,
            "is_muted": self.is_muted,
            "camera_enabled": self.camera_enabled,
            "is_host": self.is_host,
            "screen_sharing": self.screen_sharing,
            "joined_at": self.last_seen.isoformat(),
        }


class SignalingManager:
    """Manages active WebRTC signaling rooms and WebSocket connections."""

    def __init__(self):
        # meeting_id -> { participant_id: ParticipantConnection }
        self.rooms: Dict[str, Dict[str, ParticipantConnection]] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self,
        meeting_id: str,
        participant: ParticipantConnection,
    ) -> List[Dict[str, Any]]:
        """Register a new participant connection and return existing peers."""
        async with self._lock:
            if meeting_id not in self.rooms:
                self.rooms[meeting_id] = {}

            # Gather existing participants before adding newcomer
            existing_peers = [
                p.to_dict()
                for pid, p in self.rooms[meeting_id].items()
                if pid != participant.participant_id
            ]

            self.rooms[meeting_id][participant.participant_id] = participant
            logger.info(
                f"[Signaling] Participant {participant.display_name} ({participant.participant_id}) "
                f"joined room {meeting_id}. Room size: {len(self.rooms[meeting_id])}"
            )
            return existing_peers

    async def disconnect(self, meeting_id: str, participant_id: str) -> Optional[ParticipantConnection]:
        """Remove a participant connection and cleanup empty rooms."""
        async with self._lock:
            if meeting_id not in self.rooms:
                return None

            conn = self.rooms[meeting_id].pop(participant_id, None)
            if not self.rooms[meeting_id]:
                del self.rooms[meeting_id]
                logger.info(f"[Signaling] Room {meeting_id} is now empty and has been removed.")

            if conn:
                logger.info(
                    f"[Signaling] Participant {conn.display_name} ({participant_id}) left room {meeting_id}."
                )
            return conn

    async def get_participant(self, meeting_id: str, participant_id: str) -> Optional[ParticipantConnection]:
        async with self._lock:
            if meeting_id in self.rooms:
                return self.rooms[meeting_id].get(participant_id)
            return None

    async def get_room_participants(self, meeting_id: str) -> List[Dict[str, Any]]:
        async with self._lock:
            if meeting_id in self.rooms:
                return [p.to_dict() for p in self.rooms[meeting_id].values()]
            return []

    async def send_to_participant(self, meeting_id: str, target_id: str, message: Dict[str, Any]) -> bool:
        """Route message directly to a specific target participant."""
        async with self._lock:
            if meeting_id in self.rooms and target_id in self.rooms[meeting_id]:
                ws = self.rooms[meeting_id][target_id].websocket
                try:
                    await ws.send_text(json.dumps(message))
                    return True
                except Exception as e:
                    logger.warning(f"[Signaling] Failed to send message to {target_id}: {e}")
                    return False
            return False

    async def broadcast(
        self,
        meeting_id: str,
        message: Dict[str, Any],
        exclude_id: Optional[str] = None,
    ):
        """Broadcast message to all connected participants in the meeting."""
        async with self._lock:
            if meeting_id not in self.rooms:
                return
            recipients = [
                p for pid, p in self.rooms[meeting_id].items()
                if exclude_id is None or pid != exclude_id
            ]

        payload = json.dumps(message)
        for recipient in recipients:
            try:
                await recipient.websocket.send_text(payload)
            except Exception as e:
                logger.warning(
                    f"[Signaling] Broadcast delivery failed for {recipient.participant_id}: {e}"
                )

    async def update_state(
        self,
        meeting_id: str,
        participant_id: str,
        is_muted: Optional[bool] = None,
        camera_enabled: Optional[bool] = None,
        screen_sharing: Optional[bool] = None,
    ):
        """Update memory state for participant."""
        async with self._lock:
            if meeting_id in self.rooms and participant_id in self.rooms[meeting_id]:
                p = self.rooms[meeting_id][participant_id]
                if is_muted is not None:
                    p.is_muted = is_muted
                if camera_enabled is not None:
                    p.camera_enabled = camera_enabled
                if screen_sharing is not None:
                    p.screen_sharing = screen_sharing
                p.last_seen = datetime.utcnow()

    async def update_heartbeat(self, meeting_id: str, participant_id: str):
        async with self._lock:
            if meeting_id in self.rooms and participant_id in self.rooms[meeting_id]:
                self.rooms[meeting_id][participant_id].last_seen = datetime.utcnow()

    async def remove_stale_participants(self, max_idle_seconds: int = 30) -> List[tuple]:
        """Evict participants whose heartbeats have timed out."""
        now = datetime.utcnow()
        evicted = []
        async with self._lock:
            for meeting_id, room in list(self.rooms.items()):
                for pid, p in list(room.items()):
                    if (now - p.last_seen).total_seconds() > max_idle_seconds:
                        evicted.append((meeting_id, pid, p))
                        del room[pid]
                if not room:
                    del self.rooms[meeting_id]
        return evicted


signaling_manager = SignalingManager()
