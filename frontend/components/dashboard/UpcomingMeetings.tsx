'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Meeting } from '@/types/meeting';
import { formatMeetingId, deleteMeeting } from '@/lib/api';
import { CopyLinkButton } from '../ui/CopyLinkButton';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';

interface UpcomingMeetingsProps {
  meetings: Meeting[];
  onScheduleClick: () => void;
  onMeetingDeleted: (meetingId: string) => void;
}

export function UpcomingMeetings({
  meetings,
  onScheduleClick,
  onMeetingDeleted,
}: UpcomingMeetingsProps) {
  const { showToast } = useToast();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleDelete = async (meetingId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteMeeting(meetingId);
      showToast('Meeting cancelled successfully.', 'info');
      onMeetingDeleted(meetingId);
      setActiveMenuId(null);
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      showToast('Failed to delete meeting.', 'error');
    }
  };

  const formatMeetingDateTime = (dateString?: string | null) => {
    if (!dateString) return { dateStr: 'Today', timeStr: 'Now' };
    const dateObj = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let dateStr = dateObj.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });

    if (dateObj.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    }

    const timeStr = dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { dateStr, timeStr };
  };

  if (meetings.length === 0) {
    return (
      <EmptyState
        title="No upcoming meetings"
        description="You have no scheduled meetings on your calendar. Create one now to collaborate with your team."
        icon={Calendar}
        actionText="Schedule a Meeting"
        onAction={onScheduleClick}
      />
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => {
        const { dateStr, timeStr } = formatMeetingDateTime(meeting.scheduled_at);
        const isMenuOpen = activeMenuId === meeting.meeting_id;

        return (
          <div
            key={meeting.id}
            className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200"
          >
            {/* Left: Meeting Details */}
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {dateStr}
                </span>
                <span className="text-sm font-extrabold">{timeStr.split(' ')[0]}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-zinc-900 group-hover:text-blue-600 transition">
                    {meeting.title}
                  </h4>
                  <span className="sm:hidden text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {dateStr}, {timeStr}
                  </span>
                </div>

                {meeting.description && (
                  <p className="text-xs text-zinc-500 line-clamp-1 max-w-md">
                    {meeting.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 pt-0.5">
                  <span className="flex items-center gap-1 font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                    ID: {formatMeetingId(meeting.meeting_id)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {meeting.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {dateStr} at {timeStr}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="mt-4 sm:mt-0 flex items-center gap-2.5 shrink-0">
              <CopyLinkButton inviteLink={meeting.invite_link} />

              <Link
                href={`/meeting/${meeting.meeting_id}`}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition"
              >
                <Video className="w-4 h-4 fill-current" />
                <span>Join</span>
              </Link>

              {/* Menu / Delete Option */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveMenuId(isMenuOpen ? null : meeting.meeting_id)
                  }
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-zinc-200 shadow-xl z-10 py-1 text-xs">
                    <button
                      onClick={() =>
                        handleDelete(meeting.meeting_id, meeting.title)
                      }
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete meeting</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
