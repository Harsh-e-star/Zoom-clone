'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Monitor, Hand, MoreHorizontal, Pin, Volume2 } from 'lucide-react';
import { Participant } from '@/types/meeting';
import { WebRTCParticipant } from '@/types/webrtc';

interface VideoTileProps {
  participant: Participant | WebRTCParticipant | {
    id?: number | string;
    participant_id?: string;
    display_name: string;
    role?: string;
    is_muted?: boolean;
    is_camera_off?: boolean;
    camera_enabled?: boolean;
  };
  isLocal?: boolean;
  stream?: MediaStream | null;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenShare?: boolean;
  screenStream?: MediaStream | null;
  isActiveSpeaker?: boolean;
  hasHandRaised?: boolean;
}

export function VideoTile({
  participant,
  isLocal = false,
  stream = null,
  isMuted = false,
  isVideoOff = false,
  isScreenShare = false,
  screenStream = null,
  isActiveSpeaker = false,
  hasHandRaised = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [needsAudioInteraction, setNeedsAudioInteraction] = useState(false);

  // Manage Video element source
  useEffect(() => {
    if (videoRef.current) {
      if (isScreenShare && screenStream) {
        if (videoRef.current.srcObject !== screenStream) {
          videoRef.current.srcObject = screenStream;
        }
      } else if (stream && !isVideoOff) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, screenStream, isVideoOff, isScreenShare]);

  // Manage Remote Audio element source (Guaranteed audio even if camera is off)
  useEffect(() => {
    if (!isLocal && stream && audioRef.current) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
      }
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setNeedsAudioInteraction(false);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('[VideoTile] Remote audio autoplay blocked:', err);
              setNeedsAudioInteraction(true);
            }
          });
      }
    }
  }, [stream, isLocal]);

  const handleEnableAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setNeedsAudioInteraction(false)).catch(console.warn);
    }
  };

  const initials = participant.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Zoom-style subtle professional avatar colors
  const avatarColors = [
    'bg-[#0e71eb]',
    'bg-[#2d8cff]',
    'bg-[#3b4856]',
    'bg-[#2b6cb0]',
  ];
  const colorIndex =
    Math.abs(
      participant.display_name
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % avatarColors.length;
  const avatarBg = avatarColors[colorIndex];

  return (
    <div
      data-testid={isLocal ? "local-video-tile" : "remote-video-tile"}
      data-local={isLocal ? "true" : "false"}
      data-video-off={isVideoOff ? "true" : "false"}
      className={`relative w-full h-full min-h-[220px] sm:min-h-[280px] rounded-xl sm:rounded-2xl overflow-hidden bg-[#18181b] flex items-center justify-center select-none shadow-md transition-all duration-150 group ${
        isActiveSpeaker && !isMuted
          ? 'border-2 border-[#22c55e]'
          : 'border border-[#26272e]'
      }`}
    >
      {/* 1. Video Stream Element */}
      {(stream && !isVideoOff) || (isScreenShare && screenStream) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${
            isLocal && !isScreenShare ? 'scale-x-[-1]' : ''
          }`}
        />
      ) : (
        /* 2. Video Off State: Zoom Authentic Circular Initial & Voice Wave */
        <div className="flex flex-col items-center justify-center p-6">
          <div className="relative">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${avatarBg} text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-xl tracking-wider select-none`}
            >
              {initials}
            </div>
            {/* Pulsing Audio Ring when Speaking with Video Off */}
            {isActiveSpeaker && !isMuted && (
              <span className="absolute -inset-2 rounded-full border-2 border-[#22c55e] animate-ping pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* 3. Top-Left Indicators (Raised Hand / Screen Sharing) */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
        {hasHandRaised && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#24252e]/95 text-yellow-400 border border-yellow-500/60 text-xs font-bold shadow-lg animate-bounce">
            <Hand className="w-4 h-4 fill-current" />
            <span>Hand Raised</span>
          </div>
        )}

        {isScreenShare && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#132c1c]/90 text-[#22c55e] border border-[#22c55e]/50 text-[10px] font-bold">
            <Monitor className="w-3 h-3" />
            <span>Screen</span>
          </div>
        )}

        {isPinned && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-900/80 text-blue-200 text-[10px] font-bold">
            <Pin className="w-3 h-3" />
            <span>Pinned</span>
          </div>
        )}
      </div>

      {/* 4. Top-Right Hover Menu (Zoom Desktop Style) */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition cursor-pointer"
            title="Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-[#23232b] border border-[#3b3c48] rounded-xl shadow-2xl py-1 text-xs text-white z-20 text-left">
              <button
                type="button"
                onClick={() => {
                  setIsPinned(!isPinned);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-1.5 hover:bg-[#2f303c] transition flex items-center gap-2"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>{isPinned ? 'Unpin' : 'Pin'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Zoom Authentic Bottom-Left Name Badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-white text-xs font-semibold max-w-[85%] truncate z-10">
        {/* Muted / Unmuted Icon */}
        {isMuted ? (
          <div className="w-4 h-4 rounded-xs bg-[#ff4d4f] flex items-center justify-center shrink-0">
            <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-0.5 shrink-0">
            <Mic className="w-3.5 h-3.5 text-white" />
            {isActiveSpeaker && (
              <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
            )}
          </div>
        )}

        <span className="truncate">
          {participant.display_name}
          {isLocal && ' (Host, me)'}
        </span>
      </div>

      {/* 6. Hidden Remote Audio Element (Always alive for peer audio) */}
      {!isLocal && stream && (
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      )}

      {/* 7. Autoplay Blocked Banner */}
      {needsAudioInteraction && (
        <div
          onClick={handleEnableAudio}
          className="absolute inset-0 z-20 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-black/60 transition"
        >
          <div className="w-10 h-10 rounded-full bg-[#0e71eb] text-white flex items-center justify-center mb-2 shadow-lg animate-pulse">
            <Volume2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-white mb-0.5">Audio Blocked by Browser</p>
          <p className="text-[11px] text-zinc-300">Click to enable remote audio</p>
        </div>
      )}
    </div>
  );
}
