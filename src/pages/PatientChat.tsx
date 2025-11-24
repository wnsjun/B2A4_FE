import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../hooks/useChatStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { wsService } from '../services/websocketService';
import ChatMessage from '../components/Chat/ChatMessage';
import ChatInput from '../components/Chat/ChatInput';

const PatientChat = () => {
  const navigate = useNavigate();
  const {
    chatRoomId: storeChatRoomId,
    messages,
    isChatClosed,
    userId: storeUserId,
    clearChatRoom,
    setChatRoom,
    preQuestionAnswers,
    clearPreQuestionAnswers,
  } = useChatStore();
  const { accessToken } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const isMessageSentRef = useRef(false);

  // localStorage에서 값 읽기
  const localChatRoomId = localStorage.getItem('chatRoomId');
  const localUserId = localStorage.getItem('userId');
  const chatRoomId = storeChatRoomId || localChatRoomId;
  const userId = storeUserId || localUserId;
  const doctorName = localStorage.getItem('doctorName') || '의사';

  // 로컬스토리지 값을 store에 저장
  useEffect(() => {
    if (localChatRoomId && !storeChatRoomId) {
      setChatRoom(localChatRoomId, 'patient', localUserId || 'patient');
    }
  }, [localChatRoomId, storeChatRoomId, localUserId, setChatRoom]);

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
          await wsService.connectAsPatient({
            url: wsUrl,
            accessToken,
          });
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 진료 종료 후 3초 뒤 완료 페이지로 이동
  useEffect(() => {
    if (isChatClosed) {
      const timer = setTimeout(() => {
        navigate('/patient-consultation-completed');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isChatClosed, navigate]);

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

    console.log('[PatientChat] Auto message check:', {
      isMessageSent: isMessageSentRef.current,
      chatRoomId,
      symptom: preQuestionAnswers.symptom,
      duration: preQuestionAnswers.duration,
      isConnected: wsService.isConnected(),
    });

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

        // 약간의 딜레이 후 메시지 전송
        const timer = setTimeout(() => {
          try {
            wsService.sendChatMessage(chatRoomId, message);
            console.log('[PatientChat] Auto message sent successfully:', message);
            // 전송 후 사전질문 답변 초기화
            clearPreQuestionAnswers();
          } catch (error) {
            console.error('[PatientChat] Failed to send auto message:', error);
          }
        }, 300);

        return () => clearTimeout(timer);
      } else {
        console.log('[PatientChat] Waiting for WebSocket connection...');
        // 500ms 후 다시 확인
        const pollTimer = setTimeout(checkAndSendMessage, 500);
        return () => clearTimeout(pollTimer);
      }
    };

    return checkAndSendMessage();
  }, [chatRoomId, preQuestionAnswers, clearPreQuestionAnswers]);

  // 나가기 버튼 처리
  const handleExit = () => {
    if (isChatClosed) {
      // 구독 해제 및 세션 종료
      if (chatRoomId) {
        wsService.unsubscribe(`/sub/chats/${chatRoomId}/messages`);
      }
      clearChatRoom();
      navigate('/');
    } else {
      alert('진료를 먼저 종료해주세요.');
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
      <div className="bg-[#3A3F47] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-baseline gap-2">
          <h1
            style={{
              color: '#FFF',
              fontFamily: 'Inter',
              fontSize: '20px',
              fontWeight: '600',
              lineHeight: '150%',
              letterSpacing: '-0.4px',
            }}
          >
            {doctorName}
          </h1>
          <p className="text-[#B0B5BC] text-xs">
            {isChatClosed ? '진료 종료됨' : '진료 중'}
          </p>
        </div>
        <button
          onClick={handleExit}
          className="text-[#B0B5BC] hover:text-white transition-colors text-lg font-medium flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
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
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#3A3F47]">
        <ChatInput chatRoomId={chatRoomId} isEnabled={!isChatClosed} userRole="patient" />
      </div>
    </div>
  );
};

export default PatientChat;
