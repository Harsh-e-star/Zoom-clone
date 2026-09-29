"""
Comprehensive WebSocket Signaling & Authentication Test Suite
Tests WebRTC signaling protocol, offer/answer/ICE exchange, mute/camera updates,
chat persistence, and host moderation actions.
"""

import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Meeting, Participant, Message, User
from app.auth_utils import hash_password, create_access_token


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_auth_and_signup_flow(client):
    """TEST: Signup, Duplicate Signup rejection, Login, and Invalid Login."""
    # 1. Successful Signup
    unique_email = f"engineer_{secrets_hex()}@meetspace.local"
    signup_res = client.post(
        "/api/auth/signup",
        json={
            "name": "Alex Mercer",
            "email": unique_email,
            "password": "Password@123",
        },
    )
    assert signup_res.status_code == 201
    signup_data = signup_res.json()
    assert "access_token" in signup_data
    assert signup_data["user"]["name"] == "Alex Mercer"

    # 2. Duplicate Signup rejection
    dup_res = client.post(
        "/api/auth/signup",
        json={
            "name": "Alex Mercer",
            "email": unique_email,
            "password": "Password@123",
        },
    )
    assert dup_res.status_code == 409
    assert "already exists" in dup_res.json()["detail"].lower()

    # 3. Invalid Login (wrong password)
    wrong_login = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "WrongPassword"},
    )
    assert wrong_login.status_code == 401

    # 4. Valid Login
    login_res = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "Password@123"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


def test_websocket_signaling_full_mesh(client):
    """TEST: Real WebSocket Signaling for two clients (Harsh and Test User) in a room."""
    # 1. Create a meeting via REST API
    create_res = client.post(
        "/api/meetings",
        json={"title": "WebRTC Mesh Signaling Integration Test"},
    )
    assert create_res.status_code == 201
    meeting_data = create_res.json()
    meeting_id = meeting_data["meeting_id"]

    # 2. Client A (Harsh - Host) connects
    with client.websocket_connect(f"/ws/meeting/{meeting_id}") as ws_a:
        # Send join handshake
        ws_a.send_text(
            json.dumps({
                "type": "join",
                "participant_id": "p_harsh_1",
                "display_name": "Harsh",
                "is_muted": False,
                "camera_enabled": True,
            })
        )

        joined_a = json.loads(ws_a.receive_text())
        assert joined_a["type"] == "joined"
        assert joined_a["participant_id"] == "p_harsh_1"
        assert joined_a["is_host"] is True
        assert len(joined_a["participants"]) == 0

        # 3. Client B (Test User) connects to same room
        with client.websocket_connect(f"/ws/meeting/{meeting_id}") as ws_b:
            ws_b.send_text(
                json.dumps({
                    "type": "join",
                    "participant_id": "p_test_2",
                    "display_name": "Test User",
                    "is_muted": True,
                    "camera_enabled": False,
                })
            )

            # Client B gets 'joined' message listing Client A as existing peer
            joined_b = json.loads(ws_b.receive_text())
            assert joined_b["type"] == "joined"
            assert joined_b["participant_id"] == "p_test_2"
            assert joined_b["is_host"] is False
            assert len(joined_b["participants"]) == 1
            assert joined_b["participants"][0]["participant_id"] == "p_harsh_1"

            # Client A gets 'participant_joined' notification about Client B
            part_joined_a = json.loads(ws_a.receive_text())
            assert part_joined_a["type"] == "participant_joined"
            assert part_joined_a["participant"]["participant_id"] == "p_test_2"
            assert part_joined_a["participant"]["display_name"] == "Test User"

            # 4. WebRTC SDP Offer exchange: B sends offer to A
            fake_offer_sdp = {"type": "offer", "sdp": "v=0\r\no=- 123 2 IN IP4 127.0.0.1..."}
            ws_b.send_text(
                json.dumps({
                    "type": "offer",
                    "from": "p_test_2",
                    "to": "p_harsh_1",
                    "sdp": fake_offer_sdp,
                })
            )

            # Client A receives offer from B
            recv_offer_a = json.loads(ws_a.receive_text())
            assert recv_offer_a["type"] == "offer"
            assert recv_offer_a["from"] == "p_test_2"
            assert recv_offer_a["sdp"] == fake_offer_sdp

            # 5. WebRTC SDP Answer exchange: A replies with answer to B
            fake_answer_sdp = {"type": "answer", "sdp": "v=0\r\no=- 456 2 IN IP4 127.0.0.1..."}
            ws_a.send_text(
                json.dumps({
                    "type": "answer",
                    "from": "p_harsh_1",
                    "to": "p_test_2",
                    "sdp": fake_answer_sdp,
                })
            )

            # Client B receives answer from A
            recv_answer_b = json.loads(ws_b.receive_text())
            assert recv_answer_b["type"] == "answer"
            assert recv_answer_b["from"] == "p_harsh_1"
            assert recv_answer_b["sdp"] == fake_answer_sdp

            # 6. ICE Candidate exchange: B sends candidate to A
            fake_candidate = {"candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 5000 typ host"}
            ws_b.send_text(
                json.dumps({
                    "type": "ice_candidate",
                    "from": "p_test_2",
                    "to": "p_harsh_1",
                    "candidate": fake_candidate,
                })
            )

            recv_ice_a = json.loads(ws_a.receive_text())
            assert recv_ice_a["type"] == "ice_candidate"
            assert recv_ice_a["from"] == "p_test_2"
            assert recv_ice_a["candidate"] == fake_candidate

            # 7. Mute State Change: B mutes mic
            ws_b.send_text(
                json.dumps({
                    "type": "mute_changed",
                    "participant_id": "p_test_2",
                    "is_muted": True,
                })
            )

            recv_mute_a = json.loads(ws_a.receive_text())
            assert recv_mute_a["type"] == "mute_changed"
            assert recv_mute_a["participant_id"] == "p_test_2"
            assert recv_mute_a["is_muted"] is True

            # 8. Camera State Change: A enables camera
            ws_a.send_text(
                json.dumps({
                    "type": "camera_changed",
                    "participant_id": "p_harsh_1",
                    "camera_enabled": True,
                })
            )

            recv_cam_b = json.loads(ws_b.receive_text())
            assert recv_cam_b["type"] == "camera_changed"
            assert recv_cam_b["participant_id"] == "p_harsh_1"
            assert recv_cam_b["camera_enabled"] is True

            # 9. In-Meeting Chat: A sends message to room
            ws_a.send_text(
                json.dumps({
                    "type": "chat_message",
                    "message": "Hello from Harsh! WebRTC is live.",
                })
            )

            # Both A and B receive the chat broadcast
            chat_b = json.loads(ws_b.receive_text())
            assert chat_b["type"] == "chat_message"
            assert chat_b["sender_name"] == "Harsh"
            assert "Hello from Harsh" in chat_b["message"]

            chat_a = json.loads(ws_a.receive_text())
            assert chat_a["type"] == "chat_message"
            assert chat_a["sender_name"] == "Harsh"

            # 10. Ping / Pong Heartbeat
            ws_b.send_text(json.dumps({"type": "ping"}))
            pong_b = json.loads(ws_b.receive_text())
            assert pong_b["type"] == "pong"

            # 11. Host Action: Mute All
            ws_a.send_text(
                json.dumps({
                    "type": "host_action",
                    "action": "mute_all",
                })
            )

            mute_all_b = json.loads(ws_b.receive_text())
            assert mute_all_b["type"] == "host_action"
            assert mute_all_b["action"] == "mute_all"

            # 12. Non-host attempting host action rejected
            ws_b.send_text(
                json.dumps({
                    "type": "host_action",
                    "action": "end_meeting",
                })
            )
            err_b = json.loads(ws_b.receive_text())
            assert err_b["type"] == "error"
            assert "permission denied" in err_b["message"].lower()

            # 13. Host ends meeting
            ws_a.send_text(
                json.dumps({
                    "type": "host_action",
                    "action": "end_meeting",
                })
            )

            end_b = json.loads(ws_b.receive_text())
            assert end_b["type"] == "meeting_ended"


def secrets_hex():
    import secrets
    return secrets.token_hex(4)
