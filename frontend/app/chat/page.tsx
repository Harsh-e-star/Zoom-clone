'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import {
  MessageSquare,
  Hash,
  User,
  Send,
  Video,
  Smile,
  Paperclip,
  Search,
  MoreVertical,
  Plus,
  Phone,
  Info,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  senderRole?: string;
  avatar: string;
  text: string;
  timestamp: string;
  isSelf?: boolean;
}

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeChannel, setActiveChannel] = useState<{ id: string; name: string; type: 'channel' | 'dm' }>({
    id: 'general',
    name: 'general',
    type: 'channel',
  });

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    general: [
      {
        id: '1',
        sender: 'Harsh',
        senderRole: 'Host',
        avatar: 'H',
        text: 'Welcome to MeetSpace Team Chat! Everyone please review the sprint roadmap before today’s standup.',
        timestamp: '10:15 AM',
        isSelf: true,
      },
      {
        id: '2',
        sender: 'Rahul Sharma',
        avatar: 'R',
        text: 'Reviewed! The meeting link is active on the calendar for 11:00 AM.',
        timestamp: '10:20 AM',
      },
      {
        id: '3',
        sender: 'Priya Patel',
        avatar: 'P',
        text: 'I’ve uploaded the latest UI design specs for the meeting room toolbar.',
        timestamp: '10:24 AM',
      },
    ],
    engineering: [
      {
        id: '4',
        sender: 'Aman Gupta',
        avatar: 'A',
        text: 'FastAPI auth endpoints and SQLite schema migrations are deployed and verified.',
        timestamp: '9:40 AM',
      },
      {
        id: '5',
        sender: 'Harsh',
        senderRole: 'Host',
        avatar: 'H',
        text: 'Great work Aman! Let’s keep API latency under 50ms.',
        timestamp: '9:45 AM',
        isSelf: true,
      },
    ],
    rahul: [
      {
        id: '6',
        sender: 'Rahul Sharma',
        avatar: 'R',
        text: 'Hey Harsh, ready to jump on a quick 5-min sync about the WebRTC audio bridge?',
        timestamp: '11:05 AM',
      },
    ],
  });

  const [inputText, setInputText] = useState('');

  const currentMessages = messages[activeChannel.id] || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: user?.name || 'Harsh',
      senderRole: 'Host',
      avatar: user?.name ? user.name[0].toUpperCase() : 'H',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };

    setMessages((prev) => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMsg],
    }));

    setInputText('');
  };

  const handleStartInstantFromChat = () => {
    router.push('/meeting/8473921056');
  };

  return (
    <div className="h-screen bg-[#f7f9fa] flex flex-col font-sans overflow-hidden">
      <Header activeTab="chat" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex gap-4 min-h-0">
        {/* Left Sidebar: Channels and Direct Messages */}
        <aside className="w-64 sm:w-72 bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">Workplace Chat</h2>
            <button
              onClick={() => addToast('New channel creation enabled', 'info')}
              className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-500 cursor-pointer"
              title="New Channel"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder-zinc-400 focus:outline-none focus:border-[#0b5cff]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
            {/* Channels */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1">
                Channels
              </div>
              <div className="space-y-0.5">
                {[
                  { id: 'general', name: 'general' },
                  { id: 'engineering', name: 'engineering' },
                  { id: 'product', name: 'product-sync' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannel({ id: c.id, name: c.name, type: 'channel' })}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                      activeChannel.id === c.id
                        ? 'bg-blue-50 text-[#0b5cff]'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Messages */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1">
                Direct Messages
              </div>
              <div className="space-y-0.5">
                {[
                  { id: 'rahul', name: 'Rahul Sharma', avatar: 'R', status: 'online' },
                  { id: 'priya', name: 'Priya Patel', avatar: 'P', status: 'online' },
                  { id: 'aman', name: 'Aman Gupta', avatar: 'A', status: 'away' },
                ].map((dm) => (
                  <button
                    key={dm.id}
                    onClick={() => setActiveChannel({ id: dm.id, name: dm.name, type: 'dm' })}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                      activeChannel.id === dm.id
                        ? 'bg-blue-50 text-[#0b5cff]'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-[10px]">
                        {dm.avatar}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ring-1 ring-white ${
                          dm.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                      />
                    </div>
                    <span className="truncate">{dm.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Chat Window */}
        <section className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden min-w-0">
          {/* Channel Header */}
          <div className="px-6 py-3.5 border-b border-zinc-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {activeChannel.type === 'channel' ? (
                <Hash className="w-4 h-4 text-zinc-500" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {activeChannel.name[0]}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-zinc-900 leading-none">
                  {activeChannel.name}
                </h3>
                <span className="text-[11px] text-zinc-400">
                  {activeChannel.type === 'channel' ? 'Public Workplace Channel' : 'Active Direct Message'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartInstantFromChat}
                className="px-3 py-1.5 bg-[#0b5cff] hover:bg-[#004be5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Start Video Meeting in this thread"
              >
                <Video className="w-3.5 h-3.5 fill-current" />
                <span>Meet Now</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400">
                <MessageSquare className="w-10 h-10 text-zinc-200 mb-2" />
                <p className="text-xs font-semibold text-zinc-600">No messages in this channel yet.</p>
                <p className="text-[11px] text-zinc-400">Send a greeting to start collaborating.</p>
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 text-xs group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0b5cff] to-sky-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-zinc-900">{msg.sender}</span>
                      {msg.senderRole && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {msg.senderRole}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400">{msg.timestamp}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-800 leading-relaxed inline-block max-w-xl">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Composer */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={() => addToast('File attachments supported', 'info')}
              className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message #${activeChannel.name}...`}
              className="flex-1 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#0b5cff]"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-[#0b5cff] hover:bg-[#004be5] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
