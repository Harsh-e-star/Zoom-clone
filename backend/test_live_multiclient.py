"""
Live End-to-End Multi-Client WebRTC Signaling & Moderation Test
Connects two real WebSocket clients over TCP to the live running FastAPI server on port 8000.
Tests:
1. REST API authentication & meeting creation
2. Client A (Harsh - Host) WebSocket connection & join
3. Client B (Test User) WebSocket connection & join
4. Room discovery & presence updates
5. SDP Offer/Answer forwarding
6. ICE Candidate routing
7. Audio Mute state toggle & broadcast
8. Camera Video state toggle & broadcast
9. In-meeting chat message broadcast & SQLite database verification
10. Ping/Pong Heartbeat
11. Host Moderation (mute_all)
12. Host Moderation (end_meeting)
"""

import asyncio
import json
import websockets
import urllib.request
import sqlite3

BASE_HTTP = "http://localhost:8000"
BASE_WS = "ws://localhost:8000"

def make_http_post(url, data, token=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {}),
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

async def run_live_e2e_test():
    print("==================================================")
    print("🚀 STARTING LIVE E2E MULTI-CLIENT WEBRTC TEST")
    print("==================================================")

    # 1. Login as Harsh
    print("\n[Step 1] Authenticating Harsh...")
    auth_data = make_http_post(f"{BASE_HTTP}/api/auth/login", {
        "email": "harsh@meetspace.local",
        "password": "Harsh@12345"
    })
    token_harsh = auth_data["access_token"]
    print(f"✅ Harsh authenticated successfully. User: {auth_data['user']['name']}")

    # 2. Create Instant Meeting
    print("\n[Step 2] Creating Meeting via REST API...")
    meeting = make_http_post(
        f"{BASE_HTTP}/api/meetings",
        {"title": "Production E2E Multi-User Verification"},
        token=token_harsh,
    )
    meeting_id = meeting["meeting_id"]
    print(f"✅ Meeting created. ID: {meeting_id}, Title: {meeting['title']}")

    # 3. Client A (Harsh) connects to WebSocket signaling
    uri = f"{BASE_WS}/ws/meeting/{meeting_id}"
    print(f"\n[Step 3] Connecting Client A (Harsh) to {uri}...")
    async with websockets.connect(uri) as ws_a:
        # Send join handshake
        await ws_a.send(json.dumps({
            "type": "join",
            "participant_id": "harsh_client_1",
            "display_name": "Harsh",
            "token": token_harsh,
            "is_muted": False,
            "camera_enabled": True
        }))
        joined_a = json.loads(await ws_a.recv())
        assert joined_a["type"] == "joined"
        assert joined_a["is_host"] is True
        print(f"✅ Client A joined room. Host privileges: {joined_a['is_host']}. Existing peers: {len(joined_a['participants'])}")

        # 4. Client B (Test User) connects to WebSocket signaling
        print("\n[Step 4] Connecting Client B (Test User) to same room...")
        async with websockets.connect(uri) as ws_b:
            await ws_b.send(json.dumps({
                "type": "join",
                "participant_id": "test_user_client_2",
                "display_name": "Test User",
                "is_muted": True,
                "camera_enabled": False
            }))
            joined_b = json.loads(await ws_b.recv())
            assert joined_b["type"] == "joined"
            assert joined_b["is_host"] is False
            assert len(joined_b["participants"]) == 1
            assert joined_b["participants"][0]["participant_id"] == "harsh_client_1"
            print(f"✅ Client B joined room. Discovered existing peer Harsh ({joined_b['participants'][0]['participant_id']})")

            # Client A receives participant_joined event
            event_part_joined = json.loads(await ws_a.recv())
            assert event_part_joined["type"] == "participant_joined"
            assert event_part_joined["participant"]["participant_id"] == "test_user_client_2"
            print(f"✅ Client A received 'participant_joined' broadcast for: {event_part_joined['participant']['display_name']}")

            # 5. WebRTC Mesh SDP Offer/Answer Exchange
            print("\n[Step 5] Exchanging WebRTC SDP Offer & Answer...")
            offer_sdp = {"type": "offer", "sdp": "v=0\r\no=- 777 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 5004 UDP/TLS/RTP/SAVPF 111"}
            await ws_b.send(json.dumps({
                "type": "offer",
                "from": "test_user_client_2",
                "to": "harsh_client_1",
                "sdp": offer_sdp
            }))

            recv_offer = json.loads(await ws_a.recv())
            assert recv_offer["type"] == "offer"
            assert recv_offer["from"] == "test_user_client_2"
            assert recv_offer["sdp"] == offer_sdp
            print("✅ Client A received WebRTC SDP Offer from Client B.")

            answer_sdp = {"type": "answer", "sdp": "v=0\r\no=- 888 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 5004 UDP/TLS/RTP/SAVPF 111"}
            await ws_a.send(json.dumps({
                "type": "answer",
                "from": "harsh_client_1",
                "to": "test_user_client_2",
                "sdp": answer_sdp
            }))

            recv_answer = json.loads(await ws_b.recv())
            assert recv_answer["type"] == "answer"
            assert recv_answer["from"] == "harsh_client_1"
            assert recv_answer["sdp"] == answer_sdp
            print("✅ Client B received WebRTC SDP Answer from Client A.")

            # 6. ICE Candidate routing
            print("\n[Step 6] Routing ICE Candidates...")
            candidate = {"candidate": "candidate:1 1 UDP 2130706431 127.0.0.1 54321 typ host"}
            await ws_b.send(json.dumps({
                "type": "ice_candidate",
                "from": "test_user_client_2",
                "to": "harsh_client_1",
                "candidate": candidate
            }))

            recv_ice = json.loads(await ws_a.recv())
            assert recv_ice["type"] == "ice_candidate"
            assert recv_ice["candidate"] == candidate
            print("✅ Client A received ICE candidate from Client B.")

            # 7. Media Track State Toggling: Mute & Camera
            print("\n[Step 7] Testing Mute & Camera state propagation...")
            await ws_a.send(json.dumps({
                "type": "mute_changed",
                "participant_id": "harsh_client_1",
                "is_muted": True
            }))
            mute_event_b = json.loads(await ws_b.recv())
            assert mute_event_b["type"] == "mute_changed"
            assert mute_event_b["participant_id"] == "harsh_client_1"
            assert mute_event_b["is_muted"] is True
            print("✅ Client B received mute state update: Harsh is now muted.")

            await ws_b.send(json.dumps({
                "type": "camera_changed",
                "participant_id": "test_user_client_2",
                "camera_enabled": True
            }))
            cam_event_a = json.loads(await ws_a.recv())
            assert cam_event_a["type"] == "camera_changed"
            assert cam_event_a["participant_id"] == "test_user_client_2"
            assert cam_event_a["camera_enabled"] is True
            print("✅ Client A received camera state update: Test User enabled camera.")

            # 8. In-Meeting Chat Message Broadcast & Persistence
            print("\n[Step 8] Testing In-Meeting Chat...")
            chat_content = "Hello Harsh! Live WebRTC and Chat are completely functional."
            await ws_b.send(json.dumps({
                "type": "chat_message",
                "message": chat_content
            }))

            # Both A and B receive the broadcast
            chat_recv_a = json.loads(await ws_a.recv())
            chat_recv_b = json.loads(await ws_b.recv())
            assert chat_recv_a["message"] == chat_content
            assert chat_recv_b["message"] == chat_content
            assert chat_recv_a["sender_name"] == "Test User"
            print(f"✅ In-meeting chat received by both clients: '{chat_recv_a['message']}'")

            # Verify SQLite persistence
            conn = sqlite3.connect("zoom_clone.db")
            cur = conn.cursor()
            cur.execute("SELECT message, sender_name FROM messages WHERE meeting_id = ? ORDER BY id DESC LIMIT 1", (meeting_id,))
            row = cur.fetchone()
            conn.close()
            assert row is not None
            assert row[0] == chat_content
            print("✅ Verified chat message is persisted into SQLite database!")

            # 9. Ping / Pong Heartbeat
            print("\n[Step 9] Testing Heartbeat Ping/Pong...")
            await ws_a.send(json.dumps({"type": "ping"}))
            pong_a = json.loads(await ws_a.recv())
            assert pong_a["type"] == "pong"
            print("✅ Heartbeat pong received successfully.")

            # 10. Host Moderation Controls: Mute All
            print("\n[Step 10] Testing Host Moderation (Mute All)...")
            await ws_a.send(json.dumps({
                "type": "host_action",
                "action": "mute_all"
            }))
            mute_all_b = json.loads(await ws_b.recv())
            assert mute_all_b["type"] == "host_action"
            assert mute_all_b["action"] == "mute_all"
            print("✅ Client B received 'mute_all' command from host Harsh.")

            # 11. Host Moderation Controls: End Meeting for Everyone
            print("\n[Step 11] Testing Host Moderation (End Meeting for Everyone)...")
            await ws_a.send(json.dumps({
                "type": "host_action",
                "action": "end_meeting"
            }))
            end_b = json.loads(await ws_b.recv())
            assert end_b["type"] == "meeting_ended"
            print("✅ Client B received 'meeting_ended' event.")

    print("\n==================================================")
    print("🎉 ALL LIVE E2E MULTI-CLIENT WEBRTC TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_live_e2e_test())
