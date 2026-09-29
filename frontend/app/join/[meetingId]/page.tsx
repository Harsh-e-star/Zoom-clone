'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2, Video } from 'lucide-react';
import { getMeeting, formatMeetingId, cleanMeetingId } from '@/lib/api';
import { MeetingDetail } from '@/types/meeting';

export default function DirectJoinPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.meetingId as string;
  const meetingId = Array.isArray(rawId) ? rawId[0] : rawId;
  const cleanId = cleanMeetingId(meetingId);

  const [displayName, setDisplayName] = useState('Harsh');
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [turnOffVideo, setTurnOffVideo] = useState(false);
  const [muteAudio, setMuteAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function verifyMeeting() {
      if (!cleanId) return;
      try {
        const data = await getMeeting(cleanId);
        setMeeting(data);
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
    }
    verifyMeeting();
  }, [cleanId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Please provide your name.');
      return;
    }

    setIsJoining(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('meetspace_user_name', displayName.trim());
      sessionStorage.setItem('meetspace_pref_video_off', String(turnOffVideo));
      sessionStorage.setItem('meetspace_pref_mute_audio', String(muteAudio));
    }
    router.push(`/meeting/${cleanId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fa] flex flex-col items-center justify-center text-zinc-600 gap-3">
        <Loader2 className="w-8 h-8 text-[#0e71eb] animate-spin" />
        <span className="text-xs font-semibold">Connecting to Zoom Meeting...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col font-sans select-none text-[#232333]">
      {/* Zoom Official Web Header */}
      <header className="w-full bg-white border-b border-[#e4e7eb] px-6 sm:px-12 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="text-[#0e71eb] font-extrabold text-3xl tracking-tighter">
            zoom
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600">
          <Link href="/" className="hover:text-[#0e71eb] transition">
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Launch Meeting Card */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white border border-[#e4e7eb] rounded-2xl shadow-sm p-8 sm:p-10 text-center">
          {errorMessage ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Meeting Not Found</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {errorMessage}
              </p>
              <Link
                href="/"
                className="inline-block px-5 py-2.5 bg-[#0e71eb] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#0b5ed7] transition"
              >
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0e71eb] flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6" />
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {meeting?.title || 'Zoom Meeting'}
              </h1>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Meeting ID: {formatMeetingId(cleanId)}
              </p>

              <form onSubmit={handleJoin} className="mt-6 space-y-4 text-left">
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

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#0e71eb] hover:bg-[#0b5ed7] shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Join from Your Browser</span>
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
