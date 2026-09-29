'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { MeetingRoom } from '@/components/meeting/MeetingRoom';

export default function MeetingPage() {
  const params = useParams();
  const rawId = params?.meetingId as string;
  const meetingId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!meetingId) {
    return null;
  }

  return <MeetingRoom meetingId={meetingId} />;
}
