export interface WebRTCParticipant {
  participant_id: string;
  user_id?: number | null;
  display_name: string;
  role: 'host' | 'participant' | 'co-host';
  is_muted: boolean;
  camera_enabled: boolean;
  screen_sharing: boolean;
  is_host: boolean;
  connection_state?: RTCPeerConnectionState | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'new';
}

export interface InMeetingChatMessage {
  id: number;
  participant_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export type SignalingMessageType =
  | 'join'
  | 'joined'
  | 'participant_joined'
  | 'participant_left'
  | 'offer'
  | 'answer'
  | 'ice_candidate'
  | 'mute_changed'
  | 'camera_changed'
  | 'screen_share_started'
  | 'screen_share_stopped'
  | 'chat_message'
  | 'host_action'
  | 'participant_removed'
  | 'meeting_ended'
  | 'leave'
  | 'ping'
  | 'pong'
  | 'error';

export interface JoinMessage {
  type: 'join';
  participant_id?: string;
  display_name: string;
  token?: string;
  is_muted?: boolean;
  camera_enabled?: boolean;
}

export interface JoinedMessage {
  type: 'joined';
  participant_id: string;
  meeting_id: string;
  title: string;
  is_host: boolean;
  display_name: string;
  participants: WebRTCParticipant[];
}

export interface ParticipantJoinedMessage {
  type: 'participant_joined';
  participant: WebRTCParticipant;
}

export interface ParticipantLeftMessage {
  type: 'participant_left';
  participant_id: string;
  reason?: string;
}

export interface OfferMessage {
  type: 'offer';
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
}

export interface AnswerMessage {
  type: 'answer';
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidateMessage {
  type: 'ice_candidate';
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
}

export interface MuteChangedMessage {
  type: 'mute_changed';
  participant_id: string;
  is_muted: boolean;
}

export interface CameraChangedMessage {
  type: 'camera_changed';
  participant_id: string;
  camera_enabled: boolean;
}

export interface ScreenShareMessage {
  type: 'screen_share_started' | 'screen_share_stopped';
  participant_id: string;
}

export interface ChatBroadcastMessage {
  type: 'chat_message';
  id: number;
  participant_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export interface HostActionMessage {
  type: 'host_action';
  action: 'mute_all' | 'remove_participant' | 'end_meeting';
  triggered_by?: string;
  target_id?: string;
}

export interface ParticipantRemovedMessage {
  type: 'participant_removed';
  reason: string;
}

export interface MeetingEndedMessage {
  type: 'meeting_ended';
  message: string;
}

export interface ErrorMessage {
  type: 'error';
  code?: string;
  message: string;
}

export interface PingMessage {
  type: 'ping';
}

export interface PongMessage {
  type: 'pong';
}

export interface LeaveMessage {
  type: 'leave';
}

export type SignalingIncomingMessage =
  | JoinedMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | MuteChangedMessage
  | CameraChangedMessage
  | ScreenShareMessage
  | ChatBroadcastMessage
  | HostActionMessage
  | ParticipantRemovedMessage
  | MeetingEndedMessage
  | ErrorMessage
  | PongMessage;
