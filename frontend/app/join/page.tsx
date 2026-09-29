'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
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
          ? 'Meeting not found. Please check the meeting ID or link.'
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col font-sans select-none text-[#232333]">
      {/* Zoom Official Web Header */}
      <header className="w-full bg-white border-b border-[#e4e7eb] px-6 sm:px-12 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="text-[#0e71eb] font-extrabold text-3xl tracking-tighter">
            zoom
          </span>
        </Link>

        <div className="flex items-center gap-6 text-xs font-semibold text-zinc-600">
          <Link href="/" className="hover:text-[#0e71eb] transition">
            Workplace
          </Link>
          <Link href="/schedule" className="hover:text-[#0e71eb] transition hidden sm:inline">
            Schedule
          </Link>
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-lg border border-[#0e71eb] text-[#0e71eb] hover:bg-blue-50 transition"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Join Card (Exact Zoom.us/join design) */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white border border-[#e4e7eb] rounded-2xl shadow-sm p-8 sm:p-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Join a Meeting
          </h1>
          <p className="text-xs text-zinc-500 mt-2">
            Connect to video, audio, and team chat in seconds
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Meeting ID or Personal Link Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 847 392 1056 or complete URL"
                value={meetingInput}
                onChange={(e) => setMeetingInput(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#0e71eb] focus:ring-2 focus:ring-[#0e71eb]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter your screen name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#0e71eb] focus:ring-2 focus:ring-[#0e71eb]/20 transition"
              />
            </div>

            {/* Audio & Video Toggles */}
            <div className="pt-2 space-y-2 border-t border-zinc-100 text-xs text-zinc-600">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={turnOffVideo}
                  onChange={(e) => setTurnOffVideo(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0e71eb] focus:ring-[#0e71eb] border-zinc-300"
                />
                <span>Turn off my video</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={muteAudio}
                  onChange={(e) => setMuteAudio(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0e71eb] focus:ring-[#0e71eb] border-zinc-300"
                />
                <span>Do not connect to audio</span>
              </label>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed pt-2">
              By clicking &quot;Join&quot;, you agree to our Terms of Service and Privacy Statement.
            </p>

            {/* Official Zoom Join Button */}
            <button
              type="submit"
              disabled={isLoading || !meetingInput.trim()}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#0e71eb] hover:bg-[#0b5ed7] disabled:opacity-40 disabled:hover:bg-[#0e71eb] shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Join</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f9fa] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#0e71eb] animate-spin" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
