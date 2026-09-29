'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Video, ArrowLeft, AlertCircle, Loader2, User } from 'lucide-react';
import { getMeeting, cleanMeetingId } from '@/lib/api';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [meetingInput, setMeetingInput] = useState(initialId);
  const [displayName, setDisplayName] = useState('Harsh');
  const [turnOffVideo, setTurnOffVideo] = useState(false);
  const [muteAudio, setMuteAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const meeting = await getMeeting(cleanId);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('meetspace_user_name', displayName.trim());
        sessionStorage.setItem('meetspace_pref_video_off', String(turnOffVideo));
        sessionStorage.setItem('meetspace_pref_mute_audio', String(muteAudio));
      }
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
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Video className="w-7 h-7 fill-current" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-zinc-900 tracking-tight">
          Join a Meeting
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-500">
          Enter your meeting details to connect with participants
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-8 border border-zinc-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Meeting ID or Invite Link
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 847 392 1056"
                value={meetingInput}
                onChange={(e) => setMeetingInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Your Screen Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2 border-t border-zinc-100">
              <label className="flex items-center gap-2.5 text-xs text-zinc-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={turnOffVideo}
                  onChange={(e) => setTurnOffVideo(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300"
                />
                <span>Turn off my video</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-zinc-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={muteAudio}
                  onChange={(e) => setMuteAudio(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300"
                />
                <span>Mute my microphone</span>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 transition"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Join Meeting</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
