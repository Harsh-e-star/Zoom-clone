'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { getSettings, updateSettings } from '@/lib/api/settings';
import {
  Settings as SettingsIcon,
  Video,
  Mic,
  Bell,
  Shield,
  Palette,
  Sliders,
  Check,
  RotateCw,
} from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useToast();

  const [activeCategory, setActiveCategory] = useState<'general' | 'video' | 'audio' | 'meetings' | 'notifications' | 'security'>('general');
  const [muteOnJoin, setMuteOnJoin] = useState(false);
  const [videoOffOnJoin, setVideoOffOnJoin] = useState(false);
  const [audioDevice, setAudioDevice] = useState('default');
  const [videoDevice, setVideoDevice] = useState('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState('light');
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);
  const [autoCopyInvite, setAutoCopyInvite] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const s = await getSettings();
        setMuteOnJoin(s.mute_on_join);
        setVideoOffOnJoin(s.video_off_on_join);
        setAudioDevice(s.audio_device || 'default');
        setVideoDevice(s.video_device || 'default');
        setNotificationsEnabled(s.notifications_enabled);
        setTheme(s.theme || 'light');
      } catch {
        addToast('Loaded default preferences', 'info');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [addToast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        mute_on_join: muteOnJoin,
        video_off_on_join: videoOffOnJoin,
        audio_device: audioDevice,
        video_device: videoDevice,
        notifications_enabled: notificationsEnabled,
        theme,
      });
      addToast('Preferences successfully saved and persisted to database!', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    { id: 'general', name: 'General', icon: Sliders },
    { id: 'video', name: 'Video', icon: Video },
    { id: 'audio', name: 'Audio', icon: Mic },
    { id: 'meetings', name: 'Meetings', icon: SettingsIcon },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security & Privacy', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-zinc-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Workplace Settings
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Configure your conferencing hardware, meeting defaults, and workspace notifications.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-[#0b5cff]/20 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8">
          {/* Left Categories Column */}
          <aside className="md:col-span-4 lg:col-span-3 border-r border-zinc-100 pr-4 space-y-1">
            {categories.map((c) => {
              const Icon = c.icon;
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id as typeof activeCategory)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-[#0b5cff]'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </aside>

          {/* Right Form Pane */}
          <section className="md:col-span-8 lg:col-span-9 pl-0 md:pl-4 space-y-6">
            {activeCategory === 'general' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">
                    Application General
                  </h3>
                  <p className="text-zinc-500 mb-4">
                    Control interface startup and general behavior.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold text-zinc-800 block">
                        Auto-copy invite link
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        Automatically copy the meeting invitation link to clipboard upon starting a meeting.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoCopyInvite}
                      onChange={(e) => setAutoCopyInvite(e.target.checked)}
                      className="w-4 h-4 text-[#0b5cff] rounded border-zinc-300 focus:ring-[#0b5cff]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold text-zinc-800 block">
                        Theme preference
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        Select UI tone for dashboard & navigation.
                      </span>
                    </div>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs"
                    >
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                      <option value="system">Follow System</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {activeCategory === 'video' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">
                    Camera & Video Preferences
                  </h3>
                  <p className="text-zinc-500 mb-4">
                    Manage hardware camera feed and stream settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1.5">
                      Camera Device
                    </label>
                    <select
                      value={videoDevice}
                      onChange={(e) => setVideoDevice(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-zinc-300 rounded-xl text-xs"
                    >
                      <option value="default">Default Built-in FaceTime HD Camera</option>
                      <option value="external">External USB Webcam 1080p</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between cursor-pointer pt-2">
                    <div>
                      <span className="font-semibold text-zinc-800 block">
                        Turn off video when joining
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        Join meetings with camera disabled by default.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={videoOffOnJoin}
                      onChange={(e) => setVideoOffOnJoin(e.target.checked)}
                      className="w-4 h-4 text-[#0b5cff] rounded border-zinc-300 focus:ring-[#0b5cff]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold text-zinc-800 block">
                        Mirror my video
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        Show a flipped preview of your local webcam tile.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={mirrorVideo}
                      onChange={(e) => setMirrorVideo(e.target.checked)}
                      className="w-4 h-4 text-[#0b5cff] rounded border-zinc-300 focus:ring-[#0b5cff]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold text-zinc-800 block">
                        Enable HD 1080p capture
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        Stream high-definition 60fps video when bandwidth permits.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hdVideo}
                      onChange={(e) => setHdVideo(e.target.checked)}
                      className="w-4 h-4 text-[#0b5cff] rounded border-zinc-300 focus:ring-[#0b5cff]"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeCategory === 'audio' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">
                    Microphone & Audio Preferences
                  </h3>
                  <p className="text-zinc-500 mb-4">
                    Tune input levels and noise suppression.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1.5">
                      Microphone Device
                    </label>
                    <select
                      value={audioDevice}
                      onChange={(e) => setAudioDevice(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-zinc-300 rounded-xl text-xs"
                    >
                      <option value="default">Default Built-in Microphone (MacBook)</option>
                      <option value="headset">External Headset Microphone</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between cursor-pointer pt-2">
                    <div>
                      <span className="font-semibold text-zinc-800 block">
                        Mute microphone when joining
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        Start all sessions muted to prevent background noise interruptions.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={muteOnJoin}
                      onChange={(e) => setMuteOnJoin(e.target.checked)}
                      className="w-4 h-4 text-[#0b5cff] rounded border-zinc-300 focus:ring-[#0b5cff]"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeCategory === 'meetings' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">
                    Meeting Defaults
                  </h3>
                  <p className="text-zinc-500 mb-4">
                    Security defaults for hosts and attendees.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-800 block">Waiting Room</span>
                      <span className="text-[11px] text-zinc-500">Hold attendees in lobby until host admits them.</span>
                    </div>
                    <span className="text-emerald-700 font-semibold text-xs">Active</span>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-800 block">Passcode Protection</span>
                      <span className="text-[11px] text-zinc-500">Require 6-digit numeric passcode on all invitations.</span>
                    </div>
                    <span className="text-emerald-700 font-semibold text-xs">Enforced</span>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'notifications' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">
                    Notifications
                  </h3>
                  <p className="text-zinc-500 mb-4">
                    Alert preferences for upcoming meetings and direct messages.
                  </p>
                </div>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-zinc-800 block">
                      Enable Desktop & In-App Notifications
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      Receive popups 10 minutes prior to scheduled conferences.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#0b5cff] rounded border-zinc-300 focus:ring-[#0b5cff]"
                  />
                </label>
              </div>
            )}

            {activeCategory === 'security' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">
                    Security & Encryption
                  </h3>
                  <p className="text-zinc-500 mb-4">
                    End-to-end cryptographic and session policies.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>MeetSpace Secure TLS & PBKDF2 Hashing Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    All authentication passwords are encrypted using PBKDF2-HMAC-SHA256 with random salt. Sessions are authorized via cryptographically signed tokens.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
