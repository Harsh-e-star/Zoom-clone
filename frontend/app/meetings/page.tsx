'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/providers/AuthProvider';
import {
  getUpcomingMeetings,
  getRecentMeetings,
  deleteMeeting,
} from '@/lib/api/meetings';
import { Meeting } from '@/types/meeting';
import {
  Plus,
  Play,
  Copy,
  Trash2,
  Calendar,
  Clock,
  Video,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RotateCw,
} from 'lucide-react';

export default function MeetingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous' | 'personal'>('upcoming');
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [previous, setPrevious] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const fetchMeetingsData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [up, prev] = await Promise.all([
        getUpcomingMeetings(),
        getRecentMeetings(),
      ]);
      setUpcoming(up);
      setPrevious(prev);
      if (up.length > 0) setSelectedMeeting(up[0]);
    } catch {
      addToast('Failed to load meetings from server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [up, prev] = await Promise.all([
          getUpcomingMeetings(),
          getRecentMeetings(),
        ]);
        if (!ignore) {
          setUpcoming(up);
          setPrevious(prev);
          if (up.length > 0) setSelectedMeeting(up[0]);
        }
      } catch {
        if (!ignore) addToast('Failed to load meetings from server', 'error');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [addToast]);

  const handleCopyInvite = (m: Meeting, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const text = `Topic: ${m.title}\nTime: ${new Date(m.scheduled_at || 0).toLocaleString()}\nJoin MeetSpace Meeting:\n${window.location.origin}/join/${m.meeting_id}\nMeeting ID: ${m.meeting_id}\nPasscode: ${m.passcode || '392105'}`;
    navigator.clipboard?.writeText(text);
    addToast('Meeting invitation copied to clipboard!', 'success');
  };

  const handleDelete = async (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await deleteMeeting(meetingId);
      addToast('Meeting deleted successfully', 'success');
      await fetchMeetingsData();
      if (selectedMeeting?.meeting_id === meetingId) {
        setSelectedMeeting(null);
      }
    } catch {
      addToast('Failed to delete meeting', 'error');
    }
  };

  const handleStartMeeting = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`);
  };

  const currentList = activeTab === 'upcoming' ? upcoming : activeTab === 'previous' ? previous : [];

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col font-sans">
      <Header activeTab="meetings" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Meetings
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Manage your upcoming conferences, previous recordings, and personal room.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMeetingsData}
              title="Refresh meetings"
              className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 rounded-xl transition cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/schedule"
              className="px-4 py-2 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-[#0b5cff]/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule a Meeting</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-zinc-200">
          <button
            onClick={() => {
              setActiveTab('upcoming');
              if (upcoming.length > 0) setSelectedMeeting(upcoming[0]);
            }}
            className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
              activeTab === 'upcoming'
                ? 'border-[#0b5cff] text-[#0b5cff]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('previous');
              if (previous.length > 0) setSelectedMeeting(previous[0]);
            }}
            className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
              activeTab === 'previous'
                ? 'border-[#0b5cff] text-[#0b5cff]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Previous ({previous.length})
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
              activeTab === 'personal'
                ? 'border-[#0b5cff] text-[#0b5cff]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Personal Room (PMI)
          </button>
        </div>

        {/* Content Layout */}
        {activeTab === 'personal' ? (
          /* Personal Room Tab */
          <div className="mt-8 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 max-w-3xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Permanent Host Space
                </span>
                <h2 className="text-xl font-bold text-zinc-900 mt-2">
                  Harsh&apos;s Personal Meeting Room
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Your dedicated virtual room that is always open with your Personal Meeting ID.
                </p>
              </div>
              <button
                onClick={() => handleStartMeeting('8473921056')}
                className="px-5 py-2.5 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-[#0b5cff]/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Room</span>
              </button>
            </div>

            <div className="mt-8 divide-y divide-zinc-100 text-xs">
              <div className="py-3.5 flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Personal Meeting ID</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  847 392 1056
                </span>
              </div>
              <div className="py-3.5 flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Passcode</span>
                <span className="font-mono font-bold text-zinc-900">392105</span>
              </div>
              <div className="py-3.5 flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Host</span>
                <span className="font-semibold text-zinc-900">Harsh (You)</span>
              </div>
              <div className="py-3.5 flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Invite Link</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-zinc-600 truncate max-w-xs">
                    {typeof window !== 'undefined' ? `${window.location.origin}/join/8473921056` : 'http://localhost:3000/join/8473921056'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `${window.location.origin}/join/8473921056`
                      );
                      addToast('Personal invite link copied!', 'success');
                    }}
                    className="text-[#0b5cff] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
              </div>
              <div className="py-3.5 flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Host Video</span>
                <span className="text-zinc-700">On</span>
              </div>
              <div className="py-3.5 flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Participants Video</span>
                <span className="text-zinc-700">On</span>
              </div>
              <div className="py-3.5 flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Audio Option</span>
                <span className="text-zinc-700">Computer Audio & VoIP</span>
              </div>
            </div>
          </div>
        ) : (
          /* Split View List & Details for Upcoming / Previous */
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Meetings list */}
            <div className="lg:col-span-5 space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 bg-white rounded-2xl border border-zinc-200 animate-pulse h-24"
                    />
                  ))}
                </div>
              ) : currentList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
                  <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-zinc-700">
                    No {activeTab} meetings found
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {activeTab === 'upcoming'
                      ? 'Schedule a new meeting to collaborate with your team.'
                      : 'Past conferences will appear here once ended.'}
                  </p>
                </div>
              ) : (
                currentList.map((m) => {
                  const isSelected = selectedMeeting?.meeting_id === m.meeting_id;
                  const date = new Date(m.scheduled_at || 0);
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMeeting(m)}
                      className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-[#0b5cff] shadow-sm ring-1 ring-[#0b5cff]'
                          : 'border-zinc-200/90 hover:border-zinc-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                        <span className="font-semibold text-blue-600">
                          {date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>
                          {date.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 truncate">
                        {m.title}
                      </h3>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
                        <span className="font-mono">ID: {m.meeting_id}</span>
                        <div className="flex items-center gap-1 text-[#0b5cff] font-semibold">
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Detail View */}
            <div className="lg:col-span-7">
              {selectedMeeting ? (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {selectedMeeting.status.toUpperCase()}
                      </span>
                      <h2 className="text-xl font-bold text-zinc-900 mt-2">
                        {selectedMeeting.title}
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        {selectedMeeting.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartMeeting(selectedMeeting.meeting_id)}
                        className="px-4 py-2 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-[#0b5cff]/20 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start</span>
                      </button>
                      <button
                        onClick={(e) => handleCopyInvite(selectedMeeting, e)}
                        title="Copy Invitation"
                        className="p-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl transition cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(selectedMeeting.meeting_id, e)}
                        title="Delete Meeting"
                        className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 divide-y divide-zinc-100 text-xs">
                    <div className="py-3 flex justify-between">
                      <span className="text-zinc-500 font-medium">When</span>
                      <span className="font-semibold text-zinc-900 text-right">
                        {new Date(selectedMeeting.scheduled_at || 0).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="py-3 flex justify-between">
                      <span className="text-zinc-500 font-medium">Duration</span>
                      <span className="text-zinc-800">
                        {selectedMeeting.duration_minutes} Minutes
                      </span>
                    </div>

                    <div className="py-3 flex justify-between">
                      <span className="text-zinc-500 font-medium">Meeting ID</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {selectedMeeting.meeting_id}
                      </span>
                    </div>

                    <div className="py-3 flex justify-between">
                      <span className="text-zinc-500 font-medium">Passcode</span>
                      <span className="font-mono text-zinc-800">
                        {selectedMeeting.passcode || '392105'}
                      </span>
                    </div>

                    <div className="py-3 flex justify-between items-center">
                      <span className="text-zinc-500 font-medium">Invite Link</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-600 truncate max-w-xs">
                          {selectedMeeting.invite_link}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedMeeting.invite_link);
                            addToast('Invite link copied!', 'success');
                          }}
                          className="text-[#0b5cff] hover:underline font-semibold"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-400 text-sm">
                  Select a meeting to view full conference details.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
