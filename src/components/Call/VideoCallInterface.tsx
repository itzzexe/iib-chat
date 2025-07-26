import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Settings,
  Users,
  Record as RecordIcon,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MoreVertical,
  MessageSquare,
  Share,
  Download
} from 'lucide-react';
import { webrtcService, CallState, CallParticipant, CallSettings } from '../../services/webrtcService';
import toast from 'react-hot-toast';

interface VideoCallInterfaceProps {
  chatId: string;
  participants: string[];
  onCallEnd: () => void;
  isIncomingCall?: boolean;
  callData?: {
    callId: string;
    callerId: string;
    callerName: string;
    callType: 'audio' | 'video';
  };
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  chatId,
  participants,
  onCallEnd,
  isIncomingCall = false,
  callData
}) => {
  const [callState, setCallState] = useState<CallState>(webrtcService.getCallState());
  const [participantsList, setParticipantsList] = useState<CallParticipant[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaDevices, setMediaDevices] = useState<{
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }>({ audioInputs: [], audioOutputs: [], videoInputs: [] });

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize WebRTC service
  useEffect(() => {
    const initializeCall = async () => {
      try {
        const socket = (window as any).socket; // Get socket from global context
        if (socket) {
          await webrtcService.initialize(socket);
          
          // Set up call state listeners
          webrtcService.setCallStateChangeCallback(setCallState);
          webrtcService.setParticipantUpdateCallback(setParticipantsList);
          
          // Load media devices
          const devices = await webrtcService.getMediaDevices();
          setMediaDevices(devices);
          
          setIsInitialized(true);
          
          if (isIncomingCall && callData) {
            // Handle incoming call
            handleIncomingCall();
          } else {
            // Start new call
            await startNewCall();
          }
        }
      } catch (error) {
        console.error('Failed to initialize call:', error);
        toast.error('Failed to initialize call. Please check your camera and microphone permissions.');
        onCallEnd();
      }
    };

    initializeCall();

    return () => {
      webrtcService.cleanup();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  // Handle incoming call
  const handleIncomingCall = () => {
    // Show incoming call UI
    toast.success(`Incoming ${callData?.callType} call from ${callData?.callerName}`, {
      duration: 0,
      action: {
        label: 'Answer',
        onClick: () => answerCall(),
      },
    });
  };

  // Answer incoming call
  const answerCall = async () => {
    if (!callData) return;
    
    try {
      await webrtcService.joinCall(callData.callId, chatId);
      startCallTimer();
      toast.success('Call answered');
    } catch (error) {
      console.error('Failed to answer call:', error);
      toast.error('Failed to answer call');
      onCallEnd();
    }
  };

  // Start new call
  const startNewCall = async () => {
    try {
      const callType = 'video'; // Default to video call
      const callId = await webrtcService.startCall(chatId, callType, participants);
      startCallTimer();
      toast.success('Call started');
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start call');
      onCallEnd();
    }
  };

  // Start call duration timer
  const startCallTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video refs
  useEffect(() => {
    participantsList.forEach(participant => {
      const videoRef = videoRefs.current[participant.id];
      if (videoRef && participant.stream) {
        videoRef.srcObject = participant.stream;
      }
    });
  }, [participantsList]);

  // Call controls
  const handleEndCall = () => {
    webrtcService.endCall();
    onCallEnd();
    toast.success('Call ended');
  };

  const handleToggleMute = () => {
    const isMuted = webrtcService.toggleMute();
    toast(isMuted ? 'Microphone muted' : 'Microphone unmuted');
  };

  const handleToggleVideo = () => {
    const isVideoOff = webrtcService.toggleVideo();
    toast(isVideoOff ? 'Video turned off' : 'Video turned on');
  };

  const handleToggleScreenShare = async () => {
    try {
      if (callState.isScreenSharing) {
        webrtcService.stopScreenShare();
        toast.success('Screen sharing stopped');
      } else {
        await webrtcService.startScreenShare();
        toast.success('Screen sharing started');
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Failed to toggle screen sharing');
    }
  };

  const handleToggleRecording = async () => {
    try {
      if (callState.isRecording) {
        webrtcService.stopRecording();
        toast.success('Recording stopped');
      } else {
        await webrtcService.startRecording();
        toast.success('Recording started');
      }
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Failed to toggle recording');
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Get grid layout for participants
  const getGridLayout = () => {
    const count = participantsList.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  // Render participant video
  const renderParticipantVideo = (participant: CallParticipant) => {
    const isLocal = participant.id === 'local';
    const hasVideo = participant.stream && !participant.isVideoOff;
    const isScreenSharing = participant.isScreenSharing;

    return (
      <div
        key={participant.id}
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${
          isLocal ? 'ring-2 ring-blue-500' : ''
        } ${isScreenSharing ? 'ring-2 ring-green-500' : ''}`}
      >
        {/* Video element */}
        <video
          ref={(el) => (videoRefs.current[participant.id] = el)}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
        
        {/* Video off overlay */}
        {!hasVideo && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-xl font-semibold">
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white text-sm">{participant.name}</p>
            </div>
          </div>
        )}

        {/* Participant info overlay */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center justify-between bg-black bg-opacity-50 rounded-lg px-2 py-1">
            <span className="text-white text-xs truncate">
              {participant.name} {isLocal ? '(You)' : ''}
            </span>
            <div className="flex items-center space-x-1">
              {participant.isMuted && (
                <MicOff className="w-3 h-3 text-red-400" />
              )}
              {participant.isVideoOff && (
                <VideoOff className="w-3 h-3 text-red-400" />
              )}
              {participant.isScreenSharing && (
                <Monitor className="w-3 h-3 text-green-400" />
              )}
            </div>
          </div>
        </div>

        {/* Speaking indicator */}
        {participant.isSpeaking && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        )}
      </div>
    );
  };

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Initializing call...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-medium">Live Call</span>
          </div>
          <span className="text-white text-sm">{formatDuration(callDuration)}</span>
          <span className="text-white text-sm">
            {participantsList.length} participant{participantsList.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video grid */}
        <div className="flex-1 p-4">
          <div className={`grid ${getGridLayout()} gap-4 h-full`}>
            {participantsList.map(renderParticipantVideo)}
          </div>
        </div>

        {/* Sidebar */}
        {(showParticipants || showChat) && (
          <div className="w-80 bg-gray-900 border-l border-gray-700">
            {showParticipants && (
              <div className="p-4">
                <h3 className="text-white font-medium mb-4">Participants</h3>
                <div className="space-y-2">
                  {participantsList.map(participant => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white text-sm">
                          {participant.name} {participant.id === 'local' ? '(You)' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {participant.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
                        {participant.isVideoOff && <VideoOff className="w-4 h-4 text-red-400" />}
                        {participant.isScreenSharing && <Monitor className="w-4 h-4 text-green-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {showChat && (
              <div className="p-4">
                <h3 className="text-white font-medium mb-4">Chat</h3>
                <div className="bg-gray-800 rounded-lg p-3 h-64 overflow-y-auto">
                  <p className="text-gray-400 text-sm">Chat feature coming soon...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center p-6 bg-black bg-opacity-50">
        <div className="flex items-center space-x-4">
          {/* Mute/Unmute */}
          <button
            onClick={handleToggleMute}
            className={`p-4 rounded-full transition-colors ${
              callState.isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {callState.isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video On/Off */}
          <button
            onClick={handleToggleVideo}
            className={`p-4 rounded-full transition-colors ${
              callState.isVideoOff
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {callState.isVideoOff ? (
              <VideoOff className="w-6 h-6 text-white" />
            ) : (
              <Video className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-4 rounded-full transition-colors ${
              callState.isScreenSharing
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {callState.isScreenSharing ? (
              <MonitorOff className="w-6 h-6 text-white" />
            ) : (
              <Monitor className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Recording */}
          <button
            onClick={handleToggleRecording}
            className={`p-4 rounded-full transition-colors ${
              callState.isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
                          {callState.isRecording ? (
                <Square className="w-6 h-6 text-white" />
              ) : (
                <RecordIcon className="w-6 h-6 text-white" />
              )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
          >
            <Settings className="w-6 h-6 text-white" />
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Call Settings</h3>
            
            <div className="space-y-4">
              {/* Audio Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Microphone</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  onChange={(e) => webrtcService.updateCallSettings({ audioInput: e.target.value })}
                  value={webrtcService.getCallSettings().audioInput}
                >
                  <option value="">Default Microphone</option>
                  {mediaDevices.audioInputs.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Video Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Camera</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  onChange={(e) => webrtcService.updateCallSettings({ videoInput: e.target.value })}
                  value={webrtcService.getCallSettings().videoInput}
                >
                  <option value="">Default Camera</option>
                  {mediaDevices.videoInputs.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audio Output */}
              <div>
                <label className="block text-sm font-medium mb-2">Speaker</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  onChange={(e) => webrtcService.updateCallSettings({ audioOutput: e.target.value })}
                  value={webrtcService.getCallSettings().audioOutput}
                >
                  <option value="">Default Speaker</option>
                  {mediaDevices.audioOutputs.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audio Processing */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={webrtcService.getCallSettings().echoCancellation}
                    onChange={(e) => webrtcService.updateCallSettings({ echoCancellation: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Echo Cancellation</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={webrtcService.getCallSettings().noiseSuppression}
                    onChange={(e) => webrtcService.updateCallSettings({ noiseSuppression: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Noise Suppression</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={webrtcService.getCallSettings().autoGainControl}
                    onChange={(e) => webrtcService.updateCallSettings({ autoGainControl: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Auto Gain Control</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallInterface; 