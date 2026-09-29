'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Plus,
  Calendar,
  Share2,
  CalendarPlus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { UpcomingMeetings } from '@/components/dashboard/UpcomingMeetings';
import { RecentMeetings } from '@/components/dashboard/RecentMeetings';
import { JoinModal } from '@/components/dashboard/JoinModal';
import { ScheduleModal } from '@/components/dashboard/ScheduleModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { Meeting } from '@/types/meeting';
import {
  getUpcomingMeetings,
  getRecentMeetings,
  createMeeting,
} from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [upcoming, recent] = await Promise.all([
        getUpcomingMeetings(),
        getRecentMeetings(),
      ]);
      setUpcomingMeetings(upcoming);
      setRecentMeetings(recent);
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      setError(
        'Unable to connect to the backend API. Please make sure the FastAPI server is running on port 8000.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function initDashboard() {
      try {
        const [upcoming, recent] = await Promise.all([
          getUpcomingMeetings(),
          getRecentMeetings(),
        ]);
        if (isMounted) {
          setUpcomingMeetings(upcoming);
          setRecentMeetings(recent);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to fetch dashboard data:', err);
          setError(
            'Unable to connect to the backend API. Please make sure the FastAPI server is running on port 8000.'
          );
          setIsLoading(false);
        }
      }
    }

    initDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // Instant meeting handler
  const handleInstantMeeting = async () => {
    setIsCreatingInstant(true);
    try {
      const meeting = await createMeeting({
        title: 'Instant Meeting',
      });
      showToast('Instant meeting created!', 'success');
      router.push(`/meeting/${meeting.meeting_id}`);
    } catch (err: unknown) {
      console.error('Failed to create instant meeting:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to create instant meeting.',
        'error'
      );
      setIsCreatingInstant(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
        {/* Error notification banner if API is unreachable */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 1. GREETING & HERO SECTION */}
        <section className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            {getGreeting()}, Harsh
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 font-normal">
            Start or join a meeting to connect with others.
          </p>
        </section>

        {/* 2. PRIMARY ACTION CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* New Meeting */}
          <ActionCard
            title="New Meeting"
            description="Start an instant meeting with high-fidelity video"
            icon={Video}
            colorScheme="orange"
            onClick={handleInstantMeeting}
            isLoading={isCreatingInstant}
          />

          {/* Join Meeting */}
          <ActionCard
            title="Join Meeting"
            description="Join using a meeting ID or personal invite link"
            icon={Plus}
            colorScheme="blue"
            onClick={() => setIsJoinModalOpen(true)}
          />

          {/* Schedule */}
          <ActionCard
            title="Schedule"
            description="Plan a meeting for later with invite passcodes"
            icon={Calendar}
            colorScheme="indigo"
            onClick={() => setIsScheduleModalOpen(true)}
          />

          {/* Share Screen */}
          <ActionCard
            title="Share Screen"
            description="Present your screen directly into an active room"
            icon={Share2}
            colorScheme="zinc"
            onClick={() => setIsJoinModalOpen(true)}
          />
        </section>

        {/* 3. UPCOMING MEETINGS SECTION */}
        <section id="meetings" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-zinc-900">
                Upcoming Meetings
              </h2>
              {upcomingMeetings.length > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {upcomingMeetings.length}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Schedule New</span>
            </button>
          </div>

          {isLoading ? (
            <LoadingState type="card-skeleton" count={3} />
          ) : (
            <UpcomingMeetings
              meetings={upcomingMeetings}
              onScheduleClick={() => setIsScheduleModalOpen(true)}
              onMeetingDeleted={(deletedId) =>
                setUpcomingMeetings((prev) =>
                  prev.filter((m) => m.meeting_id !== deletedId)
                )
              }
            />
          )}
        </section>

        {/* 4. RECENT MEETINGS SECTION */}
        <section className="space-y-4 pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900">Recent Meetings</h2>
          </div>

          {isLoading ? (
            <LoadingState type="grid-skeleton" count={3} />
          ) : (
            <RecentMeetings meetings={recentMeetings} />
          )}
        </section>
      </main>

      {/* Modals */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={(newMeeting) => {
          setUpcomingMeetings((prev) => [newMeeting, ...prev]);
        }}
      />
    </div>
  );
}
