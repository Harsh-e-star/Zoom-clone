'use client';

import React from 'react';
import { PhoneOff } from 'lucide-react';

interface LeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
  isHost?: boolean;
}

export function LeaveDialog({
  isOpen,
  onClose,
  onConfirmLeave,
  isHost = true,
}: LeaveDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center mb-4">
          <PhoneOff className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">Leave Meeting?</h3>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          {isHost
            ? 'As the host, you can leave the room or return to your dashboard anytime.'
            : 'Are you sure you want to disconnect from this conference session?'}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirmLeave}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition"
          >
            Leave Meeting
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 transition"
          >
            Stay in Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
