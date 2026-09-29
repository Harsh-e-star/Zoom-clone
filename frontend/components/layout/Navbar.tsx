'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  MessageSquare,
  Clock,
  Users,
  Search,
  Settings,
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  PenTool,
  FileText,
  ChevronDown,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../ui/Toast';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Navbar({ activeTab = 'home', onTabChange }: NavbarProps) {
  const { showToast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navTabs = [
    { id: 'home', label: 'Home', href: '/', icon: Home },
    { id: 'chat', label: 'Team Chat', href: '/#chat', icon: MessageSquare },
    { id: 'meetings', label: 'Meetings', href: '/#meetings', icon: Clock },
    { id: 'contacts', label: 'Contacts', href: '/#contacts', icon: Users },
    { id: 'whiteboards', label: 'Whiteboards', href: '/#whiteboards', icon: PenTool },
    { id: 'notes', label: 'Notes', href: '/#notes', icon: FileText },
  ];

  const handleCopyPMI = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('8473921056');
    showToast('Personal Meeting ID (847 392 1056) copied!', 'success');
  };

  const handleCopyInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('http://localhost:3000/meeting/8473921056');
    showToast('Personal Meeting Link copied!', 'success');
  };

  return (
    <>
      {/* Zoom Authentic Top Title & Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#1b1c20] text-white border-b border-[#2d2e36] select-none h-[52px]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-full flex items-center justify-between">
          {/* 1. Left: Zoom Workplace Logo */}
          <div className="flex items-center gap-4">
            {/* Zoom Authentic Logo */}
            <Link href="/" className="flex items-center gap-1.5 group">
              <div className="flex items-center text-[#0e71eb] font-extrabold text-2xl tracking-tighter hover:opacity-95 transition">
                <span>zoom</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-700/60 ml-0.5">
                Workplace
              </span>
            </Link>

            {/* Global Search Bar (Zoom Desktop Client Style) */}
            <div className="hidden lg:flex items-center relative w-52 xl:w-60 ml-2">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search (⌘F)"
                className="w-full pl-8 pr-3 py-1 bg-[#282932] border border-[#3b3c48] rounded-md text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#0e71eb] transition"
              />
            </div>
          </div>

          {/* 2. Center: Zoom Main Tabs (Home, Team Chat, Meetings, Contacts, Whiteboards, Notes) */}
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (onTabChange) {
                      onTabChange(tab.id);
                    }
                  }}
                  type="button"
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#2b2c37] text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#252630]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0e71eb]' : 'text-zinc-400'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {isSelected && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0e71eb] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. Right: Settings Gear + User Profile with Green "Available" Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Settings Gear */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#2c2d38] rounded-md transition cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Avatar with Presence Indicator */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                type="button"
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#2c2d38] transition cursor-pointer"
                title="Profile Menu"
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-[#0e71eb] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    H
                  </div>
                  {/* Zoom Green "Available" Online Status Dot */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#0e8a16] border-2 border-[#1b1c20] rounded-full"
                    title="Available"
                  />
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-zinc-200">
                  Harsh
                </span>
                <ChevronDown className="hidden sm:inline w-3 h-3 text-zinc-400" />
              </button>

              {/* Zoom Authentic Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#23232b] border border-[#3b3c48] rounded-2xl shadow-2xl z-50 p-3 animate-in zoom-in-95 duration-100 text-left">
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#3b3c48]">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#0e71eb] text-white font-bold text-base flex items-center justify-center shadow-xs">
                        H
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#0e8a16] border-2 border-[#23232b] rounded-full" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-white truncate">Harsh</h4>
                      <p className="text-xs text-zinc-400 truncate">harsh@workspace.zoom</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#0e8a16]" />
                        <span className="text-[11px] text-zinc-300 font-medium">Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Meeting ID (PMI) Card */}
                  <div className="py-2.5 border-b border-[#3b3c48]">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                      <span>Personal Meeting ID (PMI)</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 px-2.5 py-1.5 bg-[#1b1c22] rounded-lg border border-[#333440]">
                      <span className="text-xs font-mono font-bold text-white">
                        847 392 1056
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleCopyPMI}
                          className="p-1 text-zinc-400 hover:text-white transition"
                          title="Copy ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCopyInvite}
                          className="p-1 text-zinc-400 hover:text-white transition"
                          title="Copy Invite Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Settings & Help */}
                  <div className="py-2 space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-[#2f303c] transition"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        showToast('Zoom Workplace is up to date (v6.2.0)', 'info');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-[#2f303c] transition"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#0e8a16]" />
                      <span>Check for Updates</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#3b3c48]">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        showToast('Switching account...', 'info');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition text-xs font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal (Zoom Desktop Style) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#23232b] border border-[#3b3c48] rounded-2xl max-w-lg w-full p-6 shadow-2xl text-left text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#3b3c48]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#0e71eb]" />
                <h3 className="text-base font-bold">Settings</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-[#1b1c22] rounded-xl border border-[#333440] space-y-2">
                <h4 className="font-bold text-sm text-zinc-100">Audio & Video</h4>
                <p className="text-zinc-400">
                  Microphone and camera permissions are requested dynamically upon entering the meeting room with seamless animated avatar fallback.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 pt-1 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Hardware WebRTC & Canvas APIs Ready</span>
                </div>
              </div>

              <div className="p-3 bg-[#1b1c22] rounded-xl border border-[#333440] space-y-2">
                <h4 className="font-bold text-sm text-zinc-100">User Profile</h4>
                <p className="text-zinc-400">
                  Default Display Name: <span className="text-white font-bold">Harsh</span>
                </p>
                <p className="text-zinc-400">
                  Personal Meeting ID (PMI): <span className="font-mono text-blue-400 font-bold">847 392 1056</span>
                </p>
              </div>

              <div className="p-3 bg-[#1b1c22] rounded-xl border border-[#333440] space-y-2">
                <h4 className="font-bold text-sm text-zinc-100">Security & Encryption</h4>
                <p className="text-zinc-400">
                  End-to-end 256-bit AES encryption simulation enabled with random 6-character alphanumeric passcodes for every meeting.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-[#0e71eb] hover:bg-[#0b5ed7] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
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
