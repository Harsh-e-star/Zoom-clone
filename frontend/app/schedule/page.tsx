'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { scheduleMeeting } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function SchedulePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [title, setTitle] = useState("Harsh's Zoom Meeting");
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [meetingIdType, setMeetingIdType] = useState<'auto' | 'pmi'>('auto');
  const [hostVideo, setHostVideo] = useState(true);
  const [participantVideo, setParticipantVideo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a meeting topic.');
      return;
    }

    if (duration <= 0) {
      setErrorMessage('Duration must be a positive number.');
      return;
    }

    setIsLoading(true);

    try {
      await scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time,
        duration_minutes: Number(duration),
      });

      showToast('Meeting scheduled successfully!', 'success');
      router.push('/');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to schedule meeting.';
      setErrorMessage(msg);
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

        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600">
          <Link href="/" className="hover:text-[#0e71eb] transition">
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Schedule Form (Zoom Desktop Window Replica) */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8">
        <div className="bg-white border border-[#e4e7eb] rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0e71eb] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                Schedule Meeting
              </h1>
              <p className="text-xs text-zinc-500">
                Configure your meeting security, video, and calendar details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Topic & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Topic
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-[#0e71eb] focus:ring-2 focus:ring-[#0e71eb]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Meeting agenda, discussion points..."
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-[#0e71eb] focus:ring-2 focus:ring-[#0e71eb]/20 transition"
                />
              </div>
            </div>

            {/* When & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#0e71eb]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#0e71eb]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#0e71eb]"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                </select>
              </div>
            </div>

            {/* Meeting ID */}
            <div className="pt-2 border-t border-zinc-100">
              <span className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Meeting ID
              </span>
              <div className="space-y-2 text-xs text-zinc-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="idType"
                    checked={meetingIdType === 'auto'}
                    onChange={() => setMeetingIdType('auto')}
                    className="text-[#0e71eb] focus:ring-[#0e71eb]"
                  />
                  <span>Generate Automatically</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="idType"
                    checked={meetingIdType === 'pmi'}
                    onChange={() => setMeetingIdType('pmi')}
                    className="text-[#0e71eb] focus:ring-[#0e71eb]"
                  />
                  <span>Personal Meeting ID (847 392 1056)</span>
                </label>
              </div>
            </div>

            {/* Security */}
            <div className="pt-2 border-t border-zinc-100">
              <span className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Security
              </span>
              <div className="flex items-center gap-2 text-xs text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <Lock className="w-4 h-4 text-[#0e8a16]" />
                <span>Passcode will be auto-generated and encrypted with 256-bit AES.</span>
              </div>
            </div>

            {/* Video Settings */}
            <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Host Video
                </span>
                <div className="flex items-center gap-4 text-xs text-zinc-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hostVideo"
                      checked={hostVideo}
                      onChange={() => setHostVideo(true)}
                    />
                    <span>On</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hostVideo"
                      checked={!hostVideo}
                      onChange={() => setHostVideo(false)}
                    />
                    <span>Off</span>
                  </label>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Participant Video
                </span>
                <div className="flex items-center gap-4 text-xs text-zinc-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="partVideo"
                      checked={participantVideo}
                      onChange={() => setParticipantVideo(true)}
                    />
                    <span>On</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="partVideo"
                      checked={!participantVideo}
                      onChange={() => setParticipantVideo(false)}
                    />
                    <span>Off</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-[#0e71eb] hover:bg-[#0b5ed7] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
