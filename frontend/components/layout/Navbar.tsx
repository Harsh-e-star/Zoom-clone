'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Video,
  Home,
  Calendar,
  Clock,
  Settings,
  X,
  ShieldCheck,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [time, setTime] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Meetings', href: '/#meetings', icon: Video },
    { label: 'Schedule', href: '/#schedule', icon: Calendar },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
                <Video className="w-6 h-6 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-zinc-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                  MeetSpace
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                    Pro
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 font-medium -mt-1">
                  Zoom Web Experience
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Clock & User Info & Settings */}
          <div className="flex items-center gap-4">
            {/* Live Clock */}
            {time && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-zinc-100/80 px-3 py-1.5 rounded-full border border-zinc-200">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{time}</span>
              </div>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Placeholder (Harsh) */}
            <div className="flex items-center gap-3 pl-2 border-l border-zinc-200">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center shadow-xs">
                  H
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-800 leading-tight">
                  Harsh
                </span>
                <span className="text-[11px] text-zinc-400">Host (Default)</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-zinc-900">
                  Settings & Environment
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm text-zinc-600">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-800">Backend API Endpoint</p>
                  <p className="text-xs text-zinc-400 font-mono">
                    {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                  </p>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                  Online
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-800">Default Active User</p>
                  <p className="text-xs text-zinc-400">Harsh (Host role)</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-800">Storage Architecture</p>
                  <p className="text-xs text-zinc-400">Persistent SQLite Database</p>
                </div>
                <span className="text-xs font-mono text-zinc-500">zoom_clone.db</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
