'use client';

import React, { useState } from 'react';
import { Calendar, X, AlertCircle, Loader2, Clock } from 'lucide-react';
import { scheduleMeeting } from '@/lib/api';
import { useToast } from '../ui/Toast';
import { Meeting } from '@/types/meeting';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meeting: Meeting) => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSuccess,
}: ScheduleModalProps) {
  const { showToast } = useToast();

  // Pre-fill tomorrow at 10:00 AM as a friendly default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a meeting topic/title.');
      return;
    }

    if (!date) {
      setErrorMessage('Please select a date.');
      return;
    }

    if (!time) {
      setErrorMessage('Please select a start time.');
      return;
    }

    if (duration <= 0) {
      setErrorMessage('Duration must be greater than 0 minutes.');
      return;
    }

    // Check if scheduled date/time is in the past
    const selectedDateTime = new Date(`${date}T${time}:00`);
    if (selectedDateTime < new Date()) {
      setErrorMessage('Meeting cannot be scheduled in the past.');
      return;
    }

    setIsLoading(true);

    try {
      const createdMeeting = await scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time,
        duration_minutes: Number(duration),
      });

      showToast('Meeting scheduled successfully!', 'success');
      onSuccess(createdMeeting);
      onClose();

      // Reset form
      setTitle('');
      setDescription('');
      setDuration(30);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to schedule meeting.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Schedule Meeting</h3>
              <p className="text-xs text-zinc-500">Plan a session for your team or guests</p>
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

          {/* Meeting Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Topic / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint Planning Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Description / Agenda (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Meeting agenda, goals, or preparation instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Date & Time Grid */}
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
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {/* Security details note */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-zinc-700">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Instant ID & Passcode auto-generation enabled</span>
            </div>
            <p>A unique 10-digit meeting ID and secure passcode will be generated automatically.</p>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
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
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Schedule Meeting</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
