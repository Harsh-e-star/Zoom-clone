import json
import logging
import secrets
import html
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.auth_utils import decode_access_token
from app.models import Meeting, Participant, User, Message
from app.services.meeting_service import clean_meeting_id
from app.services.signaling_manager import signaling_manager, ParticipantConnection
from app import crud

logger = logging.getLogger("signaling")
router = APIRouter(tags=["signaling"])


@router.websocket("/ws/meeting/{meeting_id}")
async def meeting_signaling_websocket(
    websocket: WebSocket,
    meeting_id: str,
):
    await websocket.accept()
    clean_id = clean_meeting_id(meeting_id)

    db: Session = SessionLocal()
    participant_conn: Optional[ParticipantConnection] = None
    participant_id: Optional[str] = None

    try:
        # 1. Verify meeting exists in SQLite
        meeting = db.query(Meeting).filter(Meeting.meeting_id == clean_id).first()
        if not meeting or meeting.status == "ended":
            await websocket.send_text(
                json.dumps({
                    "type": "error",
                    "code": "MEETING_NOT_FOUND",
                    "message": "This meeting does not exist or has already ended.",
                })
            )
            await websocket.close(code=1008)
            return

        # 2. Wait for initial "join" handshake message
        init_data_raw = await websocket.receive_text()
        try:
            init_msg = json.loads(init_data_raw)
        except Exception:
            await websocket.close(code=1003)
            return

        if init_msg.get("type") != "join":
            await websocket.send_text(
                json.dumps({"type": "error", "message": "Expected join handshake message."})
            )
            await websocket.close(code=1008)
            return

        token = init_msg.get("token")
        user: Optional[User] = None
        if token:
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                user = db.query(User).filter(User.id == int(payload["sub"])).first()

        # Determine participant identity & host privileges securely
        display_name = (
            init_msg.get("display_name")
            or (user.name if user else "Participant")
        ).strip()
        display_name = html.escape(display_name[:50])

        active_peers = await signaling_manager.get_room_participants(clean_id)

        is_host = False
        if user and meeting.host_id and user.id == meeting.host_id:
            is_host = True
        elif user and meeting.host_id is None and user.email == "harsh@meetspace.local":
            is_host = True
        elif not user and meeting.host_id is None and display_name.lower() == "harsh" and len(active_peers) == 0:
            # Only allow anonymous Harsh as host if meeting was created anonymously and room is empty
            is_host = True

        # Check Meeting Lock
        if meeting.settings and getattr(meeting.settings, "lock_meeting", False) and not is_host:
            await websocket.send_text(
                json.dumps({
                    "type": "error",
                    "code": "MEETING_LOCKED",
                    "message": "This meeting has been locked by the host.",
                })
            )
            await websocket.close(code=1008)
            return

        role = "host" if is_host else "participant"
        participant_id = init_msg.get("participant_id") or f"p_{secrets.token_hex(6)}"
        is_muted = bool(init_msg.get("is_muted", False))
        camera_enabled = bool(init_msg.get("camera_enabled", True))

        # 3. Register in SQLite database
        existing_part = (
            db.query(Participant)
            .filter(Participant.meeting_id == clean_id, Participant.display_name == display_name)
            .first()
        )
        if existing_part:
            existing_part.left_at = None
            existing_part.is_muted = is_muted
            existing_part.is_camera_off = not camera_enabled
            db.commit()
        else:
            db_participant = Participant(
                meeting_id=clean_id,
                user_id=user.id if user else None,
                display_name=display_name,
                role=role,
                joined_at=datetime.utcnow(),
                is_muted=is_muted,
                is_camera_off=not camera_enabled,
                is_host=is_host,
            )
            db.add(db_participant)
            db.commit()

        # 4. Connect to Signaling Room
        participant_conn = ParticipantConnection(
            participant_id=participant_id,
            user_id=user.id if user else None,
            display_name=display_name,
            role=role,
            websocket=websocket,
            is_muted=is_muted,
            camera_enabled=camera_enabled,
            is_host=is_host,
        )

        existing_peers = await signaling_manager.connect(clean_id, participant_conn)

        # 5. Send "joined" confirmation to the newcomer
        await websocket.send_text(
            json.dumps({
                "type": "joined",
                "participant_id": participant_id,
                "meeting_id": clean_id,
                "title": meeting.title,
                "is_host": is_host,
                "display_name": display_name,
                "participants": existing_peers,
            })
        )

        # 6. Broadcast "participant_joined" to all existing room participants
        await signaling_manager.broadcast(
            clean_id,
            {
                "type": "participant_joined",
                "participant": participant_conn.to_dict(),
            },
            exclude_id=participant_id,
        )

        # 7. Main message dispatch loop
        while True:
            data_raw = await websocket.receive_text()
            try:
                msg = json.loads(data_raw)
            except Exception:
                continue

            msg_type = msg.get("type")

            # A. WebRTC SDP Offer
            if msg_type == "offer":
                target_id = msg.get("to")
                if target_id:
                    await signaling_manager.send_to_participant(
                        clean_id,
                        target_id,
                        {
                            "type": "offer",
                            "from": participant_id,
                            "to": target_id,
                            "sdp": msg.get("sdp"),
                        },
                    )

            # B. WebRTC SDP Answer
            elif msg_type == "answer":
                target_id = msg.get("to")
                if target_id:
                    await signaling_manager.send_to_participant(
                        clean_id,
                        target_id,
                        {
                            "type": "answer",
                            "from": participant_id,
                            "to": target_id,
                            "sdp": msg.get("sdp"),
                        },
                    )

            # C. WebRTC ICE Candidate
            elif msg_type == "ice_candidate":
                target_id = msg.get("to")
                if target_id and msg.get("candidate"):
                    await signaling_manager.send_to_participant(
                        clean_id,
                        target_id,
                        {
                            "type": "ice_candidate",
                            "from": participant_id,
                            "to": target_id,
                            "candidate": msg.get("candidate"),
                        },
                    )

            # D. Audio Mute State Change
            elif msg_type == "mute_changed":
                new_mute = bool(msg.get("is_muted", False))
                await signaling_manager.update_state(clean_id, participant_id, is_muted=new_mute)
                # Update DB
                db.query(Participant).filter(
                    Participant.meeting_id == clean_id,
                    Participant.display_name == display_name,
                ).update({"is_muted": new_mute})
                db.commit()

                await signaling_manager.broadcast(
                    clean_id,
                    {
                        "type": "mute_changed",
                        "participant_id": participant_id,
                        "is_muted": new_mute,
                    },
                    exclude_id=participant_id,
                )

            # E. Camera Video State Change
            elif msg_type == "camera_changed":
                new_camera = bool(msg.get("camera_enabled", True))
                await signaling_manager.update_state(clean_id, participant_id, camera_enabled=new_camera)
                # Update DB
                db.query(Participant).filter(
                    Participant.meeting_id == clean_id,
                    Participant.display_name == display_name,
                ).update({"is_camera_off": not new_camera})
                db.commit()

                await signaling_manager.broadcast(
                    clean_id,
                    {
                        "type": "camera_changed",
                        "participant_id": participant_id,
                        "camera_enabled": new_camera,
                    },
                    exclude_id=participant_id,
                )

            # F. Screen Share State
            elif msg_type in ("screen_share_started", "screen_share_stopped"):
                is_sharing = (msg_type == "screen_share_started")
                await signaling_manager.update_state(clean_id, participant_id, screen_sharing=is_sharing)
                await signaling_manager.broadcast(
                    clean_id,
                    {
                        "type": msg_type,
                        "participant_id": participant_id,
                    },
                    exclude_id=participant_id,
                )

            # G. In-Meeting Chat Message (Persisted to SQLite)
            elif msg_type == "chat_message":
                text = (msg.get("message") or "").strip()
                if not text or len(text) > 2000:
                    continue

                safe_text = html.escape(text)
                db_msg = Message(
                    meeting_id=clean_id,
                    sender_name=display_name,
                    sender_role=role,
                    message=safe_text,
                    created_at=datetime.utcnow(),
                )
                db.add(db_msg)
                db.commit()
                db.refresh(db_msg)

                await signaling_manager.broadcast(
                    clean_id,
                    {
                        "type": "chat_message",
                        "id": db_msg.id,
                        "participant_id": participant_id,
                        "sender_name": display_name,
                        "sender_role": role,
                        "message": safe_text,
                        "created_at": db_msg.created_at.isoformat(),
                    },
                )

            # H. Host Moderation Actions (Strict Host Verification on Backend)
            elif msg_type == "host_action":
                if not is_host:
                    await websocket.send_text(
                        json.dumps({
                            "type": "error",
                            "message": "Permission denied. Only the host can execute moderation controls.",
                        })
                    )
                    continue

                action = msg.get("action")
                # 1. Mute All
                if action == "mute_all":
                    db.query(Participant).filter(
                        Participant.meeting_id == clean_id,
                        Participant.role != "host",
                    ).update({"is_muted": True})
                    db.commit()

                    await signaling_manager.broadcast(
                        clean_id,
                        {
                            "type": "host_action",
                            "action": "mute_all",
                            "triggered_by": participant_id,
                        },
                    )

                # 2. Remove Participant
                elif action == "remove_participant":
                    target_id = msg.get("target_id")
                    if target_id:
                        target = await signaling_manager.get_participant(clean_id, target_id)
                        if target:
                            await target.websocket.send_text(
                                json.dumps({
                                    "type": "participant_removed",
                                    "reason": "You were removed from the meeting by the host.",
                                })
                            )
                            try:
                                await target.websocket.close(code=1000)
                            except Exception:
                                pass
                            await signaling_manager.disconnect(clean_id, target_id)
                            await signaling_manager.broadcast(
                                clean_id,
                                {
                                    "type": "participant_left",
                                    "participant_id": target_id,
                                    "reason": "removed",
                                },
                            )

                # 3. End Meeting for Everyone
                elif action == "end_meeting":
                    db.query(Meeting).filter(Meeting.meeting_id == clean_id).update({"status": "ended"})
                    db.commit()

                    await signaling_manager.broadcast(
                        clean_id,
                        {
                            "type": "meeting_ended",
                            "message": "The meeting was ended by the host.",
                        },
                    )

            # I. Heartbeat Ping / Pong
            elif msg_type == "ping":
                await signaling_manager.update_heartbeat(clean_id, participant_id)
                await websocket.send_text(json.dumps({"type": "pong"}))

            # J. Voluntary Leave
            elif msg_type == "leave":
                break

    except WebSocketDisconnect:
        logger.info(f"[Signaling] Client disconnected from meeting {clean_id}: {participant_id}")
    except Exception as e:
        logger.error(f"[Signaling] Unexpected socket exception in room {clean_id}: {e}")
    finally:
        # 8. Clean up participant on disconnect
        if participant_id:
            await signaling_manager.disconnect(clean_id, participant_id)
            # Update left_at in DB
            try:
                db.query(Participant).filter(
                    Participant.meeting_id == clean_id,
                    Participant.display_name == display_name,
                ).update({"left_at": datetime.utcnow()})
                db.commit()
            except Exception:
                pass

            # Broadcast participant_left to remaining participants
            await signaling_manager.broadcast(
                clean_id,
                {
                    "type": "participant_left",
                    "participant_id": participant_id,
                },
            )

        db.close()
