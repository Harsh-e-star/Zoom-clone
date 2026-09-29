'use client';

import React from 'react';
import Link from 'next/link';
import { History, Clock, RotateCcw } from 'lucide-react';
import { Meeting } from '@/types/meeting';
import { formatMeetingId } from '@/lib/api';
import { CopyLinkButton } from '../ui/CopyLinkButton';

interface RecentMeetingsProps {
  meetings: Meeting[];
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
  if (meetings.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-200 bg-white text-center text-xs text-zinc-500">
        No recent meeting history recorded yet.
      </div>
    );
  }

  const formatRecentDate = (dateString?: string | null) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          className="flex flex-col justify-between p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all duration-200 group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                {formatRecentDate(meeting.scheduled_at || meeting.created_at)}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                Completed
              </span>
            </div>

            <h4 className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition line-clamp-1 mb-1">
              {meeting.title}
            </h4>

            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
              <span className="font-mono bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/70">
                {formatMeetingId(meeting.meeting_id)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {meeting.duration_minutes}m
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
            <CopyLinkButton inviteLink={meeting.invite_link} iconOnly={true} />

            <Link
              href={`/meeting/${meeting.meeting_id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Join again</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
