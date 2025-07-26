import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic, X, User, Users } from 'lucide-react';
import { User as UserType } from '../../types';

interface CallInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (callType: 'audio' | 'video', participants: string[]) => void;
  onAnswerCall: () => void;
  onRejectCall: () => void;
  isIncomingCall?: boolean;
  callData?: {
    callId: string;
    callerId: string;
    callerName: string;
    callType: 'audio' | 'video';
    participants: string[];
  };
  availableUsers?: UserType[];
  selectedChatId?: string;
  selectedParticipants?: string[];
}

const CallInvitationModal: React.FC<CallInvitationModalProps> = ({
  isOpen,
  onClose,
  onStartCall,
  onAnswerCall,
  onRejectCall,
  isIncomingCall = false,
  callData,
  availableUsers = [],
  selectedChatId,
  selectedParticipants = []
}) => {
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(selectedParticipants);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (isIncomingCall && callData) {
      setIsRinging(true);
      // Play ringtone
      playRingtone();
    }
  }, [isIncomingCall, callData]);

  useEffect(() => {
    setSelectedUsers(selectedParticipants);
  }, [selectedParticipants]);

  const playRingtone = () => {
    // Create audio context for ringtone
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);

    // Repeat ringtone
    const ringInterval = setInterval(() => {
      if (!isRinging) {
        clearInterval(ringInterval);
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    }, 2000);

    return () => clearInterval(ringInterval);
  };

  const handleStartCall = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one participant');
      return;
    }
    onStartCall(callType, selectedUsers);
    onClose();
  };

  const handleAnswerCall = () => {
    setIsRinging(false);
    onAnswerCall();
    onClose();
  };

  const handleRejectCall = () => {
    setIsRinging(false);
    onRejectCall();
    onClose();
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getCallIcon = () => {
    if (isIncomingCall && callData) {
      return callData.callType === 'video' ? <Video className="w-8 h-8" /> : <Mic className="w-8 h-8" />;
    }
    return callType === 'video' ? <Video className="w-8 h-8" /> : <Mic className="w-8 h-8" />;
  };

  const getCallTitle = () => {
    if (isIncomingCall && callData) {
      return `Incoming ${callData.callType} call`;
    }
    return `Start ${callType} call`;
  };

  const getCallDescription = () => {
    if (isIncomingCall && callData) {
      return `${callData.callerName} is calling you...`;
    }
    return `Select participants for your ${callType} call`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              isIncomingCall 
                ? 'bg-green-100 text-green-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              {getCallIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{getCallTitle()}</h3>
              <p className="text-gray-600 text-sm">{getCallDescription()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incoming Call */}
        {isIncomingCall && callData && (
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-gray-600" />
            </div>
            <h4 className="text-xl font-semibold mb-2">{callData.callerName}</h4>
            <p className="text-gray-600 mb-4">
              {callData.callType === 'video' ? 'Video Call' : 'Voice Call'}
            </p>
            
            {/* Call Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleAnswerCall}
                className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleRejectCall}
                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Outgoing Call */}
        {!isIncomingCall && (
          <>
            {/* Call Type Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Call Type</h4>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCallType('video')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    callType === 'video'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Video className="w-5 h-5" />
                    <span>Video Call</span>
                  </div>
                </button>
                <button
                  onClick={() => setCallType('audio')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    callType === 'audio'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Mic className="w-5 h-5" />
                    <span>Voice Call</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Participant Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Select Participants</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {availableUsers.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm">{user.name}</span>
                    </div>
                  </label>
                ))}
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {selectedUsers.length} participant{selectedUsers.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Call Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartCall}
                disabled={selectedUsers.length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Start Call
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CallInvitationModal; 