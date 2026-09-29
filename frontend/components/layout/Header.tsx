'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import {
  Video,
  LayoutGrid,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Home,
  Clock,
  Calendar as CalendarIcon,
  MessageSquare,
  Users,
  PenTool,
  FileText,
  CheckSquare,
  Copy,
  LogOut,
  ExternalLink,
  ChevronDown,
  Check,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  activeTab?: string;
}

export function Header({ activeTab }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const [isWaffleOpen, setIsWaffleOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userStatus, setUserStatus] = useState('Available');

  const waffleRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (waffleRef.current && !waffleRef.current.contains(event.target as Node)) {
        setIsWaffleOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyPMI = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('8473921056');
    addToast('Personal Meeting ID (847 392 1056) copied!', 'success');
  };

  const handleCopyInviteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(`${window.location.origin}/join/8473921056`);
    addToast('Personal Meeting Link copied!', 'success');
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home, exact: true },
    { label: 'Meetings', href: '/meetings', icon: Clock },
    { label: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { label: 'Team Chat', href: '/chat', icon: MessageSquare },
  ];

  const workplaceProducts = [
    { name: 'Meetings', desc: 'Audio & video conferencing', href: '/meetings', icon: Video, color: 'bg-blue-600 text-white' },
    { name: 'Team Chat', desc: 'Real-time workplace channels', href: '/chat', icon: MessageSquare, color: 'bg-sky-500 text-white' },
    { name: 'Calendar', desc: 'Integrated meetings schedule', href: '/calendar', icon: CalendarIcon, color: 'bg-indigo-600 text-white' },
    { name: 'Whiteboard', desc: 'Interactive team canvas', href: '/#whiteboard', icon: PenTool, color: 'bg-amber-500 text-white' },
    { name: 'Notes', desc: 'Collaborative meeting docs', href: '/#notes', icon: FileText, color: 'bg-emerald-600 text-white' },
    { name: 'Tasks', desc: 'Action items & deadlines', href: '/#tasks', icon: CheckSquare, color: 'bg-purple-600 text-white' },
    { name: 'Contacts', desc: 'Directory & availability', href: '/#contacts', icon: Users, color: 'bg-rose-500 text-white' },
  ];

  const isCurrentActive = (itemHref: string, exact?: boolean) => {
    if (activeTab) return activeTab.toLowerCase() === itemHref.replace('/', '').toLowerCase();
    if (exact) return pathname === itemHref;
    return pathname.startsWith(itemHref);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1b1c20] text-white border-b border-[#2d2e36] select-none shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-[54px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Brand & Waffle Menu */}
        <div className="flex items-center gap-3">
          {/* Product Waffle Menu (2026 Zoom Workplace Pattern) */}
          <div className="relative" ref={waffleRef}>
            <button
              onClick={() => setIsWaffleOpen(!isWaffleOpen)}
              title="Workplace Products & Tools"
              className={`p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-[#282932] transition-colors cursor-pointer ${
                isWaffleOpen ? 'bg-[#282932] text-white' : ''
              }`}
              aria-label="Product menu"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            {/* Waffle Dropdown Panel */}
            {isWaffleOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 text-zinc-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Workplace Products
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    MeetSpace 2026
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {workplaceProducts.map((p) => {
                    const Icon = p.icon;
                    return (
                      <Link
                        key={p.name}
                        href={p.href}
                        onClick={() => setIsWaffleOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors group"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${p.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-semibold text-zinc-800 group-hover:text-blue-600 transition-colors">
                            {p.name}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">
                            {p.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* MeetSpace Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#0b5cff] flex items-center justify-center text-white shadow-sm shadow-[#0b5cff]/30 transition-transform group-hover:scale-105">
              <Video className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg tracking-tight text-white">
                meet<span className="text-[#0b5cff]">space</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded ml-2 border border-zinc-700/60">
                Workplace
              </span>
            </div>
          </Link>

          {/* Global Search Bar */}
          <div className="hidden md:flex items-center relative w-56 lg:w-72 ml-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search meetings, chat (⌘F)"
              className="w-full pl-9 pr-3 py-1.5 bg-[#282932] border border-[#3b3c48] rounded-lg text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#0b5cff] transition"
            />
          </div>
        </div>

        {/* Center Section: Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 h-full">
          {navItems.map((item) => {
            const active = isCurrentActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'text-white bg-[#282932] shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#282932]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#0b5cff]' : 'text-zinc-400'}`} />
                <span className="hidden sm:inline">{item.label}</span>
                {active && (
                  <span className="absolute bottom-[-10px] left-3 right-3 h-[2px] bg-[#0b5cff] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Quick Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Schedule Button */}
          <Link
            href="/schedule"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#282932] hover:bg-[#343542] border border-[#3b3c48] rounded-lg text-xs font-semibold text-zinc-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#0b5cff]" />
            <span>Schedule</span>
          </Link>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#282932] transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0b5cff]" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 text-zinc-900 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    Notifications
                  </span>
                  <span className="text-[11px] text-[#0b5cff] font-semibold hover:underline cursor-pointer">
                    Mark all read
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 py-2">
                  <div className="py-2.5 text-xs">
                    <p className="font-semibold text-zinc-900">
                      Team Standup scheduled
                    </p>
                    <p className="text-zinc-500 mt-0.5">
                      Starting in 15 minutes in your personal meeting room.
                    </p>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Just now
                    </span>
                  </div>
                  <div className="py-2.5 text-xs">
                    <p className="font-semibold text-zinc-900">
                      Rahul Sharma joined Engineering Sync
                    </p>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      1 hour ago
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Shortcut */}
          <Link
            href="/settings"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#282932] transition-colors hidden sm:block"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Profile Menu (Zoom Style) */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-[#282932] transition-colors cursor-pointer border border-transparent hover:border-[#3b3c48]"
              aria-label="User profile menu"
            >
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0b5cff] to-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.name ? user.name[0].toUpperCase() : 'H'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#1b1c20]" />
              </div>
              <span className="hidden xl:inline text-xs font-semibold text-zinc-200">
                {user?.name || 'Harsh'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
            </button>

            {/* Profile Dropdown (Zoom Desktop / Workplace Pattern) */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-zinc-200 py-3 px-3 text-zinc-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* User Info Header */}
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0b5cff] to-sky-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {user?.name ? user.name[0].toUpperCase() : 'H'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-zinc-900 truncate">
                        {user?.name || 'Harsh'}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        {user?.email || 'harsh@meetspace.local'}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-semibold text-emerald-700">
                          {userStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Meeting ID Card */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl mb-2 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center justify-between">
                    <span>Personal Meeting ID</span>
                    <button
                      onClick={handleCopyPMI}
                      className="text-[#0b5cff] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <div className="text-sm font-mono font-bold text-blue-950 mt-1">
                    847 392 1056
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-0.5 text-xs font-medium text-zinc-700">
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  >
                    <span>My Profile & Account</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  >
                    <span>Preferences & Settings</span>
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                  <Link
                    href="/meetings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  >
                    <span>Meetings & Recordings</span>
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </div>

                <div className="my-2 border-t border-zinc-100" />

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
