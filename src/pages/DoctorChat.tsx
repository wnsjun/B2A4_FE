import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../hooks/useChatStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { wsService } from '../services/websocketService';
import { closeChatRoom } from '../apis/chatApi';
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
    setChatRoom,
  } = useChatStore();
  const { accessToken } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // localStorage에서 값 읽기
  const localDoctorId = localStorage.getItem('doctorId');
  const userId = storeUserId || localDoctorId || 'doctor';

  // URL 파라미터로 전달된 chatRoomId 또는 store의 chatRoomId 또는 localStorage 사용
  const chatRoomId = paramChatRoomId || storeChatRoomId;

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
          // store에 채팅방 정보 설정 (필요시)
          if (!storeChatRoomId && accessToken) {
            setChatRoom(chatRoomId, 'doctor', accessToken);
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

  // 나가기 버튼 처리
  const handleExit = () => {
    if (isChatClosed) {
      if (chatRoomId) {
        wsService.unsubscribe(`/sub/chats/${chatRoomId}/messages`);
      }
      navigate('/');
    } else {
      alert('진료를 먼저 종료해주세요.');
    }
  };

  if (!chatRoomId) {
    return (
      <div className="w-full h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666B76]">채팅방 정보가 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-[#5B9EFF] text-white rounded-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-[#E8EAED] px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[#1A1A1A] font-semibold text-lg">
            {isChatClosed ? '진료 종료됨' : '진료 중'}
          </h1>
          <p className="text-[#999] text-sm">채팅방 ID: {chatRoomId}</p>
        </div>
        <button
          onClick={handleExit}
          className="px-4 py-2 text-[#666B76] hover:bg-[#F5F5F5] rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#999]">
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

      {/* 입력 영역 */}
      <ChatInput chatRoomId={chatRoomId} isEnabled={!isChatClosed} userRole="doctor" />

      {/* 진료 종료 버튼 */}
      {!isChatClosed && (
        <div className="bg-[#F5F5F5] border-t border-[#E8EAED] p-4">
          <button
            onClick={handleEndConsultation}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            진료 종료
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorChat;
