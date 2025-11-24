import React, { useState, useRef } from 'react';
import { wsService } from '../../services/websocketService';
import { sendVoiceMessage } from '../../apis/chatApi';
import { useChatStore } from '../../hooks/useChatStore';

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
  const { addMessage } = useChatStore();

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
          type: 'audio/webm',
        });

        // 의사만 음성 메시지 전송 가능
        if (userRole === 'doctor') {
          setIsSending(true);
          try {
            const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
              type: 'audio/webm',
            });
            const response = await sendVoiceMessage(chatRoomId, audioFile);
            console.log('[ChatInput] Voice message sent successfully:', response);
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

  // 환자용과 의사용에 따라 다른 크기 설정
  const isPatient = userRole === 'patient';
  const inputWidth = isPatient ? 'flex-1' : 'w-[740px]';
  const containerHeight = isPatient ? 'h-auto' : 'h-[88px]';
  const inputHeight = isPatient ? 'h-12' : 'h-[88px]';
  const fontSize = isPatient ? 'text-base' : 'text-[32px]';
  const fontSizeSpan = isPatient ? 'text-sm' : 'text-[32px]';
  const buttonWidth = isPatient ? 'px-6 py-2' : 'w-[244px] h-[88px]';
  const buttonText = isPatient ? '전송' : '대화입력';

  if (!isEnabled) {
    return (
      <div className="bg-[#3A3F47] p-4">
        <div className="text-center text-[#B0B5BC] text-xs">
          진료가 종료되었습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#3A3F47] flex-shrink-0 flex items-center gap-3 px-4 py-3 ${containerHeight} ${isPatient ? 'flex-wrap' : ''}`}>
      {/* 텍스트 입력 */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="대화를 입력하세요"
        disabled={!isEnabled || isSending}
        className={`${inputWidth} bg-transparent border-b-2 border-[#A9ACB2] px-0 py-0 ${inputHeight} placeholder-[#A9ACB2] focus:outline-none focus:border-[#0C58FF] disabled:placeholder-[#7A8090] disabled:text-[#7A8090] ${fontSize}`}
        style={{
          color: '#FFFFFF',
          fontFamily: 'Inter',
          fontWeight: '600',
          lineHeight: '150%',
          letterSpacing: isPatient ? '0px' : '-0.64px',
        }}
      />

      {/* 대화입력 버튼 */}
      <button
        onClick={handleSendMessage}
        disabled={!message.trim() || !isEnabled || isSending}
        style={{
          background: 'linear-gradient(207deg, #0C58FF 13.18%, #3FB6FF 91.66%)',
        }}
        className={`${isPatient ? `${buttonWidth} rounded-lg text-white text-xs font-medium` : `w-[244px] h-[88px] rounded-[12px] text-white flex items-center justify-center`} disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center flex-shrink-0`}
      >
        <span className={`font-[600] leading-[150%] ${fontSizeSpan}`} style={{ fontFamily: 'Inter', letterSpacing: isPatient ? '0px' : '-0.64px' }}>
          {buttonText}
        </span>
      </button>
    </div>
  );
};

export default ChatInput;
