'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocalMediaState {
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  hasCameraPermission: boolean;
  hasMicPermission: boolean;
  mediaError: string | null;
}

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Toggle Mute Audio
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextState = !prev;
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !nextState;
        });
      }
      return nextState;
    });
  }, []);

  // Toggle Video Camera
  const toggleVideo = useCallback(async () => {
    setIsVideoOff((prev) => {
      const nextState = !prev;
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !nextState;
        });
      }
      return nextState;
    });
  }, []);

  // Start / Stop Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      return;
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      alert('Screen sharing is not supported on this browser or device.');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setIsScreenSharing(true);

      displayStream.getVideoTracks()[0].onended = () => {
        screenStreamRef.current = null;
        setScreenStream(null);
        setIsScreenSharing(false);
      };
    } catch (err: unknown) {
      console.warn('Screen share cancelled or failed:', err);
    }
  }, [isScreenSharing]);

  // Clean up and mount media streams
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        if (isMounted) {
          setMediaError('Media devices are not supported in this browser environment.');
        }
        return;
      }

      try {
        const userMedia = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (isMounted) {
          streamRef.current = userMedia;
          setStream(userMedia);
          setHasCameraPermission(true);
          setHasMicPermission(true);
          setMediaError(null);
        } else {
          userMedia.getTracks().forEach((t) => t.stop());
        }
      } catch (err: unknown) {
        console.warn('Real camera/mic not available, entering simulated media mode:', err);
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (isMounted) {
            streamRef.current = audioOnly;
            setStream(audioOnly);
            setHasMicPermission(true);
            setIsVideoOff(true);
          } else {
            audioOnly.getTracks().forEach((t) => t.stop());
          }
        } catch {
          if (isMounted) {
            setMediaError('Camera & microphone access not granted or not available. Using simulated stream.');
            setIsVideoOff(true);
            setIsMuted(false);
          }
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    stream,
    screenStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    hasCameraPermission,
    hasMicPermission,
    mediaError,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };
}
