'use client';

import React from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';

interface ActionCardProps {
  title: string;
  icon: LucideIcon;
  variant: 'orange' | 'blue';
  onClick: () => void;
  isLoading?: boolean;
  hasDropdown?: boolean;
  onDropdownClick?: (e: React.MouseEvent) => void;
  badgeNumber?: number; // e.g. calendar day number like in real Zoom
  isShareScreen?: boolean;
}

export function ActionCard({
  title,
  icon: Icon,
  variant,
  onClick,
  isLoading = false,
  hasDropdown = false,
  onDropdownClick,
  badgeNumber,
  isShareScreen = false,
}: ActionCardProps) {
  const isOrange = variant === 'orange';

  return (
    <div className="flex flex-col items-center select-none group">
      {/* Zoom Iconic Rounded Square Button */}
      <div className="relative">
        <button
          onClick={onClick}
          disabled={isLoading}
          type="button"
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] sm:rounded-[26px] flex items-center justify-center text-white shadow-md transition-all duration-150 transform active:scale-95 cursor-pointer disabled:opacity-60 relative overflow-hidden ${
            isOrange
              ? 'bg-[#ff7426] hover:bg-[#f16315] shadow-orange-500/25 ring-1 ring-orange-400/40'
              : 'bg-[#0e71eb] hover:bg-[#0b5ed7] shadow-blue-500/25 ring-1 ring-blue-400/40'
          }`}
          title={title}
        >
          {isLoading ? (
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : badgeNumber !== undefined ? (
            /* Zoom Iconic Schedule Calendar Icon with Today's Date Number */
            <div className="flex flex-col items-center justify-center w-12 h-12 bg-white/10 rounded-xl border border-white/30 p-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/80">
                {new Date().toLocaleDateString([], { month: 'short' })}
              </span>
              <span className="text-xl sm:text-2xl font-black text-white leading-none">
                {badgeNumber}
              </span>
            </div>
          ) : isShareScreen ? (
            /* Zoom Share Screen with Monitor & Upward Arrow */
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-9 border-2 border-white rounded-md flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          ) : (
            <Icon className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.8]" />
          )}
        </button>

        {/* Real Zoom Dropdown Chevron on New Meeting */}
        {hasDropdown && (
          <button
            onClick={onDropdownClick || onClick}
            type="button"
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
            title="Meeting options"
          >
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Button Label Underneath */}
      <span className="mt-2.5 text-xs sm:text-sm font-semibold text-zinc-800 text-center tracking-tight group-hover:text-[#0e71eb] transition">
        {title}
      </span>
    </div>
  );
}
