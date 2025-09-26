import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import 'webrtc-adapter';

export interface CallParticipant {
  id: string;
  name: string;
  stream?: MediaStream;
  peer?: any;
  isScreenSharing: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  volume: number;
}

export interface CallState {
  isInCall: boolean;
  isCallActive: boolean;
  callType: 'audio' | 'video' | 'screen';
  participants: CallParticipant[];
  localStream?: MediaStream;
  screenStream?: MediaStream;
  isScreenSharing: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isRecording: boolean;
  callStartTime?: Date;
  chatId?: string;
  callId?: string;
}

export interface CallSettings {
  audioInput: string;
  audioOutput: string;
  videoInput: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

class WebRTCService {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peers: Map<string, any> = new Map();
  private callState: CallState = {
    isInCall: false,
    isCallActive: false,
    callType: 'video',
    participants: [],
    isScreenSharing: false,
    isMuted: false,
    isVideoOff: false,
    isRecording: false,
  };
  private callSettings: CallSettings = {
    audioInput: '',
    audioOutput: '',
    videoInput: '',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private onCallStateChange: ((state: CallState) => void) | null = null;
  private onParticipantUpdate: ((participants: CallParticipant[]) => void) | null = null;

  constructor() {
    this.loadCallSettings();
  }

  // Initialize WebRTC service
  async initialize(socket: Socket): Promise<void> {
    this.socket = socket;
    this.setupSocketListeners();
    await this.getUserMedia();
  }

  // Setup Socket.IO listeners for call signaling
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Call invitation
    this.socket.on('call:invite', async (data: {
      callId: string;
      chatId: string;
      callerId: string;
      callerName: string;
      callType: 'audio' | 'video';
      participants: string[];
    }) => {
      console.log('📞 Received call invitation:', data);
      // Handle incoming call invitation
      this.handleIncomingCall(data);
    });

    // Call accepted
    this.socket.on('call:accepted', async (data: {
      callId: string;
      participantId: string;
      participantName: string;
    }) => {
      console.log('✅ Call accepted by:', data.participantName);
      await this.addParticipant(data.participantId, data.participantName);
    });

    // Call rejected
    this.socket.on('call:rejected', (data: {
      callId: string;
      participantId: string;
      participantName: string;
    }) => {
      console.log('❌ Call rejected by:', data.participantName);
      this.removeParticipant(data.participantId);
    });

    // Call ended
    this.socket.on('call:ended', (data: { callId: string; endedBy: string }) => {
      console.log('📞 Call ended by:', data.endedBy);
      this.endCall();
    });

    // Participant joined
    this.socket.on('call:participant-joined', async (data: {
      participantId: string;
      participantName: string;
    }) => {
      console.log('👤 Participant joined:', data.participantName);
      await this.addParticipant(data.participantId, data.participantName);
    });

    // Participant left
    this.socket.on('call:participant-left', (data: {
      participantId: string;
      participantName: string;
    }) => {
      console.log('👤 Participant left:', data.participantName);
      this.removeParticipant(data.participantId);
    });

    // WebRTC signaling
    this.socket.on('call:offer', async (data: {
      from: string;
      offer: any;
    }) => {
      console.log('📤 Received offer from:', data.from);
      await this.handleOffer(data.from, data.offer);
    });

    this.socket.on('call:answer', (data: {
      from: string;
      answer: any;
    }) => {
      console.log('📤 Received answer from:', data.from);
      this.handleAnswer(data.from, data.answer);
    });

    this.socket.on('call:ice-candidate', (data: {
      from: string;
      candidate: any;
    }) => {
      console.log('📤 Received ICE candidate from:', data.from);
      this.handleIceCandidate(data.from, data.candidate);
    });

    // Call controls
    this.socket.on('call:participant-muted', (data: {
      participantId: string;
      isMuted: boolean;
    }) => {
      this.updateParticipantMute(data.participantId, data.isMuted);
    });

    this.socket.on('call:participant-video-off', (data: {
      participantId: string;
      isVideoOff: boolean;
    }) => {
      this.updateParticipantVideo(data.participantId, data.isVideoOff);
    });

    this.socket.on('call:screen-share-started', (data: {
      participantId: string;
      participantName: string;
    }) => {
      this.handleScreenShareStarted(data.participantId, data.participantName);
    });

    this.socket.on('call:screen-share-stopped', (data: {
      participantId: string;
    }) => {
      this.handleScreenShareStopped(data.participantId);
    });
  }

  // Get user media (camera and microphone)
  async getUserMedia(): Promise<MediaStream> {
    try {
      const constraints = {
        audio: {
          echoCancellation: this.callSettings.echoCancellation,
          noiseSuppression: this.callSettings.noiseSuppression,
          autoGainControl: this.callSettings.autoGainControl,
          deviceId: this.callSettings.audioInput ? { exact: this.callSettings.audioInput } : undefined,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          deviceId: this.callSettings.videoInput ? { exact: this.callSettings.videoInput } : undefined,
        },
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.callState.localStream = this.localStream;
      this.updateCallState();
      
      console.log('✅ Got user media stream');
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      throw error;
    }
  }

  // Get screen share stream
  async getScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: false,
      });

      this.callState.screenStream = this.screenStream;
      this.callState.isScreenSharing = true;
      this.updateCallState();

      // Handle screen share stop
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      console.log('✅ Got screen share stream');
      return this.screenStream;
    } catch (error) {
      console.error('❌ Failed to get screen share:', error);
      throw error;
    }
  }

  // Start a call
  async startCall(chatId: string, callType: 'audio' | 'video', participants: string[]): Promise<string> {
    if (!this.socket) throw new Error('Socket not connected');

    const callId = this.generateCallId();
    
    this.callState = {
      isInCall: true,
      isCallActive: true,
      callType,
      participants: [],
      localStream: this.localStream || undefined,
      isScreenSharing: false,
      isMuted: false,
      isVideoOff: callType === 'audio',
      isRecording: false,
      callStartTime: new Date(),
      chatId,
      callId,
    };

    // Add local participant
    this.callState.participants.push({
      id: 'local',
      name: 'You',
      stream: this.localStream || undefined,
      isScreenSharing: false,
      isMuted: false,
      isVideoOff: callType === 'audio',
      isSpeaking: false,
      volume: 1,
    });

    this.updateCallState();

    // Send call invitation
    this.socket.emit('call:invite', {
      callId,
      chatId,
      callType,
      participants,
    });

    console.log('📞 Started call:', { callId, chatId, callType, participants });
    return callId;
  }

  // Join an existing call
  async joinCall(callId: string, chatId: string): Promise<void> {
    if (!this.socket) throw new Error('Socket not connected');

    this.callState = {
      isInCall: true,
      isCallActive: true,
      callType: 'video', // Will be updated when joining
      participants: [],
      localStream: this.localStream || undefined,
      isScreenSharing: false,
      isMuted: false,
      isVideoOff: false,
      isRecording: false,
      callStartTime: new Date(),
      chatId,
      callId,
    };

    // Add local participant
    this.callState.participants.push({
      id: 'local',
      name: 'You',
      stream: this.localStream || undefined,
      isScreenSharing: false,
      isMuted: false,
      isVideoOff: false,
      isSpeaking: false,
      volume: 1,
    });

    this.updateCallState();

    // Join call room
    this.socket.emit('call:join', { callId, chatId });
    console.log('📞 Joined call:', callId);
  }

  // End the current call
  async endCall(): Promise<void> {
    if (!this.socket) return;

    const callEndTime = new Date();
    const callDuration = this.callState.callStartTime 
      ? Math.floor((callEndTime.getTime() - this.callState.callStartTime.getTime()) / 1000)
      : 0;

    // Stop all streams
    this.stopAllStreams();

    // Clean up peers
    this.peers.forEach(peer => peer.destroy());
    this.peers.clear();

    // Save call record (only if call was active, has real participants, and duration is more than 1 second)
    const realParticipants = this.callState.participants.filter(p => p.id !== 'local');
    if (this.callState.callId && this.callState.chatId && this.callState.isCallActive && 
        realParticipants.length > 0 && callDuration > 1) {
      try {
        const { default: dataServiceAPI } = await import('../services/dataService');
        const currentUser = dataServiceAPI.getStoredUser();
        
        if (currentUser) {
          const callRecord = {
            callId: this.callState.callId,
            chatId: this.callState.chatId,
            chatName: this.getChatName(),
            participants: realParticipants.map(p => p.id),
            participantNames: realParticipants.map(p => p.name),
            callType: this.callState.callType === 'screen' ? 'video' : this.callState.callType,
            startTime: this.callState.callStartTime || new Date(),
            endTime: callEndTime,
            duration: callDuration,
            status: 'completed' as const,
            initiatedBy: currentUser.id,
            initiatedByName: currentUser.name,
            isIncoming: false,
            hasRecording: this.callState.isRecording,
            recordingUrl: this.callState.isRecording ? this.getRecordingUrl() : undefined
          };

          await dataServiceAPI.saveCallRecord(callRecord);
          console.log('📝 Call record saved');
        }
      } catch (error: any) {
        // Handle specific error cases
        if (error.response?.status === 409) {
          console.log('📝 Call record already exists, skipping save');
        } else if (error.response?.status === 500) {
          console.error('❌ Server error saving call record:', error.response?.data);
        } else {
          console.error('❌ Failed to save call record:', error);
        }
      }
    }

    // Reset call state
    this.callState = {
      isInCall: false,
      isCallActive: false,
      callType: 'video',
      participants: [],
      isScreenSharing: false,
      isMuted: false,
      isVideoOff: false,
      isRecording: false,
    };

    this.updateCallState();

    // Notify server
    if (this.callState.callId) {
      this.socket.emit('call:end', { callId: this.callState.callId });
    }

    console.log('📞 Call ended');
  }

  // Toggle mute
  toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.callState.isMuted = !audioTrack.enabled;
      
      // Update local participant
      const localParticipant = this.callState.participants.find(p => p.id === 'local');
      if (localParticipant) {
        localParticipant.isMuted = this.callState.isMuted;
      }

      this.updateCallState();

      // Notify other participants
      if (this.socket && this.callState.callId) {
        this.socket.emit('call:participant-muted', {
          callId: this.callState.callId,
          isMuted: this.callState.isMuted,
        });
      }

      console.log('🔇 Mute toggled:', this.callState.isMuted);
      return this.callState.isMuted;
    }
    return false;
  }

  // Toggle video
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.callState.isVideoOff = !videoTrack.enabled;
      
      // Update local participant
      const localParticipant = this.callState.participants.find(p => p.id === 'local');
      if (localParticipant) {
        localParticipant.isVideoOff = this.callState.isVideoOff;
      }

      this.updateCallState();

      // Notify other participants
      if (this.socket && this.callState.callId) {
        this.socket.emit('call:participant-video-off', {
          callId: this.callState.callId,
          isVideoOff: this.callState.isVideoOff,
        });
      }

      console.log('📹 Video toggled:', this.callState.isVideoOff);
      return this.callState.isVideoOff;
    }
    return false;
  }

  // Start screen sharing
  async startScreenShare(): Promise<void> {
    try {
      const screenStream = await this.getScreenShare();
      
      // Update local participant
      const localParticipant = this.callState.participants.find(p => p.id === 'local');
      if (localParticipant) {
        localParticipant.isScreenSharing = true;
      }

      // Replace video track in all peers
      this.peers.forEach(peer => {
        const senders = peer.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      });

      this.updateCallState();

      // Notify other participants
      if (this.socket && this.callState.callId) {
        this.socket.emit('call:screen-share-started', {
          callId: this.callState.callId,
        });
      }

      console.log('🖥️ Screen sharing started');
    } catch (error) {
      console.error('❌ Failed to start screen sharing:', error);
      throw error;
    }
  }

  // Stop screen sharing
  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    this.callState.screenStream = undefined;
    this.callState.isScreenSharing = false;

    // Update local participant
    const localParticipant = this.callState.participants.find(p => p.id === 'local');
    if (localParticipant) {
      localParticipant.isScreenSharing = false;
    }

    // Restore video track in all peers
    if (this.localStream) {
      this.peers.forEach(peer => {
        const senders = peer.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(this.localStream!.getVideoTracks()[0]);
        }
      });
    }

    this.updateCallState();

    // Notify other participants
    if (this.socket && this.callState.callId) {
      this.socket.emit('call:screen-share-stopped', {
        callId: this.callState.callId,
      });
    }

    console.log('🖥️ Screen sharing stopped');
  }

  // Start recording
  async startRecording(): Promise<void> {
    if (!this.localStream) throw new Error('No local stream available');

    try {
      const stream = new MediaStream();
      
      // Add local stream tracks
      this.localStream.getTracks().forEach(track => {
        stream.addTrack(track);
      });

      // Add remote streams tracks
      this.callState.participants.forEach(participant => {
        if (participant.stream && participant.id !== 'local') {
          participant.stream.getTracks().forEach(track => {
            stream.addTrack(track);
          });
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      this.recordedChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-recording-${new Date().toISOString()}.webm`;
        a.click();
        
        URL.revokeObjectURL(url);
      };

      this.mediaRecorder.start();
      this.callState.isRecording = true;
      this.updateCallState();

      console.log('🎥 Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  // Stop recording
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.callState.isRecording = false;
      this.updateCallState();
      console.log('🎥 Recording stopped');
    }
  }

  // Get available media devices
  async getMediaDevices(): Promise<{
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      return {
        audioInputs: devices.filter(device => device.kind === 'audioinput'),
        audioOutputs: devices.filter(device => device.kind === 'audiooutput'),
        videoInputs: devices.filter(device => device.kind === 'videoinput'),
      };
    } catch (error) {
      console.error('❌ Failed to get media devices:', error);
      throw error;
    }
  }

  // Update call settings
  updateCallSettings(settings: Partial<CallSettings>): void {
    this.callSettings = { ...this.callSettings, ...settings };
    this.saveCallSettings();
  }

  // Load call settings from localStorage
  private loadCallSettings(): void {
    try {
      const saved = localStorage.getItem('iib-chat-call-settings');
      if (saved) {
        this.callSettings = { ...this.callSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('❌ Failed to load call settings:', error);
    }
  }

  // Save call settings to localStorage
  private saveCallSettings(): void {
    try {
      localStorage.setItem('iib-chat-call-settings', JSON.stringify(this.callSettings));
    } catch (error) {
      console.error('❌ Failed to save call settings:', error);
    }
  }

  // Handle incoming call
  private handleIncomingCall(data: any): void {
    // This will be handled by the UI component
    // The UI should show a call invitation dialog
    console.log('📞 Incoming call:', data);
  }

  // Add participant to call
  private async addParticipant(participantId: string, participantName: string): Promise<void> {
    const participant: CallParticipant = {
      id: participantId,
      name: participantName,
      isScreenSharing: false,
      isMuted: false,
      isVideoOff: false,
      isSpeaking: false,
      volume: 1,
    };

    this.callState.participants.push(participant);
    this.updateCallState();

    // Create peer connection
    await this.createPeerConnection(participantId);
  }

  // Remove participant from call
  private removeParticipant(participantId: string): void {
    const peer = this.peers.get(participantId);
    if (peer) {
      peer.destroy();
      this.peers.delete(participantId);
    }

    this.callState.participants = this.callState.participants.filter(p => p.id !== participantId);
    this.updateCallState();
  }

  // Create peer connection
  private async createPeerConnection(participantId: string): Promise<void> {
    if (!this.localStream) return;

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.localStream,
    });

    peer.on('signal', (data) => {
      if (this.socket) {
        this.socket.emit('call:offer', {
          to: participantId,
          offer: data,
        });
      }
    });

    peer.on('stream', (stream) => {
      const participant = this.callState.participants.find(p => p.id === participantId);
      if (participant) {
        participant.stream = stream;
        this.updateCallState();
      }
    });

    this.peers.set(participantId, peer);
  }

  // Handle offer from peer
  private async handleOffer(from: string, offer: any): Promise<void> {
    if (!this.localStream) return;

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: this.localStream,
    });

    peer.signal(offer);

    peer.on('signal', (data) => {
      if (this.socket) {
        this.socket.emit('call:answer', {
          to: from,
          answer: data,
        });
      }
    });

    peer.on('stream', (stream) => {
      const participant = this.callState.participants.find(p => p.id === from);
      if (participant) {
        participant.stream = stream;
        this.updateCallState();
      }
    });

    this.peers.set(from, peer);
  }

  // Handle answer from peer
  private handleAnswer(from: string, answer: any): void {
    const peer = this.peers.get(from);
    if (peer) {
      peer.signal(answer);
    }
  }

  // Handle ICE candidate from peer
  private handleIceCandidate(from: string, candidate: any): void {
    const peer = this.peers.get(from);
    if (peer) {
      peer.signal(candidate);
    }
  }

  // Update participant mute status
  private updateParticipantMute(participantId: string, isMuted: boolean): void {
    const participant = this.callState.participants.find(p => p.id === participantId);
    if (participant) {
      participant.isMuted = isMuted;
      this.updateCallState();
    }
  }

  // Update participant video status
  private updateParticipantVideo(participantId: string, isVideoOff: boolean): void {
    const participant = this.callState.participants.find(p => p.id === participantId);
    if (participant) {
      participant.isVideoOff = isVideoOff;
      this.updateCallState();
    }
  }

  // Handle screen share started
  private handleScreenShareStarted(participantId: string, participantName: string): void {
    const participant = this.callState.participants.find(p => p.id === participantId);
    if (participant) {
      participant.isScreenSharing = true;
      this.updateCallState();
    }
  }

  // Handle screen share stopped
  private handleScreenShareStopped(participantId: string): void {
    const participant = this.callState.participants.find(p => p.id === participantId);
    if (participant) {
      participant.isScreenSharing = false;
      this.updateCallState();
    }
  }

  // Stop all streams
  private stopAllStreams(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  // Update call state and notify listeners
  private updateCallState(): void {
    if (this.onCallStateChange) {
      this.onCallStateChange({ ...this.callState });
    }
    if (this.onParticipantUpdate) {
      this.onParticipantUpdate([...this.callState.participants]);
    }
  }

  // Generate unique call ID
  private generateCallId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const userId = this.socket?.id || 'unknown';
    return `call_${timestamp}_${random}_${userId}`;
  }

  // Set call state change callback
  setCallStateChangeCallback(callback: (state: CallState) => void): void {
    this.onCallStateChange = callback;
  }

  // Set participant update callback
  setParticipantUpdateCallback(callback: (participants: CallParticipant[]) => void): void {
    this.onParticipantUpdate = callback;
  }

  // Get current call state
  getCallState(): CallState {
    return { ...this.callState };
  }

  // Get call settings
  getCallSettings(): CallSettings {
    return { ...this.callSettings };
  }

  // Get chat name for call record
  private getChatName(): string {
    // This would typically come from the chat context
    // For now, we'll use a default name
    return 'Chat';
  }

  // Get recording URL
  private getRecordingUrl(): string {
    // This would be the URL where the recording is stored
    // For now, we'll return a placeholder
    return '';
  }

  // Cleanup
  cleanup(): void {
    this.endCall();
    this.stopAllStreams();
    this.peers.forEach(peer => peer.destroy());
    this.peers.clear();
    this.socket = null;
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
export default webrtcService;