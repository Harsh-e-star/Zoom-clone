'use client';

import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Monitor } from 'lucide-react';
import { Participant } from '@/types/meeting';

interface VideoTileProps {
  participant: Participant;
  isLocal?: boolean;
  stream?: MediaStream | null;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenShare?: boolean;
  screenStream?: MediaStream | null;
  isActiveSpeaker?: boolean;
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
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attach stream to HTML5 video element when available
  useEffect(() => {
    if (videoRef.current) {
      if (isScreenShare && screenStream) {
        videoRef.current.srcObject = screenStream;
      } else if (stream && !isVideoOff) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, screenStream, isVideoOff, isScreenShare]);

  const initials = participant.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Random consistent gradient for avatars
  const avatarGradients = [
    'from-blue-600 to-indigo-700',
    'from-emerald-600 to-teal-700',
    'from-purple-600 to-pink-700',
    'from-amber-600 to-orange-700',
  ];
  const gradientIndex =
    Math.abs(
      participant.display_name
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % avatarGradients.length;
  const avatarGrad = avatarGradients[gradientIndex];

  return (
    <div
      className={`relative w-full h-full min-h-[180px] sm:min-h-[220px] rounded-2xl overflow-hidden bg-zinc-900 border transition-all duration-300 flex items-center justify-center select-none shadow-lg ${
        isActiveSpeaker
          ? 'border-emerald-500 ring-2 ring-emerald-500/40'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* 1. Video Element (when camera or screen sharing is active) */}
      {((stream && !isVideoOff) || (isScreenShare && screenStream)) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video element to avoid audio feedback loop
          className={`w-full h-full object-cover ${
            isLocal && !isScreenShare ? 'scale-x-[-1]' : ''
          }`}
        />
      ) : (
        /* 2. Video Off State: Zoom-style Avatar & Pulsing Voice Ring */
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="relative">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-tr ${avatarGrad} flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-2xl tracking-wider`}
            >
              {initials}
            </div>
            {/* Audio Wave Glow if not muted */}
            {!isMuted && (
              <span className="absolute -inset-1.5 rounded-full border-2 border-emerald-500/60 animate-ping pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* Screen Sharing Watermark Badge */}
      {isScreenShare && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md border border-emerald-800 text-[11px] font-semibold text-emerald-300">
          <Monitor className="w-3.5 h-3.5" />
          <span>Screen Sharing</span>
        </div>
      )}

      {/* Bottom Bar Details: Name & Mic Status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium max-w-[85%] truncate">
          {participant.role === 'host' && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-600/80 px-1.5 py-0.2 rounded text-white">
              Host
            </span>
          )}
          <span className="truncate">
            {participant.display_name}
            {isLocal ? ' (You)' : ''}
          </span>
        </div>

        {/* Audio Muted Indicator */}
        <div
          className={`p-1.5 rounded-lg backdrop-blur-md border text-xs ${
            isMuted
              ? 'bg-rose-950/80 border-rose-800 text-rose-300'
              : 'bg-black/60 border-white/10 text-emerald-400'
          }`}
          title={isMuted ? 'Muted' : 'Speaking'}
        >
          {isMuted ? (
            <MicOff className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
    </div>
  );
}
