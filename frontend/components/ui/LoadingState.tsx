'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  type?: 'spinner' | 'card-skeleton' | 'grid-skeleton';
  count?: number;
}

export function LoadingState({
  message = 'Loading...',
  type = 'spinner',
  count = 3,
}: LoadingStateProps) {
  if (type === 'card-skeleton') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-zinc-200 bg-white/70 animate-pulse space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-48 bg-zinc-200 rounded-md" />
              <div className="h-4 w-16 bg-zinc-200 rounded-md" />
            </div>
            <div className="h-4 w-64 bg-zinc-100 rounded-md" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 w-20 bg-zinc-200 rounded-lg" />
              <div className="h-8 w-24 bg-zinc-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'grid-skeleton') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-2xl border border-zinc-200 bg-zinc-100/60 animate-pulse p-5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 bg-zinc-200 rounded-xl" />
              <div className="h-5 w-32 bg-zinc-200 rounded-md" />
              <div className="h-3 w-40 bg-zinc-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-zinc-600">{message}</p>
    </div>
  );
}
