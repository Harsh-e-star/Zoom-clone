import {
  Meeting,
  MeetingDetail,
  CreateInstantMeetingDto,
  ScheduleMeetingDto,
  Participant,
  CreateParticipantDto,
  Message,
  SendMessageDto,
} from '@/types/meeting';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClientError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number = 500, detail?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`;
      let detail = '';
      try {
        const errorJson = await res.json();
        detail = errorJson.detail || errorJson.message || '';
        if (detail) errorMessage = detail;
      } catch {
        // Response wasn't JSON
      }
      throw new ApiClientError(errorMessage, res.status, detail);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    const message =
      err instanceof Error
        ? err.message
        : 'Failed to connect to backend server. Make sure the API is running.';
    throw new ApiClientError(
      message.includes('fetch')
        ? 'Unable to reach backend server. Please check your connection or start the backend service.'
        : message,
      0
    );
  }
}

// 1. Fetch all meetings
export async function getMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>('/api/meetings');
}

// 2. Fetch upcoming meetings
export async function getUpcomingMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>('/api/meetings/upcoming');
}

// 3. Fetch recent meetings
export async function getRecentMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>('/api/meetings/recent');
}

// 4. Fetch meeting by meeting ID
export async function getMeeting(meetingId: string): Promise<MeetingDetail> {
  const cleanId = cleanMeetingId(meetingId);
  return request<MeetingDetail>(`/api/meetings/${cleanId}`);
}

// 5. Create instant meeting
export async function createMeeting(
  dto?: CreateInstantMeetingDto
): Promise<Meeting> {
  return request<Meeting>('/api/meetings', {
    method: 'POST',
    body: JSON.stringify(dto || { title: 'Instant Meeting' }),
  });
}

// 6. Schedule a future meeting
export async function scheduleMeeting(
  dto: ScheduleMeetingDto
): Promise<Meeting> {
  return request<Meeting>('/api/meetings/schedule', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// 7. Join meeting (validates meeting and registers participant)
export async function joinMeeting(
  meetingId: string,
  displayName: string,
  role: string = 'participant'
): Promise<{ meeting: MeetingDetail; participant: Participant }> {
  const cleanId = cleanMeetingId(meetingId);
  // First verify meeting exists
  const meeting = await getMeeting(cleanId);
  // Then register participant
  const participant = await addParticipant(cleanId, {
    display_name: displayName,
    role,
  });
  return { meeting, participant };
}

// 8. Delete meeting
export async function deleteMeeting(meetingId: string): Promise<{ message: string }> {
  const cleanId = cleanMeetingId(meetingId);
  return request<{ message: string }>(`/api/meetings/${cleanId}`, {
    method: 'DELETE',
  });
}

// 9. Fetch participants for a meeting
export async function getParticipants(meetingId: string): Promise<Participant[]> {
  const cleanId = cleanMeetingId(meetingId);
  return request<Participant[]>(`/api/meetings/${cleanId}/participants`);
}

// 10. Add participant
export async function addParticipant(
  meetingId: string,
  dto: CreateParticipantDto
): Promise<Participant> {
  const cleanId = cleanMeetingId(meetingId);
  return request<Participant>(`/api/meetings/${cleanId}/participants`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// 11. Update participant status (mute, video)
export async function updateParticipant(
  meetingId: string,
  participantId: number,
  updates: Partial<Participant>
): Promise<Participant> {
  const cleanId = cleanMeetingId(meetingId);
  return request<Participant>(
    `/api/meetings/${cleanId}/participants/${participantId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );
}

// 12. Remove participant
export async function removeParticipant(
  meetingId: string,
  participantId: number
): Promise<{ message: string }> {
  const cleanId = cleanMeetingId(meetingId);
  return request<{ message: string }>(
    `/api/meetings/${cleanId}/participants/${participantId}`,
    {
      method: 'DELETE',
    }
  );
}

// 13. Mute all participants
export async function muteAllParticipants(
  meetingId: string
): Promise<{ message: string; muted_count: number }> {
  const cleanId = cleanMeetingId(meetingId);
  return request<{ message: string; muted_count: number }>(
    `/api/meetings/${cleanId}/mute-all`,
    {
      method: 'POST',
    }
  );
}

// 14. Fetch meeting messages
export async function getMessages(meetingId: string): Promise<Message[]> {
  const cleanId = cleanMeetingId(meetingId);
  return request<Message[]>(`/api/meetings/${cleanId}/messages`);
}

// 15. Send a chat message
export async function sendMessage(
  meetingId: string,
  dto: SendMessageDto
): Promise<Message> {
  const cleanId = cleanMeetingId(meetingId);
  return request<Message>(`/api/meetings/${cleanId}/messages`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Helper: Normalize meeting input to clean digits
export function cleanMeetingId(input: string): string {
  if (!input) return '';
  let val = input.trim();
  const urlMatch = val.match(/\/join\/([0-9\s-]+)/);
  if (urlMatch) {
    val = urlMatch[1];
  }
  return val.replace(/[^0-9]/g, '');
}

// Helper: Format for display ("847 392 1056")
export function formatMeetingId(id: string): string {
  const clean = cleanMeetingId(id);
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return clean;
}
