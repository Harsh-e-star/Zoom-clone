'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import {
  User as UserIcon,
  Mail,
  Clock,
  Shield,
  Copy,
  Edit2,
  CheckCircle2,
  Building,
  Key,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || 'Harsh');
  const [status, setStatus] = useState(user?.status || 'Available');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({ name, status, timezone });
      setIsEditing(false);
      addToast('Profile updated successfully!', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Cover Banner */}
          <div className="h-32 bg-gradient-to-r from-[#0b5cff] via-[#004be5] to-indigo-700 relative" />

          {/* Profile Card Header */}
          <div className="px-6 sm:px-8 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-14 mb-4 gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md shrink-0">
                  <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#0b5cff] to-sky-400 text-white flex items-center justify-center font-bold text-3xl">
                    {name ? name[0].toUpperCase() : 'H'}
                  </div>
                </div>
                <div className="mb-1">
                  <h1 className="text-2xl font-bold text-zinc-900 leading-tight">
                    {name}
                  </h1>
                  <p className="text-xs text-zinc-500 font-medium">
                    {user?.email || 'harsh@meetspace.local'}
                  </p>
                </div>
              </div>

              <div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Profile Fields or Edit Mode */}
            {isEditing ? (
              <form onSubmit={handleSave} className="mt-6 space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#0b5cff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Availability Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#0b5cff]"
                  >
                    <option value="Available">Available 🟢</option>
                    <option value="Busy">Busy 🔴</option>
                    <option value="Do Not Disturb">Do Not Disturb ⛔</option>
                    <option value="Away">Away 🟡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#0b5cff]"
                  >
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm shadow-[#0b5cff]/20"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </form>
            ) : (
              <div className="mt-6 divide-y divide-zinc-100 text-xs">
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Personal Meeting ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-900 text-sm">
                      847 392 1056
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText('8473921056');
                        addToast('Personal Meeting ID copied!', 'success');
                      }}
                      className="text-[#0b5cff] hover:underline flex items-center gap-1 font-semibold ml-2 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </div>

                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Account License</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Enterprise Workplace Licensed
                  </span>
                </div>

                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">User Status</span>
                  <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {status}
                  </span>
                </div>

                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Timezone</span>
                  <span className="text-zinc-800">{timezone}</span>
                </div>

                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Host Key</span>
                  <span className="font-mono text-zinc-700">*** 1056</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
