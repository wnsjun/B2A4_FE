import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../hooks/useChatStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { wsService } from '../services/websocketService';
import { logoutHospitalApi } from '../apis/auth';

interface ActiveChatRoom {
  chatRoomId: string;
  patientName?: string;
  status: 'active' | 'closed';
  createdAt: string;
}

const DoctorWaiting = () => {
  const navigate = useNavigate();
  const { setChatRoom } = useChatStore();
  const { accessToken, doctorId } = useAuthStore();
  const [activeChatRooms, setActiveChatRooms] = useState<ActiveChatRoom[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  // 새로운 채팅방 알림 수신 (App.tsx에서 전역으로 초기화되었으므로, 여기서는 상태만 업데이트)
  useEffect(() => {
    if (!doctorId || !accessToken) return;
    if (isInitialized) return;

    setIsInitialized(true);
    setIsConnecting(true);

    // 채팅방 구독 콜백 등록
    const topic = `/sub/doctors/${doctorId}`;
    wsService.subscribe(
      topic,
      (message: { body: string }) => {
        console.log('[DoctorWaiting] 새로운 채팅방 알림 수신:', message.body);
        try {
          const newRoom = JSON.parse(message.body);
          console.log('[DoctorWaiting] 파싱된 newRoom:', newRoom);
          if (newRoom.id) {
            const room: ActiveChatRoom = {
              chatRoomId: newRoom.id,
              patientName: newRoom.patientName || '환자',
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            console.log('[DoctorWaiting] 채팅방 추가:', room);
            setActiveChatRooms((prev) => [...prev, room]);
          }
        } catch (error) {
          console.error('[DoctorWaiting] 파싱 실패:', error);
        }
      }
    );

    setIsConnecting(false);
    console.log('[DoctorWaiting] 채팅방 구독 완료');

    return () => {
      wsService.unsubscribe(topic);
    };
  }, [accessToken, doctorId, isInitialized]);

  // 채팅방 입장
  const handleEnterChatRoom = (chatRoomId: string) => {
    setChatRoom(chatRoomId, 'doctor', accessToken || '');
    navigate(`/doctor/chat/${chatRoomId}`);
  };

  // 의사 재선택
  const handleSelectDoctor = () => {
    // WebSocket 연결 해제
    wsService.disconnect();

    // 상태 초기화
    localStorage.removeItem('doctorId');

    // 의사 선택 페이지로 이동
    navigate('/select-doctor');
  };

  // 의사 로그아웃
  const handleLogout = async () => {
    try {
      // WebSocket 연결 해제
      wsService.disconnect();

      // 로그아웃 API 호출
      await logoutHospitalApi();

      // 상태 초기화
      localStorage.removeItem('doctorId');

      // 로그인 페이지로 이동
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };


  return (
    <div className="w-full min-h-screen bg-[#F5F5F5]">
      {/* 헤더 */}
      <div className="bg-white border-b border-[#E8EAED] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-[#1A1A1A] font-semibold text-xl">진료 대기</h1>
          <p className="text-[#999] text-sm">의사 진료실</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChatList(!showChatList)}
            className="px-4 py-2 text-sm text-[#666B76] bg-[#F5F5F5] hover:bg-[#E8EAED] rounded-lg transition-colors font-medium"
          >
            진료목록
          </button>
          <button
            onClick={handleSelectDoctor}
            className="px-4 py-2 text-sm text-[#666B76] bg-[#F5F5F5] hover:bg-[#E8EAED] rounded-lg transition-colors font-medium"
          >
            의사 재선택
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-[#666B76] bg-[#F5F5F5] hover:bg-[#E8EAED] rounded-lg transition-colors font-medium"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-6">
        {showChatList && (
          <>
            {isConnecting && (
              <div className="text-center py-8">
                <p className="text-[#666B76]">연결 중...</p>
              </div>
            )}

            {!isConnecting && activeChatRooms.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4">🏥</div>
              <p className="text-[#1A1A1A] font-semibold text-lg mb-2">
                대기 중인 환자가 없습니다
              </p>
              <p className="text-[#666B76]">
                환자가 QR 코드를 스캔하면 여기에 표시됩니다
              </p>
            </div>
          </div>
        )}

        {!isConnecting && activeChatRooms.length > 0 && (
          <div className="grid gap-4">
            {activeChatRooms.map((room) => (
              <div
                key={room.chatRoomId}
                className="bg-white rounded-lg border border-[#E8EAED] p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEnterChatRoom(room.chatRoomId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-[#1A1A1A] font-semibold text-lg">
                      {room.patientName}
                    </h3>
                    <p className="text-[#999] text-sm mt-1">
                      채팅방 ID: {room.chatRoomId}
                    </p>
                    <p className="text-[#999] text-xs mt-1">
                      {new Date(room.createdAt).toLocaleTimeString('ko-KR')}
                    </p>
                  </div>
                  <div className="ml-4">
                    {room.status === 'active' && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        진료 중
                      </span>
                    )}
                    {room.status === 'closed' && (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        종료됨
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}

        {!showChatList && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-[#1A1A1A] font-semibold text-lg mb-2">
                진료목록을 보려면 위의 진료목록 버튼을 클릭하세요
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorWaiting;
