'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MeetingDetail,
  Participant,
  Message,
} from '@/types/meeting';
import {
  getMeeting,
  sendMessage,
  muteAllParticipants,
  removeParticipant,
  updateParticipant,
} from '@/lib/api';

export interface ReactionItem {
  id: string;
  emoji: string;
  sender: string;
}

export function useMeeting(meetingId: string, currentUserName: string = 'Harsh') {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to HH:MM:SS or MM:SS
  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Meeting duration timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Fetch meeting data callback
  const fetchMeetingData = useCallback(async () => {
    if (!meetingId) return;
    try {
      const data = await getMeeting(meetingId);
      setMeeting(data);
      setParticipants(data.participants || []);
      setMessages(data.messages || []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch meeting';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  // Periodic polling for sync
  useEffect(() => {
    let isMounted = true;

    async function initialFetch() {
      if (!meetingId) return;
      try {
        const data = await getMeeting(meetingId);
        if (isMounted) {
          setMeeting(data);
          setParticipants(data.participants || []);
          setMessages(data.messages || []);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch meeting';
          setError(msg);
          setIsLoading(false);
        }
      }
    }

    initialFetch();

    pollingRef.current = setInterval(() => {
      fetchMeetingData();
    }, 3000);

    return () => {
      isMounted = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [meetingId, fetchMeetingData]);

  // Send Chat Message
  const sendChat = async (text: string) => {
    if (!text.trim() || !meetingId) return;
    try {
      const newMsg = await sendMessage(meetingId, {
        sender_name: currentUserName,
        sender_role: currentUserName === 'Harsh' ? 'host' : 'participant',
        message: text.trim(),
      });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: unknown) {
      console.error('Failed to send message:', err);
      throw err;
    }
  };

  // Mute All Participants (Host Control)
  const muteAll = async () => {
    if (!meetingId) return;
    try {
      await muteAllParticipants(meetingId);
      setParticipants((prev) =>
        prev.map((p) => (p.role === 'host' ? p : { ...p, is_muted: true }))
      );
    } catch (err) {
      console.error('Failed to mute all:', err);
    }
  };

  // Remove Participant (Host Control)
  const removeUser = async (participantId: number) => {
    if (!meetingId) return;
    try {
      await removeParticipant(meetingId, participantId);
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    } catch (err) {
      console.error('Failed to remove participant:', err);
    }
  };

  // Toggle Remote Participant Mute State
  const toggleParticipantMute = async (participantId: number, currentMuted: boolean) => {
    if (!meetingId) return;
    try {
      await updateParticipant(meetingId, participantId, { is_muted: !currentMuted });
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, is_muted: !currentMuted } : p))
      );
    } catch (err) {
      console.error('Failed to toggle participant mute:', err);
    }
  };

  // Trigger floating reaction
  const triggerReaction = (emoji: string) => {
    const reactionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newReaction: ReactionItem = {
      id: reactionId,
      emoji,
      sender: currentUserName,
    };

    setReactions((prev) => [...prev, newReaction]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 3000);
  };

  return {
    meeting,
    participants,
    messages,
    isLoading,
    error,
    reactions,
    elapsedSeconds,
    durationFormatted: formatDuration(elapsedSeconds),
    refetch: fetchMeetingData,
    sendChat,
    muteAll,
    removeUser,
    toggleParticipantMute,
    triggerReaction,
  };
}
