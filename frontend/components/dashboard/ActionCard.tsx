'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorScheme: 'orange' | 'blue' | 'indigo' | 'zinc';
  onClick: () => void;
  isLoading?: boolean;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  colorScheme,
  onClick,
  isLoading = false,
}: ActionCardProps) {
  const colorMap = {
    orange: {
      bg: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25',
      ring: 'focus:ring-orange-400',
      lightBg: 'group-hover:bg-orange-600',
    },
    blue: {
      bg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25',
      ring: 'focus:ring-blue-400',
      lightBg: 'group-hover:bg-blue-700',
    },
    indigo: {
      bg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25',
      ring: 'focus:ring-indigo-400',
      lightBg: 'group-hover:bg-indigo-700',
    },
    zinc: {
      bg: 'bg-zinc-800 hover:bg-zinc-900 shadow-zinc-800/20',
      ring: 'focus:ring-zinc-400',
      lightBg: 'group-hover:bg-zinc-900',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      type="button"
      className="group relative flex flex-col text-left p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:shadow-xl hover:border-zinc-300 transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg transition-transform duration-200 group-hover:scale-105 ${scheme.bg}`}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Icon className="w-7 h-7" />
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition">
          {title}
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      <div className="mt-4 flex items-center text-xs font-semibold text-zinc-400 group-hover:text-blue-600 transition">
        <span>Get started</span>
        <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </button>
  );
}
