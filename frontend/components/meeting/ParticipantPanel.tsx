'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  UserX,
  VolumeX,
  UserPlus,
} from 'lucide-react';
import { Participant } from '@/types/meeting';
import { useToast } from '../ui/Toast';

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
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isMuteAllModalOpen, setIsMuteAllModalOpen] = useState(false);
  const [allowSelfUnmute, setAllowSelfUnmute] = useState(true);

  if (!isOpen) return null;

  const filtered = participants.filter((p) =>
    p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirmMuteAll = () => {
    onMuteAll();
    setIsMuteAllModalOpen(false);
    showToast('All participants have been muted.', 'info');
  };

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Meeting invite URL copied to clipboard!', 'success');
  };

  return (
    <>
      <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-84 bg-[#1b1c22] border-l border-[#2e2f38] flex flex-col shadow-2xl animate-in slide-in-from-right duration-150 select-none text-white">
        {/* 1. Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2f38]">
          <div className="flex items-center gap-2 text-white font-bold text-xs tracking-tight">
            <span>Participants ({participants.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#282932] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Search Bar (Zoom Authentic Style) */}
        <div className="p-2.5 border-b border-[#2e2f38]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Find a participant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#282932] border border-[#3b3c48] rounded-md text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#0e71eb] transition"
            />
          </div>
        </div>

        {/* 3. Participants List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.map((p) => {
            const isHost = p.role === 'host' || p.display_name === 'Harsh';
            const isMe = p.display_name === 'Harsh';
            const isMenuOpen = activeMenuId === p.id;

            return (
              <div
                key={p.id}
                className="relative flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[#282932] transition group text-xs text-zinc-200"
              >
                {/* Left: Avatar & Name */}
                <div className="flex items-center gap-2.5 truncate max-w-[60%]">
                  <div className="w-6 h-6 rounded-full bg-[#0e71eb] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {p.display_name[0]?.toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-medium text-white truncate block">
                      {p.display_name}
                      {isMe ? ' (Host, me)' : isHost ? ' (Host)' : ''}
                    </span>
                  </div>
                </div>

                {/* Right: Default Status Icons & Hover Actions (Zoom Pure UX) */}
                <div className="flex items-center gap-1">
                  {/* Default State: Mic & Camera Icons */}
                  <div className="flex items-center gap-1 group-hover:hidden">
                    {p.is_muted ? (
                      <MicOff className="w-3.5 h-3.5 text-[#ff4d4f]" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-zinc-300" />
                    )}
                    {p.is_camera_off ? (
                      <VideoOff className="w-3.5 h-3.5 text-zinc-500" />
                    ) : (
                      <Video className="w-3.5 h-3.5 text-zinc-300" />
                    )}
                  </div>

                  {/* Zoom Hover Action Buttons: [Mute] [More] */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => onToggleMute(p.id, p.is_muted)}
                      type="button"
                      className="px-2 py-0.5 bg-[#0e71eb] hover:bg-[#0b5ed7] text-white rounded text-[11px] font-bold transition cursor-pointer"
                    >
                      {p.is_muted ? 'Unmute' : 'Mute'}
                    </button>

                    {!isMe && (
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : p.id)}
                          type="button"
                          className="px-1.5 py-0.5 bg-[#3a3b47] hover:bg-[#484957] text-zinc-200 rounded text-[11px] font-semibold transition cursor-pointer"
                        >
                          More
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-32 rounded-xl bg-[#23232b] border border-[#3b3c48] shadow-2xl z-50 py-1 text-xs text-left">
                            <button
                              onClick={() => {
                                onRemoveParticipant(p.id);
                                setActiveMenuId(null);
                                showToast(`${p.display_name} removed`, 'info');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
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
              </div>
            );
          })}
        </div>

        {/* 4. Zoom Authentic Bottom Toolbar: [Invite] [Mute All] */}
        <div className="p-3 border-t border-[#2e2f38] bg-[#17181e] flex items-center justify-between gap-2">
          <button
            onClick={handleCopyInvite}
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-[#282932] hover:bg-[#343540] text-zinc-200 hover:text-white border border-[#3b3c48] text-xs font-semibold transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>

          <button
            onClick={() => setIsMuteAllModalOpen(true)}
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-[#282932] hover:bg-[#343540] text-zinc-200 hover:text-white border border-[#3b3c48] text-xs font-semibold transition cursor-pointer"
          >
            <VolumeX className="w-3.5 h-3.5 text-[#ff4d4f]" />
            <span>Mute All</span>
          </button>
        </div>
      </aside>

      {/* Zoom Authentic "Mute All" Confirmation Dialog */}
      {isMuteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-[#23232b] border border-[#3b3c48] rounded-2xl max-w-sm w-full p-5 shadow-2xl text-white animate-in zoom-in-95 duration-100">
            <h3 className="text-sm font-bold mb-1.5">Mute all participants</h3>
            <p className="text-xs text-zinc-400 mb-4">
              All current and new participants will be muted.
            </p>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none mb-5">
              <input
                type="checkbox"
                checked={allowSelfUnmute}
                onChange={(e) => setAllowSelfUnmute(e.target.checked)}
                className="w-4 h-4 rounded text-[#0e71eb] focus:ring-[#0e71eb] bg-[#282932] border-[#3b3c48]"
              />
              <span>Allow participants to unmute themselves</span>
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMuteAllModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMuteAll}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0e71eb] hover:bg-[#0b5ed7] shadow-sm transition cursor-pointer"
              >
                Mute All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
