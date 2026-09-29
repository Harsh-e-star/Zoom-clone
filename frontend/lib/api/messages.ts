import { request } from './client';
import { cleanMeetingId } from './meetings';
import { Message, SendMessageDto } from '@/types/meeting';

export async function getMessages(meetingId: string): Promise<Message[]> {
  const cleanId = cleanMeetingId(meetingId);
  return request<Message[]>(`/api/meetings/${cleanId}/messages`);
}

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
