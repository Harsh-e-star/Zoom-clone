'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { scheduleMeeting } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function SchedulePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:30');
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a meeting title.');
      return;
    }

    if (duration <= 0) {
      setErrorMessage('Duration must be a positive integer.');
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
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Calendar className="w-7 h-7" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-zinc-900 tracking-tight">
          Schedule a Meeting
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-500">
          Plan video calls and auto-generate invite links
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
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
                Topic / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Design System Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Agenda, prerequisites, or preparation notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20 transition"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Schedule Meeting</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
