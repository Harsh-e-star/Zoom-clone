'use client';

import React from 'react';
import { CalendarX, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = CalendarX,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 text-center">
      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-zinc-800 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
