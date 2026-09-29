'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, Copy, Eye, EyeOff, Lock } from 'lucide-react';
import { MeetingDetail } from '@/types/meeting';
import { formatMeetingId } from '@/lib/api';
import { useToast } from '../ui/Toast';

interface MeetingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingDetail | null;
}

export function MeetingInfoModal({
  isOpen,
  onClose,
  meeting,
}: MeetingInfoModalProps) {
  const { showToast } = useToast();
  const [showPasscode, setShowPasscode] = useState(false);

  if (!isOpen || !meeting) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100 select-none">
      {/* Zoom Authentic Green Shield Meeting Info Popover */}
      <div className="mt-12 sm:mt-14 ml-0 sm:ml-4 bg-[#23232b] border border-[#3b3c48] rounded-2xl max-w-md w-full p-5 shadow-2xl text-left text-white animate-in zoom-in-95 duration-100">
        {/* Header with Green Shield */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#3b3c48]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0e8a16]/20 border border-[#0e8a16] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Meeting Information</span>
              </h3>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Enhanced 256-bit encryption</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="py-3.5 space-y-3 text-xs">
          <div>
            <span className="text-zinc-400 text-[11px] font-semibold block">
              Meeting Topic
            </span>
            <p className="text-sm font-bold text-white mt-0.5 truncate">
              {meeting.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Meeting ID */}
            <div className="p-2.5 bg-[#1b1c22] rounded-xl border border-[#333440]">
              <span className="text-zinc-400 block text-[10px] font-semibold uppercase">
                Meeting ID
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs font-mono font-bold text-white">
                  {formatMeetingId(meeting.meeting_id)}
                </span>
                <button
                  onClick={() => copyToClipboard(meeting.meeting_id, 'Meeting ID')}
                  className="p-1 text-zinc-400 hover:text-white transition"
                  title="Copy Meeting ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Host Name */}
            <div className="p-2.5 bg-[#1b1c22] rounded-xl border border-[#333440]">
              <span className="text-zinc-400 block text-[10px] font-semibold uppercase">
                Host
              </span>
              <span className="text-xs font-bold text-white mt-0.5 block truncate">
                Harsh
              </span>
            </div>
          </div>

          {/* Passcode Row with Show/Hide toggle */}
          <div className="p-2.5 bg-[#1b1c22] rounded-xl border border-[#333440]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-400 block text-[10px] font-semibold uppercase">
                  Passcode
                </span>
                <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                  {showPasscode ? meeting.passcode : '••••••'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="p-1 text-zinc-400 hover:text-white transition"
                  title={showPasscode ? 'Hide Passcode' : 'Show Passcode'}
                >
                  {showPasscode ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(meeting.passcode, 'Passcode')}
                  className="p-1 text-zinc-400 hover:text-white transition"
                  title="Copy Passcode"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Invite Link */}
          <div>
            <span className="text-zinc-400 text-[11px] font-semibold block mb-1">
              Invite Link
            </span>
            <div className="flex items-center justify-between p-2 bg-[#1b1c22] rounded-xl border border-[#333440] gap-2">
              <span className="text-zinc-300 font-mono text-[11px] truncate select-all">
                {meeting.invite_link}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(meeting.invite_link, 'Invite Link')}
                className="px-2.5 py-1 bg-[#0e71eb] hover:bg-[#0b5ed7] text-white text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Encryption Notice */}
          <div className="pt-2 text-[10px] text-zinc-400 flex items-center gap-1.5 border-t border-[#3b3c48]">
            <Lock className="w-3 h-3 text-[#22c55e]" />
            <span>Encrypted with Zoom End-to-End protocol (AES-256-GCM).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
