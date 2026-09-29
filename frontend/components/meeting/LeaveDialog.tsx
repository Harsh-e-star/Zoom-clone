'use client';

import React from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100 select-none">
      <div className="bg-[#23232b] border border-[#3b3c48] rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center text-white">
        <h3 className="text-base font-bold text-white mb-2">
          {isHost ? 'End Meeting' : 'Leave Meeting'}
        </h3>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          {isHost
            ? 'If you would like to keep this meeting open, please assign a host before leaving.'
            : 'Are you sure you want to disconnect from this conference session?'}
        </p>

        <div className="flex flex-col gap-2.5">
          {isHost ? (
            <>
              {/* Zoom Authentic Red "End Meeting for All" */}
              <button
                onClick={onConfirmLeave}
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#e02828] hover:bg-[#c91f1f] shadow-md transition active:scale-98 cursor-pointer"
              >
                End Meeting for All
              </button>

              {/* Zoom Authentic "Leave Meeting" */}
              <button
                onClick={onConfirmLeave}
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white bg-[#2f303c] hover:bg-[#3b3c4a] border border-[#444556] transition active:scale-98 cursor-pointer"
              >
                Leave Meeting
              </button>
            </>
          ) : (
            <button
              onClick={onConfirmLeave}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#e02828] hover:bg-[#c91f1f] shadow-md transition active:scale-98 cursor-pointer"
            >
              Leave Meeting
            </button>
          )}

          {/* Cancel */}
          <button
            onClick={onClose}
            type="button"
            className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
