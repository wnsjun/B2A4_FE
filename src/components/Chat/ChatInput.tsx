import React, { useState, useRef } from 'react';
import { wsService } from '../../services/websocketService';
import { sendVoiceMessage } from '../../apis/chatApi';

interface ChatInputProps {
  chatRoomId: string;
  isEnabled: boolean;
  userRole?: 'patient' | 'doctor';
}

const ChatInput: React.FC<ChatInputProps> = ({ chatRoomId, isEnabled, userRole = 'patient' }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSendMessage = () => {
    if (message.trim() && chatRoomId) {
      wsService.sendChatMessage(chatRoomId, message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/wav',
        });

        // 의사만 음성 메시지 전송 가능
        if (userRole === 'doctor') {
          setIsSending(true);
          try {
            const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, {
              type: 'audio/wav',
            });
            const response = await sendVoiceMessage(chatRoomId, audioFile);
            console.log('[ChatInput] Voice message sent successfully:', response);
            // 음성 메시지는 WebSocket 브로드캐스트로 수신됨
          } catch (error) {
            console.error('[ChatInput] Failed to send voice message:', error);
            alert('음성 메시지 전송에 실패했습니다.');
          } finally {
            setIsSending(false);
          }
        } else {
          console.log('[ChatInput] Only doctors can send voice messages');
          alert('의사만 음성 메시지를 전송할 수 있습니다.');
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('[ChatInput] Failed to start recording:', error);
      alert('마이크 권한을 허용해주세요.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
      setIsRecording(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className="bg-[#F5F5F5] border-t border-[#E8EAED] p-4">
        <div className="text-center text-[#999] text-sm">
          진료가 종료되었습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-[#E8EAED] p-4">
      <div className="flex gap-2">
        {/* 텍스트 입력 */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요"
          disabled={!isEnabled || isSending}
          className="flex-1 border border-[#E8EAED] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#5B9EFF] disabled:bg-[#F5F5F5] disabled:text-[#999]"
        />

        {/* 의사용: 음성 녹음 버튼 */}
        {userRole === 'doctor' && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isEnabled || isSending}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : isEnabled && !isSending
                  ? 'bg-[#F5F5F5] text-[#666B76] hover:bg-[#E8EAED]'
                  : 'bg-[#CCC] text-[#999] cursor-not-allowed'
            }`}
            title={isRecording ? '녹음 중지' : '음성 녹음'}
          >
            {isSending ? '⏳' : isRecording ? '⏹️' : '🎤'}
          </button>
        )}

        {/* 전송 버튼 */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || !isEnabled || isSending}
          className="px-6 py-3 bg-[#5B9EFF] text-white rounded-lg font-medium hover:bg-[#4A8AE8] disabled:bg-[#CCC] disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? '전송 중...' : '전송'}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
