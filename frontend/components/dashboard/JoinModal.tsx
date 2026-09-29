'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, X, AlertCircle, Loader2, User } from 'lucide-react';
import { getMeeting, cleanMeetingId } from '@/lib/api';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMeetingId?: string;
}

export function JoinModal({
  isOpen,
  onClose,
  initialMeetingId = '',
}: JoinModalProps) {
  const router = useRouter();
  const [meetingInput, setMeetingInput] = useState(initialMeetingId);
  const [displayName, setDisplayName] = useState('Harsh');
  const [turnOffVideo, setTurnOffVideo] = useState(false);
  const [muteAudio, setMuteAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = cleanMeetingId(meetingInput);
    if (!cleanId) {
      setErrorMessage('Please enter a valid Meeting ID or Invite Link.');
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage('Please provide a display name.');
      return;
    }

    setIsLoading(true);

    try {
      // Validate meeting against backend
      const meeting = await getMeeting(cleanId);
      
      // Store preferences in sessionStorage for the meeting room
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('meetspace_user_name', displayName.trim());
        sessionStorage.setItem('meetspace_pref_video_off', String(turnOffVideo));
        sessionStorage.setItem('meetspace_pref_mute_audio', String(muteAudio));
      }

      onClose();
      router.push(`/meeting/${meeting.meeting_id}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Meeting not found. Please check the meeting ID.';
      setErrorMessage(
        msg.includes('404') || msg.toLowerCase().includes('not found')
          ? 'Meeting not found. Please check the meeting ID.'
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Join a Meeting</h3>
              <p className="text-xs text-zinc-500">Connect instantly via ID or link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Meeting ID or URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Meeting ID or Personal Link Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. 847 392 1056 or invite URL"
                value={meetingInput}
                onChange={(e) => setMeetingInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Format: 10 digits or paste complete invite link
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Enter your screen name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Audio/Video Options */}
          <div className="pt-2 space-y-2 border-t border-zinc-100">
            <label className="flex items-center gap-2.5 text-xs text-zinc-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={turnOffVideo}
                onChange={(e) => setTurnOffVideo(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300"
              />
              <span>Turn off my video upon joining</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-zinc-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={muteAudio}
                onChange={(e) => setMuteAudio(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300"
              />
              <span>Do not connect to audio (Mute)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Join Meeting</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
