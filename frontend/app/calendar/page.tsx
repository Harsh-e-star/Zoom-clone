'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { getCalendarEvents, CalendarEvent } from '@/lib/api/calendar';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Play,
  Copy,
  Video,
  X,
  User,
} from 'lucide-react';

export default function CalendarPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 29)); // Default to Sept 2026
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModalEvent, setActiveModalEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true);
      try {
        const evts = await getCalendarEvents();
        setEvents(evts);
      } catch {
        addToast('Failed to load calendar events from server', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, [addToast]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate days for month grid
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 29));
  };

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.start);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col font-sans">
      <Header activeTab="calendar" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Top Calendar Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {monthNames[month]} {year}
            </h1>
            <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1 shadow-xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 transition cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 transition cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-1 text-xs font-semibold text-zinc-600 shadow-xs">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-[#0b5cff] text-white'
                    : 'hover:text-zinc-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-[#0b5cff] text-white'
                    : 'hover:text-zinc-900'
                }`}
              >
                Agenda
              </button>
            </div>

            <Link
              href="/schedule"
              className="px-4 py-2 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-[#0b5cff]/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule</span>
            </Link>
          </div>
        </div>

        {/* Calendar View Area */}
        {viewMode === 'month' ? (
          <div className="mt-6 flex-1 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/70 text-center py-2.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {daysOfWeek.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-zinc-100 min-h-[560px]">
              {/* Blank prefix padding */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-zinc-50/30 p-2 min-h-[90px]" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday =
                  day === 29 && month === 8 && year === 2026;
                const dayEvents = getEventsForDay(day);

                return (
                  <div
                    key={`day-${day}`}
                    className={`p-2 min-h-[90px] hover:bg-blue-50/30 transition-colors flex flex-col ${
                      isToday ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center rounded-full w-6 h-6 ${
                          isToday
                            ? 'bg-[#0b5cff] text-white'
                            : 'text-zinc-700'
                        }`}
                      >
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {dayEvents.length} {dayEvents.length === 1 ? 'meeting' : 'meetings'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 overflow-y-auto">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setActiveModalEvent(ev)}
                          className="w-full text-left p-1.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 rounded-lg text-blue-900 transition truncate block cursor-pointer"
                        >
                          <div className="text-[11px] font-bold truncate">
                            {ev.title}
                          </div>
                          <div className="text-[10px] text-blue-700 font-medium">
                            {new Date(ev.start).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Agenda View */
          <div className="mt-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-zinc-900 pb-2 border-b border-zinc-100">
              Upcoming Conferences Agenda
            </h2>
            {events.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                No scheduled meetings found in calendar.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {events.map((ev) => {
                  const d = new Date(ev.start);
                  return (
                    <div
                      key={ev.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0b5cff] flex items-center justify-center shrink-0 font-bold text-xs">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900">
                            {ev.title}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {ev.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
                            <span className="font-semibold text-blue-600">
                              {d.toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>•</span>
                            <span>{ev.durationMinutes} mins</span>
                            <span>•</span>
                            <span className="font-mono">ID: {ev.meetingId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/meeting/${ev.meetingId}`)}
                          className="px-4 py-2 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-[#0b5cff]/20 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Join Meeting</span>
                        </button>
                        <button
                          onClick={() => setActiveModalEvent(ev)}
                          className="px-3 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-xl cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Meeting Details Modal Dialog */}
        {activeModalEvent && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Meeting Details
                  </span>
                  <h2 className="text-xl font-bold text-zinc-900 mt-2">
                    {activeModalEvent.title}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">When</span>
                  <span className="font-semibold text-zinc-800">
                    {new Date(activeModalEvent.start).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Duration</span>
                  <span className="text-zinc-800">{activeModalEvent.durationMinutes} Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Meeting ID</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {activeModalEvent.meetingId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Join URL</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(activeModalEvent.inviteLink);
                      addToast('Meeting URL copied!', 'success');
                    }}
                    className="text-[#0b5cff] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </button>
                </div>
                <div className="pt-2">
                  <span className="text-zinc-500 font-medium block mb-1">Description</span>
                  <p className="p-3 bg-zinc-50 rounded-xl text-zinc-700 text-xs border border-zinc-100">
                    {activeModalEvent.description || 'No description provided for this session.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => router.push(`/meeting/${activeModalEvent.meetingId}`)}
                  className="px-5 py-2 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#0b5cff]/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start / Join</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
