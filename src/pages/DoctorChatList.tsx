import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebTopbar from '../layouts/WebTopbar';
import { getDoctorChatRooms, type DoctorChatRoom } from '../apis/chatApi';
import { useAuthStore } from '../hooks/useAuthStore';

const DoctorChatList = () => {
  const navigate = useNavigate();
  const { doctorId } = useAuthStore();
  const [chatRooms, setChatRooms] = useState<DoctorChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        setIsLoading(true);
        if (!doctorId) {
          setError('의사 정보가 없습니다');
          return;
        }

        const response = await getDoctorChatRooms(String(doctorId));
        if (response.success) {
          setChatRooms(response.data);
        } else {
          setError('채팅방 목록을 불러올 수 없습니다');
        }
      } catch (err) {
        console.error('채팅방 목록 조회 실패:', err);
        setError('채팅방 목록을 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatRooms();
  }, [doctorId]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return '진료대기';
      case 'active':
        return '진료중';
      case 'closed':
        return '진료완료';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return '#FF9500';
      case 'active':
        return '#3D84FF';
      case 'closed':
        return '#7A8090';
      default:
        return '#7A8090';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${month}월 ${day}일 ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center h-screen bg-white">
        <WebTopbar showDoctorReselect={true} showConsultationList={true} />
        <div className="flex-1 flex items-center justify-center">
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
      <WebTopbar showDoctorReselect={true} showConsultationList={true} />

      <div className="w-full max-w-[360px] pt-20 px-5 pb-10">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">진료목록</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {chatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[#7A8090]">진료 이력이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatRooms.map((room) => (
              <div
                key={room.chatRoomId}
                onClick={() => navigate(`/doctor/chat/${room.chatRoomId}`)}
                className="bg-white border border-[#E2E4E8] rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-[#1a1a1a]">
                        {room.patientName}
                      </h3>
                      <span
                        style={{
                          backgroundColor: getStatusColor(room.status),
                          color: '#FFF',
                        }}
                        className="text-xs font-medium px-2 py-1 rounded-full"
                      >
                        {getStatusLabel(room.status)}
                      </span>
                    </div>
                    <p className="text-sm text-[#7A8090]">
                      종료: {formatDate(room.finishedAt)}
                    </p>
                  </div>
                  <div className="text-[#3D84FF] text-lg">
                    {'→'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChatList;
