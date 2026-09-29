'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from './Toast';

interface CopyLinkButtonProps {
  inviteLink: string;
  meetingId?: string;
  className?: string;
  label?: string;
  iconOnly?: boolean;
}

export function CopyLinkButton({
  inviteLink,
  className = '',
  label = 'Copy Link',
  iconOnly = false,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        // Fallback for non-https or older browser context
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
      showToast('Invite link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      showToast('Failed to copy link to clipboard', 'error');
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      title="Copy meeting invite link"
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
          : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-zinc-300 shadow-xs'
      } ${className}`}
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-600" />
      ) : (
        <Copy className="w-4 h-4 text-zinc-500" />
      )}
      {!iconOnly && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}
