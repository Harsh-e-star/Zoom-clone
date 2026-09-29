'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, ChevronDown, MessageSquare } from 'lucide-react';
import { Message } from '@/types/meeting';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  currentUserName: string;
  onSendMessage: (text: string) => Promise<void>;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  currentUserName,
  onSendMessage,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recipient, setRecipient] = useState('Everyone');
  const [isRecipientMenuOpen, setIsRecipientMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await onSendMessage(text);
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMsgTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-84 bg-[#1b1c22] border-l border-[#2e2f38] flex flex-col shadow-2xl animate-in slide-in-from-right duration-150 select-none text-white font-sans">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2f38]">
        <div className="flex items-center gap-2 text-white font-bold text-xs tracking-tight">
          <span>Meeting Chat</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#282932] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Messages Stream (Zoom Authentic Transcript Format) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
            <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="font-semibold text-zinc-400">Meeting Chat</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Messages will be visible to everyone in the room.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_name === currentUserName;
            const isSystem = msg.sender_role === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2 text-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#282932] text-[10px] text-zinc-400 border border-[#3b3c48]">
                    {msg.message}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className="text-left space-y-0.5">
                {/* Sender Header Line: From {Name} to Everyone: Time */}
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-zinc-500">From </span>
                    <span className="font-bold text-white">
                      {isMe ? `${msg.sender_name} (me)` : msg.sender_name}
                    </span>
                    <span className="text-zinc-500"> to </span>
                    <span className="text-blue-400 font-medium">Everyone</span>
                    <span className="text-zinc-500">:</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 shrink-0 ml-2">
                    {formatMsgTime(msg.created_at)}
                  </span>
                </div>

                {/* Message Text Bubble / Container */}
                <div className="text-xs text-zinc-100 bg-[#282932] border border-[#3b3c48] rounded-xl px-3 py-2 leading-relaxed break-words shadow-xs">
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Zoom Authentic Chat Footer with "To: Everyone" Dropdown */}
      <div className="p-3 border-t border-[#2e2f38] bg-[#17181e] space-y-2">
        {/* "To: Everyone" Selector */}
        <div className="relative">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span>To:</span>
            <button
              type="button"
              onClick={() => setIsRecipientMenuOpen(!isRecipientMenuOpen)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#282932] hover:bg-[#343540] text-blue-400 text-xs font-semibold border border-[#3b3c48] transition cursor-pointer"
            >
              <span>{recipient}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Recipient Dropdown */}
          {isRecipientMenuOpen && (
            <div className="absolute bottom-7 left-6 w-36 bg-[#23232b] border border-[#3b3c48] rounded-xl shadow-2xl z-50 py-1 text-xs text-left">
              <button
                type="button"
                onClick={() => {
                  setRecipient('Everyone');
                  setIsRecipientMenuOpen(false);
                }}
                className="w-full px-3 py-1.5 text-zinc-200 hover:text-white hover:bg-[#2f303c] transition text-left"
              >
                Everyone
              </button>
            </div>
          )}
        </div>

        {/* Input Text Box */}
        <form onSubmit={handleSend} className="relative">
          <div className="flex flex-col bg-[#282932] border border-[#3b3c48] rounded-xl focus-within:border-[#0e71eb] transition p-2">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message here..."
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 resize-none focus:outline-none"
            />

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + ' 👍')}
                  className="p-1 hover:text-white transition cursor-pointer"
                  title="Emoji"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-1.5 rounded-lg bg-[#0e71eb] hover:bg-[#0b5ed7] text-white disabled:opacity-30 transition cursor-pointer"
                title="Send"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </aside>
  );
}
