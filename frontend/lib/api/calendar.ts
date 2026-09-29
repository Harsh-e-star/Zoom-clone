import { getMeetings } from './meetings';
import { Meeting } from '@/types/meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  durationMinutes: number;
  meetingId: string;
  inviteLink: string;
  status: string;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const meetings: Meeting[] = await getMeetings();
  return meetings.map((m) => {
    const start = new Date(m.scheduled_at || Date.now());
    const end = new Date(start.getTime() + (m.duration_minutes || 30) * 60000);
    return {
      id: String(m.id),
      title: m.title,
      description: m.description || '',
      start,
      end,
      durationMinutes: m.duration_minutes || 30,
      meetingId: m.meeting_id,
      inviteLink: m.invite_link,
      status: m.status,
    };
  });
}
