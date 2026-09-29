'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreVertical,
  UserX,
  VolumeX,
} from 'lucide-react';
import { Participant } from '@/types/meeting';

interface ParticipantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUserId?: number;
  onMuteAll: () => void;
  onRemoveParticipant: (id: number) => void;
  onToggleMute: (id: number, currentMuted: boolean) => void;
}

export function ParticipantPanel({
  isOpen,
  onClose,
  participants,
  onMuteAll,
  onRemoveParticipant,
  onToggleMute,
}: ParticipantPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  if (!isOpen) return null;

  const filtered = participants.filter((p) =>
    p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-88 bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Participants ({participants.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-zinc-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filtered.map((p) => {
          const isHost = p.role === 'host';
          const isYou = p.display_name === 'Harsh';
          const isMenuOpen = activeMenuId === p.id;

          return (
            <div
              key={p.id}
              className="relative flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/60 transition group text-xs text-zinc-200"
            >
              <div className="flex items-center gap-2.5 truncate max-w-[65%]">
                <div className="w-7 h-7 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] shrink-0">
                  {p.display_name[0]?.toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium text-white truncate">
                      {p.display_name}
                    </span>
                    {isYou && (
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        (Me)
                      </span>
                    )}
                  </div>
                  {isHost && (
                    <span className="text-[10px] text-blue-400 font-semibold">
                      Host
                    </span>
                  )}
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleMute(p.id, p.is_muted)}
                  className={`p-1.5 rounded-lg transition ${
                    p.is_muted
                      ? 'text-rose-400 hover:bg-rose-950/60'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={p.is_muted ? 'Muted' : 'Unmuted'}
                >
                  {p.is_muted ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>

                <div
                  className={`p-1.5 rounded-lg ${
                    p.is_camera_off ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                  title={p.is_camera_off ? 'Video stopped' : 'Video running'}
                >
                  {p.is_camera_off ? (
                    <VideoOff className="w-3.5 h-3.5" />
                  ) : (
                    <Video className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* More options (Remove) */}
                {!isHost && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuId(isMenuOpen ? null : p.id)
                      }
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-1 w-36 rounded-xl bg-zinc-800 border border-zinc-700 shadow-2xl z-20 py-1 text-xs">
                        <button
                          onClick={() => {
                            onRemoveParticipant(p.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-zinc-700/60 transition"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Host Action: Mute All */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/40">
        <button
          onClick={onMuteAll}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition"
        >
          <VolumeX className="w-4 h-4 text-rose-400" />
          <span>Mute All</span>
        </button>
      </div>
    </aside>
  );
}
