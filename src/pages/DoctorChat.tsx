import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../hooks/useChatStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { wsService } from '../services/websocketService';
import { closeChatRoom, sendVoiceMessage } from '../apis/chatApi';
import ChatMessage from '../components/Chat/ChatMessage';
import ChatInput from '../components/Chat/ChatInput';

const DoctorChat = () => {
  const navigate = useNavigate();
  const { chatRoomId: paramChatRoomId } = useParams<{ chatRoomId: string }>();
  const {
    chatRoomId: storeChatRoomId,
    messages,
    isChatClosed,
    userId: storeUserId,
    patientName: storePatientName,
    appointmentTime: storeAppointmentTime,
    setChatRoom,
  } = useChatStore();
  const { accessToken, doctorId: authDoctorId } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // localStorage에서 값 읽기
  const localDoctorId = localStorage.getItem('doctorId');
  const userId = storeUserId || String(authDoctorId || localDoctorId || 'doctor');

  // URL 파라미터로 전달된 chatRoomId 또는 store의 chatRoomId 또는 localStorage 사용
  const chatRoomId = paramChatRoomId || storeChatRoomId;

  // 약속 시간 포맷팅
  const formatAppointmentTime = (isoTime: string | null): string => {
    if (!isoTime) return '';
    try {
      const date = new Date(isoTime);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${month}월 ${day}일 ${hour}:${minute}`;
    } catch {
      return '';
    }
  };

  // WebSocket 초기화 및 채팅방 구독
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeChat = async () => {
      try {
        // WebSocket 연결 (아직 연결되지 않았으면)
        if (!wsService.isConnected() && accessToken) {
          const wsUrl = import.meta.env.VITE_WS_URL;
          if (!wsUrl) {
            throw new Error('WebSocket URL not configured');
          }
          await wsService.connectAsDoctor(
            {
              url: wsUrl,
              accessToken,
            },
            userId || ''
          );
        }

        // 채팅방 구독
        if (chatRoomId) {
          wsService.subscribe(`/sub/chats/${chatRoomId}/messages`);
          console.log('[DoctorChat] userId:', userId, 'authDoctorId:', authDoctorId);
          // store에 채팅방 정보 설정 (필요시)
          if (!storeChatRoomId && accessToken) {
            setChatRoom(chatRoomId, 'doctor', userId);
          }
        }
      } catch (error) {
        console.error('[DoctorChat] Failed to initialize chat:', error);
        alert('채팅 연결에 실패했습니다.');
        navigate('/');
      }
    };

    if (chatRoomId && accessToken) {
      initializeChat();
    }

    return () => {
      // 언마운트 시 구독 해제는 하지 않음
    };
  }, [chatRoomId, accessToken, navigate, userId, storeChatRoomId, setChatRoom]);

  // 메시지 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 진료 종료 후 3초 뒤 완료 페이지로 이동
  useEffect(() => {
    if (isChatClosed) {
      const timer = setTimeout(() => {
        navigate('/doctor/consultation-completed');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isChatClosed, navigate]);

  // 진료 종료 처리
  const handleEndConsultation = async () => {
    if (!chatRoomId) return;

    try {
      await closeChatRoom(chatRoomId);
      // UI 업데이트는 WebSocket 브로드캐스트로 처리됨
    } catch (error) {
      console.error('[DoctorChat] Failed to close chat:', error);
      alert('진료 종료에 실패했습니다.');
    }
  };

  // 음성 녹음 시작
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

        setIsSending(true);
        try {
          const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
            type: 'audio/webm',
          });
          const response = await sendVoiceMessage(chatRoomId || '', audioFile);
          console.log('[DoctorChat] Voice message sent successfully:', response);
        } catch (error) {
          console.error('[DoctorChat] Failed to send voice message:', error);
          alert('음성 메시지 전송에 실패했습니다.');
        } finally {
          setIsSending(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('[DoctorChat] Failed to start recording:', error);
      alert('마이크 권한을 허용해주세요.');
    }
  };

  // 음성 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
      setIsRecording(false);
    }
  };

  if (!chatRoomId) {
    return (
      <div className="w-full h-screen bg-[#3A3F47] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#B0B5BC]">채팅방 정보가 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-[#5B9EFF] text-white rounded-lg hover:bg-[#4A8AE8]"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-[#3A3F47] px-28 py-20">
      {/* 헤더 */}
      <div className="bg-[#3A3F47] px-0 py-0 flex items-center justify-between mb-8">
        <div className="flex items-baseline gap-4">
          <h1
            style={{
              color: '#FFF',
              fontFamily: 'Inter',
              fontSize: '32px',
              fontWeight: '600',
              lineHeight: '150%',
              letterSpacing: '-0.64px',
            }}
          >
            {storePatientName || '환자'}
          </h1>
          <p className="text-[#B0B5BC] text-sm">
            {formatAppointmentTime(storeAppointmentTime)}
          </p>
        </div>
        <div className="flex items-center gap-[30px]">
          {/* 음성 인식 버튼 */}
          {!isChatClosed && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSending}
              style={{
                background: 'linear-gradient(207deg, #0C58FF 13.18%, #3FB6FF 91.66%)',
              }}
              className="w-[244px] h-[88px] rounded-[12px] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <span className="text-[32px] font-[600] leading-[150%] tracking-[-0.64px]" style={{ fontFamily: 'Inter' }}>
                {isRecording ? '중지' : '음성 인식'}
              </span>
            </button>
          )}
          {!isChatClosed && (
            <button
              onClick={handleEndConsultation}
              className="w-[244px] h-[88px] bg-[#7A8490] text-white rounded-[12px] font-medium hover:bg-[#6A7480] transition-colors flex items-center justify-center"
            >
              <span className="text-[32px] font-[600] leading-[150%] tracking-[-0.64px]" style={{ fontFamily: 'Inter' }}>
                진료 종료
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-hidden p-4 space-y-4 pb-20">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#7A8090]">
              <p>환자의 메시지를 기다리는 중입니다.</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === userId}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 - 하단에서 80px 위에 고정, 좌우 112px 여백 */}
      <div className="fixed bottom-20 left-28 right-28">
        <ChatInput chatRoomId={chatRoomId} isEnabled={!isChatClosed} userRole="doctor" />
      </div>
    </div>
  );
};

export default DoctorChat;
