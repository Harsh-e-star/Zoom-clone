'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Users,
  MessageSquare,
  Smile,
  PhoneOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isParticipantsOpen: boolean;
  isChatOpen: boolean;
  participantCount: number;
  unreadCount?: number;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onLeaveClick: () => void;
  onReaction: (emoji: string) => void;
}

export function MeetingControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isParticipantsOpen,
  isChatOpen,
  participantCount,
  unreadCount = 0,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleParticipants,
  onToggleChat,
  onLeaveClick,
  onReaction,
}: MeetingControlsProps) {
  const [showReactions, setShowReactions] = useState(false);

  const reactionEmojis = [
    { emoji: '👏', label: 'Clap' },
    { emoji: '👍', label: 'Thumbs Up' },
    { emoji: '❤️', label: 'Heart' },
    { emoji: '😂', label: 'Joy' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '🎉', label: 'Celebrate' },
  ];

  const handleEmojiSelect = (emoji: string) => {
    onReaction(emoji);
    setShowReactions(false);

    if (emoji === '🎉') {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.8 },
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  };

  return (
    <footer className="relative w-full bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-4 py-2.5 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left Side: Audio & Video Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Microphone */}
          <button
            onClick={onToggleMute}
            type="button"
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[56px] ${
              isMuted
                ? 'bg-rose-950/80 text-rose-400 hover:bg-rose-900 border border-rose-800/60'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] mt-1 font-medium">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* Camera */}
          <button
            onClick={onToggleVideo}
            type="button"
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[56px] ${
              isVideoOff
                ? 'bg-rose-950/80 text-rose-400 hover:bg-rose-900 border border-rose-800/60'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
            }`}
            title={isVideoOff ? 'Start video' : 'Stop video'}
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
            <span className="text-[10px] mt-1 font-medium">
              {isVideoOff ? 'Start Video' : 'Stop Video'}
            </span>
          </button>
        </div>

        {/* Center: Collaboration Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Share Screen */}
          <button
            onClick={onToggleScreenShare}
            type="button"
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[64px] ${
              isScreenSharing
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800/80'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">
              {isScreenSharing ? 'Stop Share' : 'Share'}
            </span>
          </button>

          {/* Participants */}
          <button
            onClick={onToggleParticipants}
            type="button"
            className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[64px] ${
              isParticipantsOpen
                ? 'bg-blue-950/80 text-blue-400 border border-blue-800'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
            }`}
            title="Toggle participants panel"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Participants</span>
            {participantCount > 0 && (
              <span className="absolute top-1.5 right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-zinc-700 text-white border border-zinc-600">
                {participantCount}
              </span>
            )}
          </button>

          {/* Chat */}
          <button
            onClick={onToggleChat}
            type="button"
            className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[56px] ${
              isChatOpen
                ? 'bg-blue-950/80 text-blue-400 border border-blue-800'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
            }`}
            title="Toggle meeting chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-500 text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Reactions Popover */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              type="button"
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition min-w-[56px] ${
                showReactions
                  ? 'bg-zinc-800 text-yellow-400'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
              title="Send a reaction"
            >
              <Smile className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Reactions</span>
            </button>

            {showReactions && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-2xl p-2 shadow-2xl flex items-center gap-1 animate-in zoom-in-95 duration-100 z-50">
                {reactionEmojis.map(({ emoji, label }) => (
                  <button
                    key={label}
                    onClick={() => handleEmojiSelect(emoji)}
                    type="button"
                    className="p-2 text-xl hover:scale-125 hover:bg-zinc-800 rounded-xl transition transform"
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: End / Leave Button */}
        <div>
          <button
            onClick={onLeaveClick}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-900/30 transition transform hover:scale-102"
          >
            <PhoneOff className="w-4 h-4 fill-current" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
