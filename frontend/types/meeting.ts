export type MeetingStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface Participant {
  id: number;
  meeting_id: string;
  display_name: string;
  role: 'host' | 'participant' | 'co-host';
  is_muted: boolean;
  is_camera_off: boolean;
  joined_at: string;
  left_at?: string | null;
}

export interface Message {
  id: number;
  meeting_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export interface Meeting {
  id: number;
  meeting_id: string;
  title: string;
  description?: string | null;
  scheduled_at?: string | null;
  duration_minutes: number;
  invite_link: string;
  status: MeetingStatus;
  passcode: string;
  created_at: string;
  participant_count?: number;
}

export interface MeetingDetail extends Meeting {
  participants: Participant[];
  messages: Message[];
}

export interface CreateInstantMeetingDto {
  title?: string;
  description?: string;
  passcode?: string;
}

export interface ScheduleMeetingDto {
  title: string;
  description?: string;
  date: string;
  time: string;
  duration_minutes: number;
  passcode?: string;
}

export interface CreateParticipantDto {
  display_name: string;
  role?: string;
  is_muted?: boolean;
  is_camera_off?: boolean;
}

export interface SendMessageDto {
  sender_name: string;
  sender_role?: string;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
}
