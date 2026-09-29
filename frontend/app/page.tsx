'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Video,
  Plus,
  Calendar,
  Share2,
  CalendarPlus,
  RefreshCw,
  AlertCircle,
  Clock,
  Copy,
  Trash2,
  Check,
  MessageSquare,
  Users,
  PenTool,
  FileText,
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
  formatMeetingId,
  deleteMeeting,
} from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'home' | 'meetings' | 'chat' | 'contacts' | 'whiteboards' | 'notes'>('home');
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('8473921056');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isNewMeetingMenuOpen, setIsNewMeetingMenuOpen] = useState(false);
  const [startWithVideo, setStartWithVideo] = useState(true);
  const [usePMI, setUsePMI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Clock & Date state
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [calendarDay, setCalendarDay] = useState<number>(29);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );
      setCalendarDay(now.getDate());
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
    setIsNewMeetingMenuOpen(false);

    try {
      if (usePMI) {
        // Use Personal Meeting ID (PMI)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('meetspace_user_name', 'Harsh');
          sessionStorage.setItem('meetspace_pref_video_off', String(!startWithVideo));
        }
        showToast('Starting Personal Meeting Room (847 392 1056)...', 'success');
        router.push('/meeting/8473921056');
        return;
      }

      const meeting = await createMeeting({
        title: "Harsh's Instant Meeting",
      });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('meetspace_user_name', 'Harsh');
        sessionStorage.setItem('meetspace_pref_video_off', String(!startWithVideo));
      }
      showToast('Starting instant meeting...', 'success');
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

  const handleCopyPMI = () => {
    navigator.clipboard?.writeText('8473921056');
    showToast('Personal Meeting ID (847 392 1056) copied!', 'success');
  };

  const handleCopyInviteLink = (link: string) => {
    navigator.clipboard?.writeText(link);
    showToast('Meeting invite link copied!', 'success');
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await deleteMeeting(meetingId);
      setUpcomingMeetings((prev) => prev.filter((m) => m.meeting_id !== meetingId));
      showToast('Meeting deleted successfully', 'info');
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      showToast('Failed to delete meeting', 'error');
    }
  };

  const nextMeeting = upcomingMeetings[0] || null;

  // Selected meeting for the "Meetings" tab view
  const pmiMeeting: Meeting = {
    id: 1,
    meeting_id: '8473921056',
    title: "Harsh's Personal Meeting Room",
    description: 'Personal meeting room for one-on-ones, interviews, and ad-hoc collaboration.',
    scheduled_at: new Date().toISOString(),
    duration_minutes: 60,
    invite_link: 'http://localhost:3000/meeting/8473921056',
    status: 'scheduled',
    passcode: '392105',
    created_at: new Date().toISOString(),
    participant_count: 0,
  };

  const currentSelectedMeeting =
    selectedMeetingId === '8473921056'
      ? pmiMeeting
      : upcomingMeetings.find((m) => m.meeting_id === selectedMeetingId) || pmiMeeting;

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-[#232333] flex flex-col font-sans select-none">
      <Navbar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as 'home' | 'meetings' | 'chat' | 'contacts' | 'whiteboards' | 'notes')} />

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Error notification banner if API is unreachable */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
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

        {/* ========================================================================= */}
        {/* TAB 1: HOME (Zoom Authentic 4-Button Matrix + Clock Card + Upcoming List) */}
        {/* ========================================================================= */}
        {activeTab === 'home' && (
          <>
            {/* 1. ICONIC ZOOM HERO SECTION: Left (2x2 Action Matrix) + Right (Clock Wallpaper Card) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: 2x2 Iconic Action Buttons */}
              <div className="lg:col-span-6 flex items-center justify-center py-6 px-4 bg-white rounded-3xl border border-zinc-200/80 shadow-xs relative">
                <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:gap-x-16 sm:gap-y-9">
                  {/* 1. New Meeting with Dropdown */}
                  <div className="relative">
                    <ActionCard
                      title="New Meeting"
                      icon={Video}
                      variant="orange"
                      onClick={handleInstantMeeting}
                      isLoading={isCreatingInstant}
                      hasDropdown={true}
                      onDropdownClick={(e) => {
                        e.stopPropagation();
                        setIsNewMeetingMenuOpen(!isNewMeetingMenuOpen);
                      }}
                    />

                    {/* Authentic Zoom New Meeting Options Dropdown */}
                    {isNewMeetingMenuOpen && (
                      <div className="absolute top-24 left-0 sm:left-4 w-64 bg-[#23232b] border border-[#3b3c48] rounded-2xl shadow-2xl z-50 p-2.5 text-white text-xs animate-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => setStartWithVideo(!startWithVideo)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#2e2f3a] transition cursor-pointer"
                        >
                          <span>Start with video</span>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              startWithVideo
                                ? 'bg-[#0e71eb] border-[#0e71eb] text-white'
                                : 'border-zinc-500'
                            }`}
                          >
                            {startWithVideo && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUsePMI(!usePMI)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#2e2f3a] transition cursor-pointer"
                        >
                          <div className="text-left">
                            <p>Use Personal Meeting ID (PMI)</p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              847 392 1056
                            </p>
                          </div>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              usePMI
                                ? 'bg-[#0e71eb] border-[#0e71eb] text-white'
                                : 'border-zinc-500'
                            }`}
                          >
                            {usePMI && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </button>

                        <div className="pt-2 mt-1 border-t border-[#3b3c48] space-y-1">
                          <button
                            type="button"
                            onClick={handleCopyPMI}
                            className="w-full text-left p-1.5 rounded-lg hover:bg-[#2e2f3a] text-zinc-300 hover:text-white transition flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy PMI</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Join */}
                  <ActionCard
                    title="Join"
                    icon={Plus}
                    variant="blue"
                    onClick={() => setIsJoinModalOpen(true)}
                  />

                  {/* 3. Schedule with Calendar Day Number Badge */}
                  <ActionCard
                    title="Schedule"
                    icon={Calendar}
                    variant="blue"
                    badgeNumber={calendarDay}
                    onClick={() => setIsScheduleModalOpen(true)}
                  />

                  {/* 4. Share Screen */}
                  <ActionCard
                    title="Share Screen"
                    icon={Share2}
                    variant="blue"
                    isShareScreen={true}
                    onClick={() => setIsJoinModalOpen(true)}
                  />
                </div>
              </div>

              {/* Right Column: Zoom Iconic Digital Clock & Upcoming Agenda Card */}
              <div className="lg:col-span-6 rounded-3xl overflow-hidden shadow-md flex flex-col justify-between relative bg-linear-to-br from-[#1b253b] via-[#151c2d] to-[#0c111c] text-white p-6 sm:p-8 border border-slate-700/60 min-h-[270px]">
                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Time & Date Display */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      suppressHydrationWarning
                      className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans"
                    >
                      {currentTime || '12:00 PM'}
                    </span>
                  </div>
                  <p
                    suppressHydrationWarning
                    className="text-xs sm:text-sm font-medium text-slate-300 mt-1"
                  >
                    {currentDate || 'Tuesday, September 29, 2026'}
                  </p>
                </div>

                {/* Next Meeting Reminder Card */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                  {nextMeeting ? (
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Next Meeting</span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mt-0.5">
                        {nextMeeting.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        ID: {formatMeetingId(nextMeeting.meeting_id)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-300">
                        No upcoming meetings today
                      </p>
                      <p className="text-[11px] text-slate-400">
                        You&apos;re all clear for now!
                      </p>
                    </div>
                  )}

                  {nextMeeting ? (
                    <Link
                      href={`/meeting/${nextMeeting.meeting_id}`}
                      className="px-4 py-2 bg-[#0e71eb] hover:bg-[#0b5ed7] text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
                    >
                      Start
                    </Link>
                  ) : (
                    <button
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Schedule
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* 2. UPCOMING MEETINGS SECTION */}
            <section id="meetings" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                    Upcoming Meetings
                  </h2>
                  {upcomingMeetings.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-[#0e71eb] border border-blue-100">
                      {upcomingMeetings.length}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0e71eb] hover:bg-blue-50 transition cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Schedule</span>
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

            {/* 3. RECENT MEETINGS SECTION */}
            <section className="space-y-3 pt-4 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Recent Meetings
                </h2>
              </div>

              {isLoading ? (
                <LoadingState type="grid-skeleton" count={3} />
              ) : (
                <RecentMeetings meetings={recentMeetings} />
              )}
            </section>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MEETINGS (Authentic Zoom Client Split View: List on Left, Detail on Right) */}
        {/* ========================================================================= */}
        {activeTab === 'meetings' && (
          <section className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
            {/* Left Sidebar: Meetings Agenda List */}
            <div className="md:col-span-5 border-r border-zinc-200 flex flex-col bg-[#fafafc]">
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900">Meetings</h3>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="p-1.5 text-[#0e71eb] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                  title="Schedule New Meeting"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Recurring / PMI item */}
                <button
                  onClick={() => setSelectedMeetingId('8473921056')}
                  className={`w-full text-left p-3 rounded-2xl transition cursor-pointer ${
                    selectedMeetingId === '8473921056'
                      ? 'bg-blue-50/80 border border-blue-200 text-[#0e71eb]'
                      : 'hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-0.5">
                    <span>Recurring</span>
                    <span className="font-mono text-[11px]">847-392-1056</span>
                  </div>
                  <h4 className="text-sm font-bold truncate">
                    Harsh&apos;s Personal Meeting Room
                  </h4>
                </button>

                {/* Upcoming scheduled meetings */}
                <div className="pt-2 px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Upcoming
                </div>

                {upcomingMeetings.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMeetingId(m.meeting_id)}
                    className={`w-full text-left p-3 rounded-2xl transition cursor-pointer ${
                      selectedMeetingId === m.meeting_id
                        ? 'bg-blue-50/80 border border-blue-200 text-[#0e71eb]'
                        : 'hover:bg-zinc-100 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-0.5">
                      <span>{m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                      <span className="font-mono text-[11px]">{formatMeetingId(m.meeting_id)}</span>
                    </div>
                    <h4 className="text-sm font-bold truncate">
                      {m.title}
                    </h4>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Pane: Selected Meeting Details & Actions */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0e71eb] text-xs font-bold border border-blue-100">
                    {currentSelectedMeeting.meeting_id === '8473921056' ? 'Personal Meeting Room' : 'Scheduled Meeting'}
                  </span>
                  <h2 className="text-2xl font-extrabold text-zinc-900 mt-2">
                    {currentSelectedMeeting.title}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    {currentSelectedMeeting.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 border-y border-zinc-100">
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Meeting ID
                    </span>
                    <span className="text-base font-mono font-bold text-zinc-900 mt-0.5 block">
                      {formatMeetingId(currentSelectedMeeting.meeting_id)}
                    </span>
                  </div>

                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Passcode
                    </span>
                    <span className="text-base font-mono font-bold text-zinc-900 mt-0.5 block">
                      {currentSelectedMeeting.passcode || '392105'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Invite Link
                  </span>
                  <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-700">
                    <span className="truncate mr-2">{currentSelectedMeeting.invite_link}</span>
                    <button
                      onClick={() => handleCopyInviteLink(currentSelectedMeeting.invite_link)}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 transition shrink-0 cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row (Zoom Authentic Start, Copy Invitation, Delete) */}
              <div className="pt-6 border-t border-zinc-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/meeting/${currentSelectedMeeting.meeting_id}`}
                    className="px-6 py-2.5 bg-[#0e71eb] hover:bg-[#0b5ed7] text-white text-sm font-bold rounded-xl shadow-md transition"
                  >
                    Start
                  </Link>
                  <button
                    onClick={() => handleCopyInviteLink(currentSelectedMeeting.invite_link)}
                    className="px-4 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 text-sm font-semibold rounded-xl transition cursor-pointer"
                  >
                    Copy Invitation
                  </button>
                </div>

                {currentSelectedMeeting.meeting_id !== '8473921056' && (
                  <button
                    onClick={() => handleDeleteMeeting(currentSelectedMeeting.meeting_id)}
                    className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Delete Meeting"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TEAM CHAT / CONTACTS / WHITEBOARDS PREVIEW STATES                  */}
        {/* ========================================================================= */}
        {activeTab === 'chat' && (
          <section className="bg-white rounded-3xl border border-zinc-200/80 p-10 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0e71eb] flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Team Chat</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Chat in real-time with team channels, direct messages, and in-meeting transcripts.
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="px-4 py-2 bg-[#0e71eb] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Back to Home
            </button>
          </section>
        )}

        {activeTab === 'contacts' && (
          <section className="bg-white rounded-3xl border border-zinc-200/80 p-10 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0e71eb] flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Contacts & Directory</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Connect with teammates, view presence statuses, and start instant video calls.
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="px-4 py-2 bg-[#0e71eb] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Back to Home
            </button>
          </section>
        )}

        {activeTab === 'whiteboards' && (
          <section className="bg-white rounded-3xl border border-zinc-200/80 p-10 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0e71eb] flex items-center justify-center mx-auto">
              <PenTool className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Zoom Whiteboards</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Brainstorm, diagram, and collaborate visually with your team during meetings.
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="px-4 py-2 bg-[#0e71eb] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Back to Home
            </button>
          </section>
        )}

        {activeTab === 'notes' && (
          <section className="bg-white rounded-3xl border border-zinc-200/80 p-10 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0e71eb] flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Meeting Notes</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Take rich meeting minutes and assign follow-up action items with your team.
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="px-4 py-2 bg-[#0e71eb] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Back to Home
            </button>
          </section>
        )}
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
