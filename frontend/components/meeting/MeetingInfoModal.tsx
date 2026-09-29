'use client';

import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { MeetingDetail } from '@/types/meeting';
import { formatMeetingId } from '@/lib/api';
import { CopyLinkButton } from '../ui/CopyLinkButton';

interface MeetingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingDetail;
}

export function MeetingInfoModal({
  isOpen,
  onClose,
  meeting,
}: MeetingInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Meeting Information
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs">
          <div>
            <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
              Topic
            </span>
            <p className="text-sm font-semibold text-white mt-0.5">
              {meeting.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50">
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                Meeting ID
              </span>
              <span className="text-sm font-mono font-bold text-zinc-100">
                {formatMeetingId(meeting.meeting_id)}
              </span>
            </div>

            <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50">
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">
                Passcode
              </span>
              <span className="text-sm font-mono font-bold text-zinc-100">
                {meeting.passcode}
              </span>
            </div>
          </div>

          <div>
            <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold block mb-1">
              Invite Link
            </span>
            <div className="flex items-center justify-between p-2.5 bg-zinc-800/80 rounded-xl border border-zinc-700 gap-2">
              <span className="text-zinc-300 font-mono text-[11px] truncate">
                {meeting.invite_link}
              </span>
              <CopyLinkButton inviteLink={meeting.invite_link} iconOnly={true} />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
