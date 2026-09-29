'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  Smile,
  ShieldCheck,
  Disc,
  Hand,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isParticipantsOpen: boolean;
  isChatOpen: boolean;
  isRecording?: boolean;
  hasHandRaised?: boolean;
  participantCount: number;
  unreadCount?: number;
  isHost?: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onToggleRecord?: () => void;
  onToggleHand?: () => void;
  onLeaveClick: () => void;
  onSecurityClick?: () => void;
  onReaction: (emoji: string) => void;
}

export function MeetingControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isParticipantsOpen,
  isChatOpen,
  isRecording = false,
  hasHandRaised = false,
  participantCount,
  unreadCount = 0,
  isHost = true,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleParticipants,
  onToggleChat,
  onToggleRecord,
  onToggleHand,
  onLeaveClick,
  onSecurityClick,
  onReaction,
}: MeetingControlsProps) {
  const [showReactions, setShowReactions] = useState(false);

  const reactionEmojis = [
    { emoji: '👏', label: 'Clap' },
    { emoji: '👍', label: 'Thumbs Up' },
    { emoji: '❤️', label: 'Heart' },
    { emoji: '😂', label: 'Joy' },
    { emoji: '😮', label: 'Open Mouth' },
    { emoji: '🎉', label: 'Party' },
  ];

  const handleEmojiSelect = (emoji: string) => {
    onReaction(emoji);
    setShowReactions(false);

    if (emoji === '🎉') {
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.85 },
        });
      } catch (err) {
        console.warn('Confetti effect:', err);
      }
    }
  };

  return (
    <footer className="relative w-full bg-[#18181b] text-white border-t border-[#26272e] px-3 sm:px-6 py-2 z-40 select-none font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* 1. Left Group: Audio & Video Controls (with Zoom chevron split) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mute / Unmute */}
          <div className="flex items-center">
            <button
              onClick={onToggleMute}
              type="button"
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition min-w-[56px] hover:bg-[#25262e] cursor-pointer ${
                isMuted ? 'text-[#ff4d4f]' : 'text-zinc-200'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-[#ff4d4f]" />
              ) : (
                <div className="relative">
                  <Mic className="w-5 h-5 text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                </div>
              )}
              <span className="text-[10px] font-medium mt-1">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>
            <button
              type="button"
              className="p-1 text-zinc-400 hover:text-white hover:bg-[#25262e] rounded-md transition -ml-1 cursor-pointer"
              title="Audio Options"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Start / Stop Video */}
          <div className="flex items-center">
            <button
              onClick={onToggleVideo}
              type="button"
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition min-w-[56px] hover:bg-[#25262e] cursor-pointer ${
                isVideoOff ? 'text-[#ff4d4f]' : 'text-zinc-200'
              }`}
              title={isVideoOff ? 'Start Video' : 'Stop Video'}
            >
              {isVideoOff ? (
                <VideoOff className="w-5 h-5 text-[#ff4d4f]" />
              ) : (
                <Video className="w-5 h-5 text-white" />
              )}
              <span className="text-[10px] font-medium mt-1">
                {isVideoOff ? 'Start Video' : 'Stop Video'}
              </span>
            </button>
            <button
              type="button"
              className="p-1 text-zinc-400 hover:text-white hover:bg-[#25262e] rounded-md transition -ml-1 cursor-pointer"
              title="Video Options"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. Center Group: Zoom Collaboration Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Security Shield */}
          <button
            onClick={onSecurityClick}
            type="button"
            className="flex flex-col items-center justify-center p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-[#25262e] transition min-w-[56px] cursor-pointer"
            title="Security"
          >
            <ShieldCheck className="w-5 h-5 text-[#22c55e]" />
            <span className="text-[10px] font-medium mt-1">Security</span>
          </button>

          {/* Participants */}
          <button
            onClick={onToggleParticipants}
            type="button"
            className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg transition min-w-[62px] cursor-pointer ${
              isParticipantsOpen
                ? 'bg-[#2b2c37] text-[#0e71eb]'
                : 'text-zinc-300 hover:text-white hover:bg-[#25262e]'
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Participants</span>
            {participantCount > 0 && (
              <span className="absolute top-1 right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#0e71eb] text-white">
                {participantCount}
              </span>
            )}
          </button>

          {/* Chat */}
          <button
            onClick={onToggleChat}
            type="button"
            className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg transition min-w-[56px] cursor-pointer ${
              isChatOpen
                ? 'bg-[#2b2c37] text-[#0e71eb]'
                : 'text-zinc-300 hover:text-white hover:bg-[#25262e]'
            }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#0e71eb] text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Share Screen (Zoom Signature Green Button) */}
          <button
            onClick={onToggleScreenShare}
            type="button"
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition min-w-[68px] cursor-pointer ${
              isScreenSharing
                ? 'bg-[#183623] text-[#22c55e]'
                : 'text-[#22c55e] hover:bg-[#1a2e21]'
            }`}
            title={isScreenSharing ? 'Stop Share Screen' : 'Share Screen'}
          >
            <div className="w-6 h-5 rounded-md bg-[#22c55e] flex items-center justify-center shadow-xs">
              <svg
                className="w-3.5 h-3.5 text-zinc-950 font-bold"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold mt-1 text-[#22c55e]">
              {isScreenSharing ? 'Stop Share' : 'Share Screen'}
            </span>
          </button>

          {/* Record */}
          <button
            onClick={onToggleRecord}
            type="button"
            className={`hidden sm:flex flex-col items-center justify-center p-1.5 rounded-lg transition min-w-[56px] cursor-pointer ${
              isRecording
                ? 'text-[#ff4d4f] bg-rose-950/60'
                : 'text-zinc-300 hover:text-white hover:bg-[#25262e]'
            }`}
            title="Record"
          >
            <Disc className={`w-5 h-5 ${isRecording ? 'animate-pulse text-[#ff4d4f]' : ''}`} />
            <span className="text-[10px] font-medium mt-1">
              {isRecording ? 'Recording' : 'Record'}
            </span>
          </button>

          {/* Reactions Popover with Raise Hand */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              type="button"
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition min-w-[56px] cursor-pointer ${
                showReactions || hasHandRaised
                  ? 'bg-[#2b2c37] text-yellow-400'
                  : 'text-zinc-300 hover:text-white hover:bg-[#25262e]'
              }`}
              title="Reactions"
            >
              <Smile className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">Reactions</span>
            </button>

            {/* Authentic Zoom Reactions Modal with Raise Hand */}
            {showReactions && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#24252e] border border-[#3b3c48] rounded-2xl p-3 shadow-2xl z-50 w-64 animate-in zoom-in-95 duration-100">
                {/* 6 Quick Emoji Reactions */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#3b3c48]">
                  {reactionEmojis.map(({ emoji, label }) => (
                    <button
                      key={label}
                      onClick={() => handleEmojiSelect(emoji)}
                      type="button"
                      className="p-1 text-2xl hover:scale-130 transition-transform cursor-pointer"
                      title={label}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Iconic Zoom "Raise Hand" Action Button */}
                <div className="pt-2.5">
                  <button
                    onClick={() => {
                      if (onToggleHand) onToggleHand();
                      setShowReactions(false);
                    }}
                    type="button"
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      hasHandRaised
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'bg-[#2f303c] hover:bg-[#383a48] text-white'
                    }`}
                  >
                    <Hand className="w-4 h-4 text-yellow-400" />
                    <span>{hasHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Right Group: Zoom Iconic Red "End" / "Leave" Button */}
        <div>
          <button
            onClick={onLeaveClick}
            type="button"
            className="px-4 py-1.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#e02828] hover:bg-[#c91f1f] shadow-sm transition active:scale-95 cursor-pointer"
          >
            {isHost ? 'End' : 'Leave'}
          </button>
        </div>
      </div>
    </footer>
  );
}
