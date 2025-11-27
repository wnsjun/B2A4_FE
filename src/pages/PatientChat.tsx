import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../hooks/useChatStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { wsService } from '../services/websocketService';
import { closeChatRoom } from '../apis/chatApi';
import ChatMessage from '../components/Chat/ChatMessage';
import ChatInput from '../components/Chat/ChatInput';

const PatientChat = () => {
  const navigate = useNavigate();
  const {
    chatRoomId: storeChatRoomId,
    messages,
    isChatClosed,
    userId: storeUserId,
    setChatRoom,
    setMessages,
    preQuestionAnswers,
    clearPreQuestionAnswers,
  } = useChatStore();
  const { accessToken, patientId } = useAuthStore();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMessageSentRef = useRef(false);
  const wsInitializedRef = useRef(false);

  // localStorage에서 값 읽기
  const localChatRoomId = localStorage.getItem('chatRoomId');
  const localUserId = localStorage.getItem('userId');
  const chatRoomId = storeChatRoomId || localChatRoomId;
  // localStorage(API 응답에서 저장한 patientId)를 우선으로 사용
  const userId = localUserId || patientId || storeUserId;
  const doctorName = localStorage.getItem('doctorName') || '의사';
  const appointmentTime = localStorage.getItem('appointmentTime') || '';

  // 로컬스토리지 값을 store에 저장 및 메시지 복구
  useEffect(() => {
    if (localChatRoomId && !storeChatRoomId) {
      const currentUserId = patientId || localUserId || 'patient';
      setChatRoom(localChatRoomId, 'patient', currentUserId);

      // localStorage에 저장된 메시지 복구
      const savedMessages = localStorage.getItem(`chat_${localChatRoomId}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        } catch (error) {
          console.error('[PatientChat] Failed to load messages from localStorage:', error);
        }
      }
    }
  }, [localChatRoomId, storeChatRoomId, localUserId, patientId, setChatRoom, setMessages]);

  // WebSocket 초기화 및 채팅방 구독
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // WebSocket 연결 (아직 연결되지 않았으면)
        if (!wsService.isConnected() && accessToken && !wsInitializedRef.current) {
          const wsUrl = import.meta.env.VITE_WS_URL;
          if (!wsUrl) {
            throw new Error('WebSocket URL not configured');
          }
          await wsService.connectAsPatient({
            url: wsUrl,
            accessToken,
          });
          wsInitializedRef.current = true;
        }

        // 채팅방 구독
        if (chatRoomId) {
          wsService.subscribe(`/sub/chats/${chatRoomId}/messages`);
        }
      } catch (error) {
        console.error('[PatientChat] Failed to initialize chat:', error);
        alert('채팅 연결에 실패했습니다.');
        navigate('/');
      }
    };

    if (chatRoomId && accessToken) {
      initializeChat();
    }

    return () => {
      // 언마운트 시 구독 해제는 하지 않음 (의사와 함께 사용 중)
    };
  }, [chatRoomId, accessToken, navigate]);

  // 메시지 스크롤 자동 이동
  useEffect(() => {
    // 페이지 전체를 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 메시지 영역 내에서 맨 아래로 스크롤
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 진료 종료 후 해당 채팅방 구독 해제 및 완료 페이지로 이동
  useEffect(() => {
    if (isChatClosed) {
      // 해당 채팅방 구독만 해제 (WebSocket 연결은 유지)
      if (chatRoomId) {
        wsService.unsubscribe(`/sub/chats/${chatRoomId}/messages`);
      }

      const timer = setTimeout(() => {
        navigate('/patient-consultation-completed');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isChatClosed, navigate, chatRoomId]);

  // chatRoomId가 변경될 때 isMessageSentRef 초기화
  useEffect(() => {
    isMessageSentRef.current = false;
  }, [chatRoomId]);

  // 사전질문 답변을 기반으로 자동 메시지 전송 (WebSocket 연결 후)
  useEffect(() => {
    if (
      isMessageSentRef.current ||
      !chatRoomId ||
      !preQuestionAnswers.symptom ||
      !preQuestionAnswers.duration
    ) {
      return;
    }

    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    // WebSocket 연결을 폴링으로 대기
    const checkAndSendMessage = () => {
      if (wsService.isConnected()) {
        console.log('[PatientChat] WebSocket connected! Sending auto message...');

        isMessageSentRef.current = true;

        // 메시지 생성: "사전질문 : 오늘부터 아파요" 또는 "사전질문 : 오늘부터 기타 증상이 있어요" 형식
        let message = '';
        if (preQuestionAnswers.symptom === '기타') {
          message = `사전질문 : ${preQuestionAnswers.duration}부터 기타 증상이 있어요`;
        } else {
          message = `사전질문 : ${preQuestionAnswers.duration}부터 ${preQuestionAnswers.symptom}`;
        }

        console.log('[PatientChat] Preparing to send auto message:', message);

        // 메시지 전송
        try {
          wsService.sendChatMessage(chatRoomId, message);
          console.log('[PatientChat] Auto message sent successfully:', message);
          // 전송 후 사전질문 답변 초기화
          clearPreQuestionAnswers();
        } catch (error) {
          console.error('[PatientChat] Failed to send auto message:', error);
        }
      } else {
        console.log('[PatientChat] Waiting for WebSocket connection...');
        // 500ms 후 다시 확인
        pollTimer = setTimeout(checkAndSendMessage, 500);
      }
    };

    checkAndSendMessage();

    return () => {
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [chatRoomId, preQuestionAnswers, clearPreQuestionAnswers]);

  // 진료 종료 처리
  const handleEndConsultation = async () => {
    if (!chatRoomId) return;

    try {
      await closeChatRoom(chatRoomId);
      // UI 업데이트는 WebSocket 브로드캐스트로 처리됨
    } catch (error) {
      console.error('[PatientChat] Failed to close chat:', error);
      alert('진료 종료에 실패했습니다.');
    }
  };

  // 빠른 응답 버튼 메시지 전송
  const handleQuickReply = (message: string) => {
    if (chatRoomId) {
      wsService.sendChatMessage(chatRoomId, message);
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
    <div className="w-full h-screen flex flex-col bg-[#3A3F47]">
      {/* 헤더 */}
      <div className="bg-[#3A3F47] px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex flex-col gap-0">
          <div className="flex items-baseline gap-2">
            <h1
              style={{
                color: 'var(--Greyscale-White, #FFF)',
                fontFamily: 'Pretendard',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: '600',
                lineHeight: '150%',
                letterSpacing: '-0.32px',
                margin: 0,
              }}
            >
              {doctorName} 의사
            </h1>
            {appointmentTime && (
              <p
                style={{
                  color: 'var(--Greyscale-200, #E2E4E8)',
                  fontFamily: 'Pretendard',
                  fontSize: '14px',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  lineHeight: '150%',
                  letterSpacing: '-0.28px',
                  margin: 0,
                }}
              >
                {appointmentTime}
              </p>
            )}
          </div>
          <p className="text-[#B0B5BC] text-xs">
            {isChatClosed ? '진료 종료됨' : '진료 중'}
          </p>
        </div>
        <button
          onClick={handleEndConsultation}
          style={{
            color: 'var(--color-main-varient, #3D84FF)',
            textAlign: 'right',
            fontFamily: 'Pretendard',
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: '600',
            lineHeight: '150%',
            letterSpacing: '-0.32px',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          진료 종료
        </button>
      </div>

      {/* 메시지 영역 */}
      <div ref={messagesContainerRef} className="flex-[0.7] overflow-y-auto px-5 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#7A8090]">
              <p>의사와의 대화를 시작하세요.</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === userId}
            userRole="patient"
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="flex-[0.3] overflow-y-auto px-5 py-3 bg-[#3A3F47]">
        {/* 빠른 응답 버튼들 */}
        {!isChatClosed && (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-2" style={{ scrollBehavior: 'smooth' }}>
            {['네', '아니요', '잘 모르겠어요', '다시 한번 말씀해주세요'].map((text) => (
              <button
                key={text}
                onClick={() => handleQuickReply(text)}
                style={{
                  display: 'flex',
                  padding: '6px 12px',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '100px',
                  background: 'var(--color-main-varient, #3D84FF)',
                  color: 'var(--Greyscale-White, #FFF)',
                  fontFamily: 'Pretendard',
                  fontSize: '14px',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  lineHeight: '150%',
                  letterSpacing: '-0.28px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {text}
              </button>
            ))}
          </div>
        )}
        <ChatInput chatRoomId={chatRoomId} isEnabled={!isChatClosed} userRole="patient" />
      </div>
    </div>
  );
};

export default PatientChat;
