import { request } from './client';
import {
  Meeting,
  MeetingDetail,
  CreateInstantMeetingDto,
  ScheduleMeetingDto,
  Participant,
  CreateParticipantDto,
  ParticipantUpdateDto,
} from '@/types/meeting';

export function cleanMeetingId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '');
}

export function formatMeetingId(id: string): string {
  const clean = cleanMeetingId(id);
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  if (clean.length === 11) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
  }
  return clean;
}

export async function getMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>('/api/meetings');
}

export async function getUpcomingMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>('/api/meetings/upcoming');
}

export async function getRecentMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>('/api/meetings/recent');
}

export async function getMeeting(meetingId: string): Promise<MeetingDetail> {
  const cleanId = cleanMeetingId(meetingId);
  return request<MeetingDetail>(`/api/meetings/${cleanId}`);
}

export async function createMeeting(
  dto?: CreateInstantMeetingDto
): Promise<Meeting> {
  return request<Meeting>('/api/meetings', {
    method: 'POST',
    body: JSON.stringify(dto || { title: 'Instant Meeting' }),
  });
}

export async function scheduleMeeting(
  dto: ScheduleMeetingDto
): Promise<Meeting> {
  return request<Meeting>('/api/meetings/schedule', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function joinMeeting(
  meetingId: string,
  displayName: string,
  role: string = 'participant'
): Promise<{ meeting: MeetingDetail; participant: Participant }> {
  const cleanId = cleanMeetingId(meetingId);
  const meeting = await getMeeting(cleanId);
  const participant = await addParticipant(cleanId, {
    display_name: displayName,
    role,
  });
  return { meeting, participant };
}

export async function deleteMeeting(meetingId: string): Promise<{ message: string }> {
  const cleanId = cleanMeetingId(meetingId);
  return request<{ message: string }>(`/api/meetings/${cleanId}`, {
    method: 'DELETE',
  });
}

export async function getParticipants(meetingId: string): Promise<Participant[]> {
  const cleanId = cleanMeetingId(meetingId);
  return request<Participant[]>(`/api/meetings/${cleanId}/participants`);
}

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

export async function updateParticipant(
  meetingId: string,
  participantId: number,
  dto: ParticipantUpdateDto
): Promise<Participant> {
  const cleanId = cleanMeetingId(meetingId);
  return request<Participant>(
    `/api/meetings/${cleanId}/participants/${participantId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }
  );
}

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

