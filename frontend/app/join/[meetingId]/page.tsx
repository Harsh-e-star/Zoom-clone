'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video, ArrowLeft, AlertCircle, Loader2, User } from 'lucide-react';
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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

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
          Ready to join?
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-500">
          {meeting ? meeting.title : 'Zoom Meeting Session'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-8 border border-zinc-200">
          {errorMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Meeting Unavailable
                </h3>
                <p className="text-xs text-zinc-500 mt-1">{errorMessage}</p>
              </div>
              <Link
                href="/join"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Try Another Meeting ID
              </Link>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-500">Meeting Topic:</span>
                  <span className="font-semibold text-zinc-900">
                    {meeting?.title}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-zinc-500">Meeting ID:</span>
                  <span className="font-bold text-zinc-900">
                    {formatMeetingId(cleanId)}
                  </span>
                </div>
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
                  <span>Turn off my video upon joining</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={muteAudio}
                    onChange={(e) => setMuteAudio(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300"
                  />
                  <span>Mute my audio</span>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 transition"
                >
                  {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Join Room</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
