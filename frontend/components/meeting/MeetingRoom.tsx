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
  ChevronDown,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useWebRTCMeeting } from '@/lib/hooks/useWebRTCMeeting';
import { VideoTile } from './VideoTile';
import { MeetingControls } from './MeetingControls';
import { ParticipantPanel } from './ParticipantPanel';
import { ChatPanel } from './ChatPanel';
import { LeaveDialog } from './LeaveDialog';
import { MeetingInfoModal } from './MeetingInfoModal';
import { LoadingState } from '../ui/LoadingState';
import { useToast } from '../ui/Toast';

interface MeetingRoomProps {
  meetingId: string;
}

export function MeetingRoom({ meetingId }: MeetingRoomProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // Read stored user name from auth storage or preference, defaulting to Harsh
  const [userName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('meetspace_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.name) return parsed.name;
        } catch {}
      }
      return sessionStorage.getItem('meetspace_user_name') || 'Harsh';
    }
    return 'Harsh';
  });


  // Comprehensive WebRTC Meeting Hook (Signaling, Media, Peer Mesh, Host Moderation)
  const {
    meeting,
    meetingTitle,
    isHost,
    isLoading,
    error,
    durationFormatted,
    connectionStatus,
    localParticipant,
    remoteParticipants,
    localStream,
    screenStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    sendChat,
    messages,
    reactions,
    triggerReaction,
    hostMuteAll,
    hostRemoveParticipant,
    hostEndMeeting,
    leaveMeeting,
  } = useWebRTCMeeting(meetingId, userName);

  // Panel & Action states
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [hasHandRaised, setHasHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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

  const handleToggleHand = () => {
    const nextState = !hasHandRaised;
    setHasHandRaised(nextState);
    showToast(nextState ? 'Hand raised' : 'Hand lowered', 'info');
  };

  const handleToggleRecord = () => {
    const nextState = !isRecording;
    setIsRecording(nextState);
    showToast(
      nextState
        ? 'Recording started (simulated cloud recording)'
        : 'Recording stopped',
      'info'
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#000000] flex flex-col items-center justify-center text-white">
        <LoadingState message="Connecting to secure Zoom meeting room..." />
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <div className="h-screen w-full bg-[#000000] flex flex-col items-center justify-center text-white p-6 text-center select-none font-sans">
        <div className="max-w-md p-8 bg-[#1f2026] border border-[#3b3c48] rounded-3xl shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <Info className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Meeting Not Found</h2>
          <p className="text-xs text-zinc-400 mb-6">
            {error || 'The requested meeting ID does not exist or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#0b5cff] hover:bg-[#004be5] text-white transition cursor-pointer"
          >
            Return to MeetSpace Workplace
          </button>
        </div>
      </div>
    );
  }

  // Check if any remote peer is sharing screen
  const remoteScreenSharer = remoteParticipants.find((p) => p.screen_sharing);

  return (
    <div className="relative h-screen w-full bg-[#000000] flex flex-col overflow-hidden text-white font-sans select-none">
      {/* 1. TOP HEADER BAR (Zoom Pure Styling) */}
      <header className="relative z-30 h-12 bg-[#121214]/90 backdrop-blur-md border-b border-[#26272e] px-4 flex items-center justify-between">
        {/* Left: Green Shield Meeting Info Icon + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            className="flex items-center gap-1.5 p-1 rounded-md hover:bg-[#25262e] text-[#22c55e] transition cursor-pointer"
            title="Meeting Information & Passcode"
          >
            <div className="w-5 h-5 rounded-full bg-[#0e8a16]/20 border border-[#0e8a16] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-emerald-400">
              Encrypted
            </span>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold text-zinc-100 truncate max-w-xs sm:max-w-md">
              {meetingTitle || meeting?.title || 'MeetSpace Meeting'}
            </h1>
          </div>

          {/* Connection Quality Indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              connectionStatus === 'connected'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                : connectionStatus === 'reconnecting'
                ? 'bg-amber-950/40 border-amber-800 text-amber-400 animate-pulse'
                : 'bg-rose-950/40 border-rose-800 text-rose-400'
            }`}
          >
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-amber-400" />
            )}
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Center: Live Timer & Recording Indicator */}
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-[11px] font-bold text-rose-400">
              <span className="w-2 h-2 rounded-full bg-[#ff4d4f] animate-ping" />
              <span>Recording</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{durationFormatted}</span>
          </div>
        </div>

        {/* Right: View Mode & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Zoom "View" Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
              className="px-2.5 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-[#25262e] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="View Options"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="capitalize">View</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isViewMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-[#23232b] border border-[#3b3c48] rounded-xl shadow-2xl z-50 py-1 text-xs text-left">
                <button
                  onClick={() => {
                    setViewMode('speaker');
                    setIsViewMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 hover:bg-[#2f303c] transition ${
                    viewMode === 'speaker' ? 'text-[#0e71eb] font-bold' : 'text-zinc-200'
                  }`}
                >
                  Speaker View
                </button>
                <button
                  onClick={() => {
                    setViewMode('gallery');
                    setIsViewMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 hover:bg-[#2f303c] transition ${
                    viewMode === 'gallery' ? 'text-[#0e71eb] font-bold' : 'text-zinc-200'
                  }`}
                >
                  Gallery View
                </button>
                <div className="border-t border-[#3b3c48] my-1" />
                <button
                  onClick={() => {
                    handleToggleFullscreen();
                    setIsViewMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#2f303c] text-zinc-200 transition"
                >
                  {isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#25262e] transition cursor-pointer"
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
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
      <main className="relative flex-1 p-3 sm:p-4 overflow-hidden flex items-center justify-center bg-[#000000]">
        {/* Floating Reactions Emojis */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="absolute bottom-16 left-1/3 text-4xl sm:text-5xl animate-bounce transition-all duration-1000 transform -translate-y-24 opacity-90"
              style={{
                animationDuration: '2.5s',
              }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Case A: Screen Sharing Active (Local or Remote) -> Presentation Mode */}
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
                  stream={localStream}
                  isMuted={isMuted}
                  isVideoOff={isVideoOff}
                  hasHandRaised={hasHandRaised}
                />
              </div>
              {remoteParticipants.map((p) => (
                <div key={p.participant_id} className="w-48 lg:w-full h-32 shrink-0">
                  <VideoTile
                    participant={p}
                    stream={remoteStreams[p.participant_id] || null}
                    isMuted={p.is_muted}
                    isVideoOff={!p.camera_enabled}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : remoteScreenSharer ? (
          <div className="w-full h-full flex flex-col lg:flex-row gap-3">
            {/* Remote Screen Stream */}
            <div className="flex-1 h-full min-h-[300px]">
              <VideoTile
                participant={remoteScreenSharer}
                isScreenShare={true}
                screenStream={remoteStreams[remoteScreenSharer.participant_id] || null}
                stream={remoteStreams[remoteScreenSharer.participant_id] || null}
              />
            </div>

            {/* Side Filmstrip */}
            <div className="w-full lg:w-72 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 max-h-48 lg:max-h-full">
              <div className="w-48 lg:w-full h-32 shrink-0">
                <VideoTile
                  participant={localParticipant}
                  isLocal={true}
                  stream={localStream}
                  isMuted={isMuted}
                  isVideoOff={isVideoOff}
                  hasHandRaised={hasHandRaised}
                />
              </div>
              {remoteParticipants.map((p) => (
                <div key={p.participant_id} className="w-48 lg:w-full h-32 shrink-0">
                  <VideoTile
                    participant={p}
                    stream={remoteStreams[p.participant_id] || null}
                    isMuted={p.is_muted}
                    isVideoOff={!p.camera_enabled}
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
                ? 'grid-cols-1 max-w-3xl'
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
              stream={localStream}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              isActiveSpeaker={!isMuted}
              hasHandRaised={hasHandRaised}
            />

            {/* Remote Participants Video Tiles */}
            {remoteParticipants.map((p, idx) => (
              <VideoTile
                key={p.participant_id}
                participant={p}
                stream={remoteStreams[p.participant_id] || null}
                isMuted={p.is_muted}
                isVideoOff={!p.camera_enabled}
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
        isRecording={isRecording}
        hasHandRaised={hasHandRaised}
        participantCount={1 + remoteParticipants.length}
        unreadCount={0}
        isHost={isHost}
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
        onToggleRecord={handleToggleRecord}
        onToggleHand={handleToggleHand}
        onSecurityClick={() => setIsInfoOpen(!isInfoOpen)}
        onLeaveClick={() => setIsLeaveOpen(true)}
        onReaction={triggerReaction}
      />

      {/* 4. SIDE PANELS */}
      <ParticipantPanel
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        participants={[localParticipant, ...remoteParticipants]}
        onMuteAll={hostMuteAll}
        onRemoveParticipant={(id) => hostRemoveParticipant(String(id))}
        onToggleMute={(id) => console.log('Toggle mute for participant:', id)}
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
        onConfirmLeave={leaveMeeting}
        onEndMeetingForAll={hostEndMeeting}
        isHost={isHost}
      />

      <MeetingInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        meeting={meeting}
      />
    </div>
  );
}
