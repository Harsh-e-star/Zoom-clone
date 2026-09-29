/**
 * WebRTCManager - Production-Grade Peer-to-Peer Mesh Architecture
 * 
 * Manages RTCPeerConnections, MediaStreams, SDP Offer/Answer lifecycle,
 * ICE Candidate queuing, and dynamic track replacement (Camera <-> Screen Share).
 */

export interface PeerConnectionEntry {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
  candidateQueue: RTCIceCandidateInit[];
  isMakingOffer: boolean;
  isPolite: boolean;
}

export interface WebRTCStatsSummary {
  rttMs?: number;
  jitterMs?: number;
  packetsLost?: number;
  connectionState: RTCPeerConnectionState;
  iceState: RTCIceConnectionState;
  quality: 'excellent' | 'good' | 'poor' | 'reconnecting' | 'disconnected';
}

export class WebRTCManager {
  private peers: Map<string, PeerConnectionEntry> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private isScreenSharing: boolean = false;
  private localParticipantId: string = '';

  // Callbacks
  public onIceCandidate?: (targetParticipantId: string, candidate: RTCIceCandidateInit) => void;
  public onRemoteStream?: (participantId: string, stream: MediaStream) => void;
  public onRemoteStreamRemoved?: (participantId: string) => void;
  public onConnectionStateChange?: (participantId: string, state: RTCPeerConnectionState) => void;

  constructor(localParticipantId: string = '') {
    this.localParticipantId = localParticipantId;
  }

  public setLocalParticipantId(id: string) {
    this.localParticipantId = id;
    // Update polite state for all existing peers
    for (const [peerId, entry] of this.peers.entries()) {
      entry.isPolite = this.localParticipantId ? this.localParticipantId < peerId : true;
    }
  }

  /**
   * Retrieves STUN/TURN configuration from environment variables with multiple reliable STUN fallbacks
   */
  public getIceConfiguration(): RTCConfiguration {
    const stunServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302',
      'stun:global.stun.twilio.com:3478',
    ];

    const customStun = process.env.NEXT_PUBLIC_STUN_URL;
    if (customStun) {
      stunServers.unshift(customStun);
    }

    const iceServers: RTCIceServer[] = [
      { urls: stunServers },
    ];

    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (turnUrl) {
      const turnUrls = turnUrl.split(',').map((u) => u.trim()).filter(Boolean);
      iceServers.push({
        urls: turnUrls,
        username: turnUsername || undefined,
        credential: turnCredential || undefined,
      });
    }

    return {
      iceServers,
      iceCandidatePoolSize: 10,
    };
  }

  /**
   * Sets or updates the local media stream (camera & mic)
   */
  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0] || null;
      const videoTrack = this.isScreenSharing && this.screenStream
        ? (this.screenStream.getVideoTracks()[0] || null)
        : (stream.getVideoTracks()[0] || null);

      this.replaceAudioTrack(audioTrack);
      this.replaceVideoTrack(videoTrack);
    }
  }

  /**
   * Sets screen sharing stream and state
   */
  public setScreenStream(stream: MediaStream | null, isSharing: boolean) {
    this.screenStream = stream;
    this.isScreenSharing = isSharing;
  }

  /**
   * Creates or gets a peer connection for a participant ID with duplicate prevention
   */
  public getOrCreatePeer(participantId: string): PeerConnectionEntry {
    let entry = this.peers.get(participantId);
    if (entry && entry.pc.connectionState !== 'closed') {
      return entry;
    }

    // Clean up defunct connection if any
    if (entry) {
      this.closePeer(participantId);
    }

    const config = this.getIceConfiguration();
    const pc = new RTCPeerConnection(config);
    const remoteStream = new MediaStream();

    const isPolite = this.localParticipantId ? this.localParticipantId < participantId : true;

    entry = {
      pc,
      remoteStream,
      candidateQueue: [],
      isMakingOffer: false,
      isPolite,
    };
    this.peers.set(participantId, entry);

    console.log(`[WebRTC] Peer created for participant: ${participantId} (isPolite: ${isPolite})`);

    // Pre-create transceivers or attach local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, this.localStream!);
        } catch (e) {
          console.warn(`[WebRTC] Failed to add track to ${participantId}:`, e);
        }
      });
    } else {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('video', { direction: 'sendrecv' });
    }

    // ICE Candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        console.log(`[WebRTC] ICE candidate discovered for peer: ${participantId}`);
        this.onIceCandidate(participantId, event.candidate.toJSON());
      }
    };

    // Remote Track event
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Track received: ${event.track.kind} from peer: ${participantId}`);
      
      // If event.streams has a stream, add all tracks
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!remoteStream.getTracks().some((rt) => rt.id === t.id)) {
            remoteStream.addTrack(t);
          }
        });
      }

      // Add track to remote stream if not already present
      if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
        remoteStream.addTrack(event.track);
      }

      if (this.onRemoteStream) {
        this.onRemoteStream(participantId, remoteStream);
      }

      event.track.onended = () => {
        console.log(`[WebRTC] Track ended: ${event.track.kind} from peer: ${participantId}`);
      };
    };


    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state for ${participantId}: ${pc.connectionState}`);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(participantId, pc.connectionState);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state for ${participantId}: ${pc.iceConnectionState}`);
    };

    return entry;
  }

  /**
   * Initiates an SDP Offer to a remote peer (newcomer initiating offer)
   */
  public async createOffer(targetParticipantId: string): Promise<RTCSessionDescriptionInit> {
    const entry = this.getOrCreatePeer(targetParticipantId);

    // Attach local tracks before creating offer if available
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0] || null;
      const videoTrack = this.isScreenSharing && this.screenStream
        ? (this.screenStream.getVideoTracks()[0] || null)
        : (this.localStream.getVideoTracks()[0] || null);

      const transceivers = entry.pc.getTransceivers();
      const aTx = transceivers.find((t) => t.sender?.track?.kind === 'audio' || t.receiver?.track?.kind === 'audio');
      if (aTx?.sender && audioTrack) {
        try { await aTx.sender.replaceTrack(audioTrack); } catch {}
      }
      const vTx = transceivers.find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video');
      if (vTx?.sender && videoTrack) {
        try { await vTx.sender.replaceTrack(videoTrack); } catch {}
      }
    }

    try {
      entry.isMakingOffer = true;
      const offer = await entry.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await entry.pc.setLocalDescription(offer);
      console.log(`[WebRTC] Offer created for peer: ${targetParticipantId}`);
      return offer;
    } finally {
      entry.isMakingOffer = false;
    }
  }

  /**
   * Handles an incoming SDP Offer with Perfect Negotiation glare handling
   */
  public async handleOffer(
    fromParticipantId: string,
    sdp: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | null> {
    const entry = this.getOrCreatePeer(fromParticipantId);
    console.log(`[WebRTC] Offer received from peer: ${fromParticipantId}`);

    // Perfect Negotiation: Handle Offer Collision (Glare)
    const isOfferCollision = entry.isMakingOffer || entry.pc.signalingState !== 'stable';
    if (isOfferCollision) {
      if (!entry.isPolite) {
        console.warn(`[WebRTC] Glare collision detected: impolite peer ignoring offer from ${fromParticipantId}`);
        return null;
      }
      console.log(`[WebRTC] Glare collision detected: polite peer rolling back offer for ${fromParticipantId}`);
      try {
        await Promise.all([
          entry.pc.setLocalDescription({ type: 'rollback' }),
          entry.pc.setRemoteDescription(new RTCSessionDescription(sdp)),
        ]);
      } catch (err) {
        console.warn(`[WebRTC] Error rolling back during glare collision:`, err);
        return null;
      }
    } else {
      await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }

    await this.drainCandidateQueue(entry);

    // Attach local tracks before creating answer
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0] || null;
      const videoTrack = this.isScreenSharing && this.screenStream
        ? (this.screenStream.getVideoTracks()[0] || null)
        : (this.localStream.getVideoTracks()[0] || null);

      const transceivers = entry.pc.getTransceivers();
      const aTx = transceivers.find((t) => t.sender?.track?.kind === 'audio' || t.receiver?.track?.kind === 'audio');
      if (aTx?.sender && audioTrack) {
        try { await aTx.sender.replaceTrack(audioTrack); } catch {}
      }
      const vTx = transceivers.find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video');
      if (vTx?.sender && videoTrack) {
        try { await vTx.sender.replaceTrack(videoTrack); } catch {}
      }
    }

    const answer = await entry.pc.createAnswer();
    await entry.pc.setLocalDescription(answer);
    console.log(`[WebRTC] Answer created for peer: ${fromParticipantId}`);
    return answer;
  }


  /**
   * Handles an incoming SDP Answer from a peer who responded to our offer
   */
  public async handleAnswer(
    fromParticipantId: string,
    sdp: RTCSessionDescriptionInit
  ): Promise<void> {
    const entry = this.peers.get(fromParticipantId);
    if (!entry) {
      console.warn(`[WebRTC] Received answer from unknown peer: ${fromParticipantId}`);
      return;
    }

    console.log(`[WebRTC] Answer received from peer: ${fromParticipantId}`);
    await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    await this.drainCandidateQueue(entry);
  }

  /**
   * Handles incoming remote ICE candidate.
   * If remote description is set, adds it immediately; otherwise queues it.
   */
  public async handleCandidate(
    fromParticipantId: string,
    candidateInit: RTCIceCandidateInit
  ): Promise<void> {
    const entry = this.getOrCreatePeer(fromParticipantId);

    if (entry.pc.remoteDescription && entry.pc.remoteDescription.type) {
      try {
        await entry.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        console.log(`[WebRTC] ICE candidate added directly for peer: ${fromParticipantId}`);
      } catch (err) {
        console.warn(`[WebRTC] Failed to add ICE candidate for peer ${fromParticipantId}:`, err);
      }
    } else {
      console.log(`[WebRTC] Queuing ICE candidate for peer: ${fromParticipantId} (remoteDescription pending)`);
      entry.candidateQueue.push(candidateInit);
    }
  }

  /**
   * Flushes all queued ICE candidates after remote description is set
   */
  private async drainCandidateQueue(entry: PeerConnectionEntry): Promise<void> {
    if (entry.candidateQueue.length === 0) return;
    console.log(`[WebRTC] Draining ${entry.candidateQueue.length} queued ICE candidates...`);
    while (entry.candidateQueue.length > 0) {
      const cand = entry.candidateQueue.shift();
      if (cand) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn(`[WebRTC] Error adding drained ICE candidate:`, err);
        }
      }
    }
  }

  /**
   * Replaces video track across all active peer connections without renegotiation
   * Used for camera toggle and screen sharing handoff
   */
  public async replaceVideoTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    for (const [peerId, entry] of this.peers.entries()) {
      try {
        const transceivers = entry.pc.getTransceivers();
        const videoTransceiver = transceivers.find(
          (t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video'
        );

        if (videoTransceiver && videoTransceiver.sender) {
          await videoTransceiver.sender.replaceTrack(newTrack);
        } else {
          const sender = entry.pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newTrack);
          }
        }
        console.log(`[WebRTC] Replaced video track for peer: ${peerId}`);
      } catch (err) {
        console.warn(`[WebRTC] Error replacing video track for peer ${peerId}:`, err);
      }
    }
  }

  /**
   * Replaces audio track across all active peer connections
   */
  public async replaceAudioTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    for (const [peerId, entry] of this.peers.entries()) {
      try {
        const transceivers = entry.pc.getTransceivers();
        const audioTransceiver = transceivers.find(
          (t) => t.sender?.track?.kind === 'audio' || t.receiver?.track?.kind === 'audio'
        );

        if (audioTransceiver && audioTransceiver.sender) {
          await audioTransceiver.sender.replaceTrack(newTrack);
        } else {
          const sender = entry.pc.getSenders().find((s) => s.track?.kind === 'audio');
          if (sender) {
            await sender.replaceTrack(newTrack);
          }
        }
        console.log(`[WebRTC] Replaced audio track for peer: ${peerId}`);
      } catch (err) {
        console.warn(`[WebRTC] Error replacing audio track for peer ${peerId}:`, err);
      }
    }
  }


  /**
   * Collects WebRTC performance metrics using RTCPeerConnection.getStats()
   */
  public async getPeerStats(participantId: string): Promise<WebRTCStatsSummary | null> {
    const entry = this.peers.get(participantId);
    if (!entry) return null;

    try {
      const stats = await entry.pc.getStats();
      let rttMs: number | undefined;
      let jitterMs: number | undefined;
      let packetsLost: number | undefined;

      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          if (typeof report.currentRoundTripTime === 'number') {
            rttMs = Math.round(report.currentRoundTripTime * 1000);
          }
        } else if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (typeof report.jitter === 'number') {
            jitterMs = Math.round(report.jitter * 1000);
          }
          if (typeof report.packetsLost === 'number') {
            packetsLost = report.packetsLost;
          }
        }
      });

      let quality: WebRTCStatsSummary['quality'] = 'good';
      if (entry.pc.connectionState === 'connecting') {
        quality = 'reconnecting';
      } else if (entry.pc.connectionState === 'disconnected' || entry.pc.connectionState === 'failed') {
        quality = 'disconnected';
      } else if (rttMs && rttMs < 100) {
        quality = 'excellent';
      } else if (rttMs && rttMs > 300) {
        quality = 'poor';
      }

      return {
        rttMs,
        jitterMs,
        packetsLost,
        connectionState: entry.pc.connectionState,
        iceState: entry.pc.iceConnectionState,
        quality,
      };
    } catch {
      return null;
    }
  }

  /**
   * Retrieves remote MediaStream for a participant
   */
  public getRemoteStream(participantId: string): MediaStream | null {
    return this.peers.get(participantId)?.remoteStream || null;
  }

  /**
   * Closes and cleans up a specific peer connection
   */
  public closePeer(participantId: string): void {
    const entry = this.peers.get(participantId);
    if (entry) {
      console.log(`[WebRTC] Closing peer connection for: ${participantId}`);
      entry.pc.ontrack = null;
      entry.pc.onicecandidate = null;
      entry.pc.onconnectionstatechange = null;
      entry.pc.oniceconnectionstatechange = null;
      entry.pc.onsignalingstatechange = null;
      try {
        entry.pc.getSenders().forEach((s) => {
          try { entry.pc.removeTrack(s); } catch {}
        });
      } catch {}
      try {
        entry.pc.close();
      } catch {}
      entry.remoteStream.getTracks().forEach((track) => track.stop());
      entry.candidateQueue = [];
      this.peers.delete(participantId);
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(participantId);
      }
    }
  }

  /**
   * Closes all peer connections and resets state
   */
  public closeAll(): void {
    console.log(`[WebRTC] Closing all peer connections (${this.peers.size})`);
    for (const [, entry] of this.peers.entries()) {
      entry.pc.ontrack = null;
      entry.pc.onicecandidate = null;
      entry.pc.onconnectionstatechange = null;
      entry.pc.oniceconnectionstatechange = null;
      entry.pc.onsignalingstatechange = null;
      try {
        entry.pc.getSenders().forEach((s) => {
          try { entry.pc.removeTrack(s); } catch {}
        });
      } catch {}
      try {
        entry.pc.close();
      } catch {}
      entry.remoteStream.getTracks().forEach((t) => t.stop());
      entry.candidateQueue = [];
    }
    this.peers.clear();
  }
}
