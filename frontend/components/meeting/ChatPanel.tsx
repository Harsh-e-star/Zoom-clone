'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
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
      // restore text on failure
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
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-88 bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span>In-Meeting Chat</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
            <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
            <p>No messages yet.</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Send a greeting to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_name === currentUserName;
            const isSystem = msg.sender_role === 'system';

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="flex justify-center my-2 text-center"
                >
                  <span className="px-3 py-1 rounded-full bg-zinc-800/80 text-[11px] text-zinc-400 border border-zinc-700/50">
                    {msg.message}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300">
                    {isMe ? 'You' : msg.sender_name}
                  </span>
                  <span>{formatMsgTime(msg.created_at)}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-xs ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-zinc-800 text-zinc-100 rounded-tl-xs border border-zinc-700/60'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950/60">
        <div className="relative flex items-center bg-zinc-800/90 border border-zinc-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 transition">
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message (Enter to send)..."
            className="w-full pl-3 pr-10 py-2.5 bg-transparent text-xs text-white placeholder-zinc-500 resize-none focus:outline-none max-h-24"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="absolute right-2 p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
