'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  WebRTCParticipant,
  InMeetingChatMessage,
  SignalingIncomingMessage,
} from '@/types/webrtc';
import { WebRTCManager } from '@/lib/webrtc/WebRTCManager';
import { getMeeting } from '@/lib/api';
import { MeetingDetail } from '@/types/meeting';

export interface ReactionItem {
  id: string;
  emoji: string;
  sender: string;
}

export interface UseWebRTCMeetingResult {
  // Meeting info
  meeting: MeetingDetail | null;
  meetingTitle: string;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  durationFormatted: string;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

  // Participants & Media Streams
  localParticipant: WebRTCParticipant;
  remoteParticipants: WebRTCParticipant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;

  // Controls state
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  hasCameraPermission: boolean;
  hasMicPermission: boolean;
  isAudioAutoplayBlocked: boolean;
  unblockAudioAutoplay: () => void;

  // Actions
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  sendChat: (message: string) => void;
  messages: InMeetingChatMessage[];
  reactions: ReactionItem[];
  triggerReaction: (emoji: string) => void;

  // Host Actions
  hostMuteAll: () => void;
  hostRemoveParticipant: (participantId: string) => void;
  hostEndMeeting: () => void;
  leaveMeeting: () => void;
}

export function useWebRTCMeeting(
  meetingId: string,
  initialUserName: string = 'Harsh'
): UseWebRTCMeetingResult {
  const router = useRouter();

  // Basic meeting data
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [meetingTitle, setMeetingTitle] = useState<string>('MeetSpace Video Meeting');
  const [isHost, setIsHost] = useState<boolean>(initialUserName.toLowerCase() === 'harsh');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  >('connecting');

  // Participants
  const [participantId, setParticipantId] = useState<string>(() => {
    return 'p_' + Math.random().toString(36).substring(2, 9);
  });
  const [participants, setParticipants] = useState<WebRTCParticipant[]>([]);

  // Local media tracks & permissions
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(false);
  const [isAudioAutoplayBlocked, setIsAudioAutoplayBlocked] = useState<boolean>(false);

  // Remote streams dictionary: participant_id -> MediaStream
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // Chat & Reactions
  const [messages, setMessages] = useState<InMeetingChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isScreenSharingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const isVideoOffRef = useRef<boolean>(false);
  const isLeavingRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // Synchronized refs for stable callbacks
  const participantIdRef = useRef<string>(participantId);
  participantIdRef.current = participantId;
  const isHostRef = useRef<boolean>(isHost);
  isHostRef.current = isHost;
  const userNameRef = useRef<string>(initialUserName);
  userNameRef.current = initialUserName;
  const mediaPromiseRef = useRef<Promise<MediaStream | null> | null>(null);


  // Format MM:SS or HH:MM:SS
  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Send message helper over WebSocket
  const sendSignalingMessage = useCallback((msg: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // 1. Initialize WebRTC Manager once
  useEffect(() => {
    const mgr = new WebRTCManager();

    mgr.onIceCandidate = (targetParticipantId, candidate) => {
      sendSignalingMessage({
        type: 'ice_candidate',
        to: targetParticipantId,
        candidate,
      });
    };

    mgr.onRemoteStream = (remotePid, stream) => {
      console.log(`[WebRTC Hook] Received remote stream for ${remotePid}, tracks: ${stream.getTracks().length}`);
      setRemoteStreams((prev) => ({
        ...prev,
        [remotePid]: new MediaStream(stream.getTracks()),
      }));
    };


    mgr.onRemoteStreamRemoved = (remotePid) => {
      console.log(`[WebRTC Hook] Removed remote stream for ${remotePid}`);
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[remotePid];
        return next;
      });
    };

    mgr.onConnectionStateChange = (remotePid, state) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.participant_id === remotePid ? { ...p, connection_state: state } : p
        )
      );
    };

    webrtcRef.current = mgr;

    return () => {
      mgr.closeAll();
    };
  }, [sendSignalingMessage]);

  // 2. Acquire local media (mic & camera)
  useEffect(() => {
    let isMounted = true;

    async function getMedia(): Promise<MediaStream | null> {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        return null;
      }

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isMounted) {
          localStreamRef.current = media;
          if (typeof window !== 'undefined') {
            (window as any).__localStream = media;
          }
          setLocalStream(media);
          setHasCameraPermission(true);
          setHasMicPermission(true);

          if (webrtcRef.current) {
            webrtcRef.current.setLocalStream(media);
          }
          return media;
        } else {
          media.getTracks().forEach((t) => t.stop());
          return null;
        }
      } catch (err) {
        console.warn('[WebRTC] Full media access denied or not available, trying audio-only:', err);
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (isMounted) {
            localStreamRef.current = audioOnly;
            setLocalStream(audioOnly);
            setHasMicPermission(true);
            setIsVideoOff(true);
            isVideoOffRef.current = true;
            if (webrtcRef.current) {
              webrtcRef.current.setLocalStream(audioOnly);
            }
            return audioOnly;
          } else {
            audioOnly.getTracks().forEach((t) => t.stop());
            return null;
          }
        } catch {
          console.warn('[WebRTC] Audio access also denied or unavailable.');
          if (isMounted) {
            setIsVideoOff(true);
            isVideoOffRef.current = true;
            setIsMuted(true);
            isMutedRef.current = true;
          }
          return null;
        }
      }
    }

    mediaPromiseRef.current = getMedia();


    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Clean Leave Callback
  const leaveMeeting = useCallback(() => {
    isLeavingRef.current = true;

    // Send leave event
    sendSignalingMessage({ type: 'leave' });

    // Clean up local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    // Clean up WebRTC peer connections
    if (webrtcRef.current) {
      webrtcRef.current.closeAll();
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'User left meeting');
    }

    router.push('/');
  }, [router, sendSignalingMessage]);

  const connectSignalingRef = useRef<() => void>(() => {});

  // 3. Connect to WebSocket Signaling Server with Auto-Reconnection
  const connectSignaling = useCallback(() => {
    if (isLeavingRef.current || !meetingId) return;

    // Guard against duplicate active connections
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      console.log('[Signaling] WebSocket already open or connecting, skipping redundant connection.');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clean meeting ID
    const cleanId = meetingId.replace(/[^a-zA-Z0-9]/g, '');


    // Resolve WS host
    const wsBase =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000`
        : 'ws://localhost:8000');

    const wsUrl = `${wsBase}/ws/meeting/${cleanId}`;
    console.log(`[Signaling] Connecting to ${wsUrl}...`);
    setConnectionStatus('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    if (typeof window !== 'undefined') {
      (window as any).__testWs = ws;
    }

    ws.onopen = () => {
      console.log('[Signaling] WebSocket connection established.');
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;

      // Read stored auth token if available
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('meetspace_token') || localStorage.getItem('access_token') || sessionStorage.getItem('meetspace_token')
          : null;

      // Send Join Handshake
      const joinPayload = {
        type: 'join',
        participant_id: participantIdRef.current,
        display_name: userNameRef.current,
        token: token || undefined,
        is_muted: isMutedRef.current,
        camera_enabled: !isVideoOffRef.current,
      };
      ws.send(JSON.stringify(joinPayload));

      // Start Heartbeat Ping every 15 seconds
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data) as SignalingIncomingMessage;

        switch (msg.type) {
          // A. Successfully joined room
          case 'joined': {
            console.log('[Signaling] Joined meeting confirmation received:', msg);
            setMeetingTitle(msg.title || 'MeetSpace Meeting');
            setIsHost(msg.is_host);
            isHostRef.current = msg.is_host;
            setParticipantId(msg.participant_id);
            participantIdRef.current = msg.participant_id;
            setIsLoading(false);

            if (webrtcRef.current) {
              webrtcRef.current.setLocalParticipantId(msg.participant_id);
            }

            // Existing participants in the room
            const peers = msg.participants || [];
            setParticipants(peers);

            // Wait for local media acquisition to complete so offers contain active tracks
            if (mediaPromiseRef.current) {
              try {
                await mediaPromiseRef.current;
              } catch {}
            }

            // Mesh WebRTC: newcomer initiates offer to each existing peer in the room
            if (webrtcRef.current) {
              for (const peer of peers) {
                try {
                  console.log(`[Signaling] Initiating offer to existing peer: ${peer.participant_id}`);
                  const offer = await webrtcRef.current.createOffer(peer.participant_id);
                  sendSignalingMessage({
                    type: 'offer',
                    to: peer.participant_id,
                    sdp: offer,
                  });
                } catch (offerErr) {
                  console.warn(`[Signaling] Error creating offer for ${peer.participant_id}:`, offerErr);
                }
              }
            }
            break;
          }

          // B. Another participant joined
          case 'participant_joined': {
            console.log('[Signaling] New participant joined room:', msg.participant);
            setParticipants((prev) => {
              if (prev.some((p) => p.participant_id === msg.participant.participant_id)) {
                return prev;
              }
              return [...prev, msg.participant];
            });
            break;
          }

          // C. Participant left or was removed
          case 'participant_left': {
            console.log(`[Signaling] Participant left: ${msg.participant_id}`);
            if (webrtcRef.current) {
              webrtcRef.current.closePeer(msg.participant_id);
            }
            setParticipants((prev) =>
              prev.filter((p) => p.participant_id !== msg.participant_id)
            );
            setRemoteStreams((prev) => {
              const next = { ...prev };
              delete next[msg.participant_id];
              return next;
            });
            break;
          }

          // D. WebRTC SDP Offer
          case 'offer': {
            // Wait for local media acquisition before answering offer
            if (mediaPromiseRef.current) {
              try {
                await mediaPromiseRef.current;
              } catch {}
            }

            if (webrtcRef.current) {
              try {
                const answer = await webrtcRef.current.handleOffer(msg.from, msg.sdp);
                if (answer) {
                  sendSignalingMessage({
                    type: 'answer',
                    to: msg.from,
                    sdp: answer,
                  });
                }
              } catch (err) {
                console.warn(`[Signaling] Error handling offer from ${msg.from}:`, err);
              }
            }
            break;
          }

          // E. WebRTC SDP Answer

          case 'answer': {
            if (webrtcRef.current) {
              try {
                await webrtcRef.current.handleAnswer(msg.from, msg.sdp);
              } catch (err) {
                console.warn(`[Signaling] Error handling answer from ${msg.from}:`, err);
              }
            }
            break;
          }

          // F. WebRTC ICE Candidate
          case 'ice_candidate': {
            if (webrtcRef.current) {
              await webrtcRef.current.handleCandidate(msg.from, msg.candidate);
            }
            break;
          }

          // G. Mute State Change
          case 'mute_changed': {
            setParticipants((prev) =>
              prev.map((p) =>
                p.participant_id === msg.participant_id
                  ? { ...p, is_muted: msg.is_muted }
                  : p
              )
            );
            break;
          }

          // H. Camera State Change
          case 'camera_changed': {
            setParticipants((prev) =>
              prev.map((p) =>
                p.participant_id === msg.participant_id
                  ? { ...p, camera_enabled: msg.camera_enabled }
                  : p
              )
            );
            break;
          }

          // I. Screen Share State Change
          case 'screen_share_started':
          case 'screen_share_stopped': {
            const isSharing = msg.type === 'screen_share_started';
            setParticipants((prev) =>
              prev.map((p) =>
                p.participant_id === msg.participant_id
                  ? { ...p, screen_sharing: isSharing }
                  : p
              )
            );
            break;
          }

          // J. In-Meeting Chat Broadcast
          case 'chat_message': {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [
                ...prev,
                {
                  id: msg.id,
                  participant_id: msg.participant_id,
                  sender_name: msg.sender_name,
                  sender_role: msg.sender_role,
                  message: msg.message,
                  created_at: msg.created_at,
                },
              ];
            });
            break;
          }

          // K. Host Moderation Actions
          case 'host_action': {
            if (msg.action === 'mute_all') {
              if (!isHostRef.current) {
                // Mute local mic
                if (localStreamRef.current) {
                  localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
                }
                setIsMuted(true);
                isMutedRef.current = true;
                sendSignalingMessage({
                  type: 'mute_changed',
                  participant_id: participantIdRef.current,
                  is_muted: true,
                });
              }
            }
            break;
          }

          // L. Participant removed by host
          case 'participant_removed': {
            alert('You have been removed from this meeting by the host.');
            leaveMeeting();
            break;
          }

          // M. Meeting ended by host
          case 'meeting_ended': {
            alert('This meeting has ended.');
            leaveMeeting();
            break;
          }

          // N. Error
          case 'error': {
            console.error('[Signaling] Server error:', msg.message);
            setError(msg.message);
            setIsLoading(false);
            break;
          }

          case 'pong':
            break;
        }
      } catch (e) {
        console.error('[Signaling] Error parsing incoming message:', e);
      }
    };

    ws.onclose = (event) => {
      console.log(`[Signaling] WebSocket closed (code ${event.code})`);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      if (!isLeavingRef.current) {
        setConnectionStatus('reconnecting');
        // Exponential backoff: 1s, 2s, 4s, max 8s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 8000);
        reconnectAttemptsRef.current += 1;
        console.log(`[Signaling] Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSignalingRef.current();
        }, delay);
      } else {
        setConnectionStatus('disconnected');
      }
    };

    ws.onerror = (err) => {
      console.warn('[Signaling] WebSocket error encountered:', err);
    };
  }, [meetingId, sendSignalingMessage, leaveMeeting]);

  useEffect(() => {
    connectSignalingRef.current = connectSignaling;
  }, [connectSignaling]);

  // Initial trigger for signaling & metadata
  useEffect(() => {
    let isMounted = true;

    async function loadInitialMeeting() {
      if (!meetingId) return;
      try {
        const data = await getMeeting(meetingId);
        if (isMounted) {
          setMeeting(data);
          setMeetingTitle(data.title);
          // Pre-populate chat messages from DB
          if (data.messages && data.messages.length > 0) {
            setMessages(
              data.messages.map((m) => ({
                id: m.id,
                participant_id: 'history',
                sender_name: m.sender_name,
                sender_role: m.sender_role,
                message: m.message,
                created_at: m.created_at,
              }))
            );
          }
        }
      } catch (err) {
        console.warn('[Meeting] Failed to fetch initial metadata from REST API:', err);
      }
    }

    loadInitialMeeting();
    connectSignaling();

    const handleBeforeUnload = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'leave' }));
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (webrtcRef.current) {
        webrtcRef.current.closeAll();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [meetingId]);

  // Audio Autoplay Unblock Handler
  const unblockAudioAutoplay = useCallback(() => {
    setIsAudioAutoplayBlocked(false);
  }, []);

  // Media Controls: Toggle Audio Mute
  const toggleMute = useCallback(() => {
    const nextMuted = !isMutedRef.current;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    sendSignalingMessage({
      type: 'mute_changed',
      participant_id: participantIdRef.current || participantId,
      is_muted: nextMuted,
    });
  }, [participantId, sendSignalingMessage]);

  // Media Controls: Toggle Video Camera
  const toggleVideo = useCallback(async () => {
    const nextVideoOff = !isVideoOffRef.current;
    isVideoOffRef.current = nextVideoOff;
    setIsVideoOff(nextVideoOff);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });
    }

    sendSignalingMessage({
      type: 'camera_changed',
      participant_id: participantIdRef.current || participantId,
      camera_enabled: !nextVideoOff,
    });
  }, [participantId, sendSignalingMessage]);

  // Media Controls: Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    const activePid = participantIdRef.current || participantId;
    if (isScreenSharingRef.current) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      isScreenSharingRef.current = false;
      setIsScreenSharing(false);

      // Revert WebRTC sender track back to camera video track
      const cameraTrack = localStreamRef.current ? localStreamRef.current.getVideoTracks()[0] || null : null;
      if (webrtcRef.current) {
        webrtcRef.current.setScreenStream(null, false);
        await webrtcRef.current.replaceVideoTrack(cameraTrack);
      }

      sendSignalingMessage({
        type: 'screen_share_stopped',
        participant_id: activePid,
      });
      return;
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      alert('Screen sharing is not supported in this browser.');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      isScreenSharingRef.current = true;
      setIsScreenSharing(true);

      const displayTrack = displayStream.getVideoTracks()[0];

      // Switch WebRTC sender track to display track across all peers
      if (webrtcRef.current) {
        webrtcRef.current.setScreenStream(displayStream, true);
        await webrtcRef.current.replaceVideoTrack(displayTrack);
      }

      sendSignalingMessage({
        type: 'screen_share_started',
        participant_id: activePid,
      });

      // Browser native "Stop Sharing" floating button listener
      displayTrack.onended = async () => {
        screenStreamRef.current = null;
        setScreenStream(null);
        isScreenSharingRef.current = false;
        setIsScreenSharing(false);

        const cameraTrack = localStreamRef.current ? localStreamRef.current.getVideoTracks()[0] || null : null;
        if (webrtcRef.current) {
          webrtcRef.current.setScreenStream(null, false);
          await webrtcRef.current.replaceVideoTrack(cameraTrack);
        }

        sendSignalingMessage({
          type: 'screen_share_stopped',
          participant_id: activePid,
        });
      };
    } catch (err) {
      console.warn('[WebRTC] Screen share request cancelled or failed:', err);
    }
  }, [participantId, sendSignalingMessage]);

  // Chat: Send Message
  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return;
    sendSignalingMessage({
      type: 'chat_message',
      message: text.trim(),
    });
  }, [sendSignalingMessage]);

  // Reactions
  const triggerReaction = useCallback((emoji: string) => {
    const reactionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newReaction: ReactionItem = {
      id: reactionId,
      emoji,
      sender: initialUserName,
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 3000);
  }, [initialUserName]);

  // Host: Mute All
  const hostMuteAll = useCallback(() => {
    sendSignalingMessage({
      type: 'host_action',
      action: 'mute_all',
    });
  }, [sendSignalingMessage]);

  // Host: Remove Participant
  const hostRemoveParticipant = useCallback((targetId: string) => {
    sendSignalingMessage({
      type: 'host_action',
      action: 'remove_participant',
      target_id: targetId,
    });
  }, [sendSignalingMessage]);

  // Host: End Meeting
  const hostEndMeeting = useCallback(() => {
    sendSignalingMessage({
      type: 'host_action',
      action: 'end_meeting',
    });
  }, [sendSignalingMessage]);

  // Construct local participant object
  const localParticipant: WebRTCParticipant = {
    participant_id: participantId,
    display_name: initialUserName,
    role: isHost ? 'host' : 'participant',
    is_muted: isMuted,
    camera_enabled: !isVideoOff,
    screen_sharing: isScreenSharing,
    is_host: isHost,
    connection_state: 'connected',
  };

  // Remote participants list filtered from local
  const remoteParticipants = participants.filter((p) => p.participant_id !== participantId);

  return {
    meeting,
    meetingTitle,
    isHost,
    isLoading,
    error,
    durationFormatted: formatDuration(elapsedSeconds),
    connectionStatus,
    localParticipant,
    remoteParticipants,
    localStream,
    screenStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    hasCameraPermission,
    hasMicPermission,
    isAudioAutoplayBlocked,
    unblockAudioAutoplay,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    sendChat,
    messages,
    reactions,
    triggerReaction,
    hostMuteAll,
    hostRemoveParticipant,
    hostEndMeeting,
    leaveMeeting,
  };
}
