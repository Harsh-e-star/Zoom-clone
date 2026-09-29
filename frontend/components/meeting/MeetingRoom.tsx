'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Info,
  Clock,
} from 'lucide-react';
import { useMeeting } from '@/lib/hooks/useMeeting';
import { useLocalMedia } from '@/lib/hooks/useLocalMedia';
import { VideoTile } from './VideoTile';
import { MeetingControls } from './MeetingControls';
import { ParticipantPanel } from './ParticipantPanel';
import { ChatPanel } from './ChatPanel';
import { LeaveDialog } from './LeaveDialog';
import { MeetingInfoModal } from './MeetingInfoModal';
import { LoadingState } from '../ui/LoadingState';

interface MeetingRoomProps {
  meetingId: string;
}

export function MeetingRoom({ meetingId }: MeetingRoomProps) {
  const router = useRouter();

  // Read stored screen name preference or default to Harsh
  const [userName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('meetspace_user_name') || 'Harsh';
    }
    return 'Harsh';
  });

  // State hooks
  const {
    meeting,
    participants,
    messages,
    isLoading,
    error,
    reactions,
    durationFormatted,
    sendChat,
    muteAll,
    removeUser,
    toggleParticipantMute,
    triggerReaction,
  } = useMeeting(meetingId, userName);

  const {
    stream,
    screenStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useLocalMedia();

  // Panel state
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
      setIsFullscreen(false);
    }
  };

  const handleConfirmLeave = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-white">
        <LoadingState message="Connecting to secure meeting room..." />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <Info className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Meeting Not Found</h2>
          <p className="text-sm text-zinc-400 mb-6">
            {error || 'The requested meeting ID does not exist or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Build the list of participants to render
  // Find local user in participants or create placeholder
  const localParticipant = participants.find(
    (p) => p.display_name === userName
  ) || {
    id: 9999,
    meeting_id: meeting.meeting_id,
    display_name: userName,
    role: (userName === 'Harsh' ? 'host' : 'participant') as 'host' | 'participant',
    is_muted: isMuted,
    is_camera_off: isVideoOff,
    joined_at: new Date().toISOString(),
  };

  const remoteParticipants = participants.filter(
    (p) => p.display_name !== userName
  );

  return (
    <div className="relative h-screen w-full bg-zinc-950 flex flex-col overflow-hidden text-white font-sans select-none">
      {/* 1. TOP HEADER BAR */}
      <header className="relative z-30 h-14 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 flex items-center justify-between">
        {/* Left: Security Info & Meeting Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 text-xs font-semibold transition"
            title="Meeting Information & Passcode"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Encrypted</span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-zinc-100 truncate max-w-xs sm:max-w-md">
              {meeting.title}
            </h1>
            <span className="hidden md:inline-block text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              ID: {meeting.meeting_id}
            </span>
          </div>
        </div>

        {/* Center: Live Meeting Duration Timer */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono font-medium text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>{durationFormatted}</span>
        </div>

        {/* Right: View & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery')
            }
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-1.5 transition"
            title="Switch View Mode"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline capitalize">{viewMode} View</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN VIDEO STAGE */}
      <main className="relative flex-1 p-3 sm:p-4 overflow-hidden flex items-center justify-center">
        {/* Floating Reactions Emojis */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="absolute bottom-16 left-1/4 sm:left-1/3 text-4xl sm:text-5xl animate-bounce transition-all duration-1000 transform -translate-y-24 opacity-90"
              style={{
                animationDuration: '2.5s',
              }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Case A: Screen Sharing Active -> Presentation Mode */}
        {isScreenSharing && screenStream ? (
          <div className="w-full h-full flex flex-col lg:flex-row gap-3">
            {/* Main Screen Stream */}
            <div className="flex-1 h-full min-h-[300px]">
              <VideoTile
                participant={localParticipant}
                isLocal={true}
                isScreenShare={true}
                screenStream={screenStream}
              />
            </div>

            {/* Side Filmstrip */}
            <div className="w-full lg:w-72 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 max-h-48 lg:max-h-full">
              <div className="w-48 lg:w-full h-32 shrink-0">
                <VideoTile
                  participant={localParticipant}
                  isLocal={true}
                  stream={stream}
                  isMuted={isMuted}
                  isVideoOff={isVideoOff}
                />
              </div>
              {remoteParticipants.map((p) => (
                <div key={p.id} className="w-48 lg:w-full h-32 shrink-0">
                  <VideoTile
                    participant={p}
                    isMuted={p.is_muted}
                    isVideoOff={p.is_camera_off}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Case B: Standard Video Grid (1, 2, 3, 4+ tiles) */
          <div
            className={`w-full h-full max-w-6xl grid gap-3 sm:gap-4 items-center justify-center ${
              remoteParticipants.length === 0
                ? 'grid-cols-1'
                : remoteParticipants.length === 1
                ? 'grid-cols-1 md:grid-cols-2'
                : remoteParticipants.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
            }`}
          >
            {/* Local Video Tile */}
            <VideoTile
              participant={localParticipant}
              isLocal={true}
              stream={stream}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              isActiveSpeaker={!isMuted}
            />

            {/* Remote Participants Video Tiles */}
            {remoteParticipants.map((p, idx) => (
              <VideoTile
                key={p.id}
                participant={p}
                isMuted={p.is_muted}
                isVideoOff={p.is_camera_off}
                isActiveSpeaker={idx === 0 && !p.is_muted}
              />
            ))}
          </div>
        )}
      </main>

      {/* 3. BOTTOM CONTROL BAR */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isParticipantsOpen={isParticipantsOpen}
        isChatOpen={isChatOpen}
        participantCount={participants.length || 1}
        unreadCount={0}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleParticipants={() => {
          setIsParticipantsOpen(!isParticipantsOpen);
          if (!isParticipantsOpen) setIsChatOpen(false);
        }}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) setIsParticipantsOpen(false);
        }}
        onLeaveClick={() => setIsLeaveOpen(true)}
        onReaction={triggerReaction}
      />

      {/* 4. SIDE PANELS */}
      <ParticipantPanel
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        participants={participants}
        onMuteAll={muteAll}
        onRemoveParticipant={removeUser}
        onToggleMute={toggleParticipantMute}
      />

      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        currentUserName={userName}
        onSendMessage={sendChat}
      />

      {/* 5. MODALS */}
      <LeaveDialog
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
        onConfirmLeave={handleConfirmLeave}
        isHost={userName === 'Harsh'}
      />

      <MeetingInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        meeting={meeting}
      />
    </div>
  );
}
