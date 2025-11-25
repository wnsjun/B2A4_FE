import './App.css';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './hooks/useAuthStore';
import { useChatStore } from './hooks/useChatStore';
import { wsService } from './services/websocketService';
import SplashPageWeb from './pages/Splash.tsx';
import Intro from './pages/Intro.tsx';
import LogIn from './pages/LogIn.tsx';
import SignUp from './pages/SignUp.tsx';
import SignUpHosp from './pages/SignUpHosp.tsx';
import Calendar from './pages/Calendar.tsx';
import AddSchedule from './pages/AddSchedule.tsx';
import EditSchedule from './pages/EditSchedule.tsx';
import Service from './pages/Service.tsx';
import Setting from './pages/Setting.tsx';
import Hospitalmap from './pages/Hospitalmap.tsx';
import SelectDoctor from './pages/SelectDoctor.tsx';
import FavoriteHospitals from './pages/FavoriteHospitals.tsx';
import QrCheckIn from './pages/QrCheckIn.tsx';
import PreQuestion1 from './pages/PreQuestion1.tsx';
import PreQuestion2 from './pages/PreQuestion2.tsx';
import PreQuestion3 from './pages/PreQuestion3.tsx';
import PatientChat from './pages/PatientChat.tsx';
import CamQR from './pages/CamQR.tsx';
import HospitalProfile from './pages/HospitalProfile.tsx';
import HospitalProfileEdit from './pages/HospitalProfileEdit.tsx';
import DoctorChat from './pages/DoctorChat.tsx';
import DoctorWaiting from './pages/DoctorWaiting.tsx';
import DoctorChatList from './pages/DoctorChatList.tsx';
import ConsultationCompleted from './pages/ConsultationCompleted.tsx';
import PatientConsultationCompleted from './pages/PatientConsultationCompleted.tsx';

function App() {
  const navigate = useNavigate();
  const { accessToken, doctorId, setDoctorId, setTokens } = useAuthStore();
  const { setChatRoom, setChatRoomInfo } = useChatStore();
  const [, setNotificationCount] = useState(0);

  // 앱 시작 시 localStorage에서 accessToken 로드 (처음 마운트할 때만)
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedDoctorId = localStorage.getItem('doctorId');

    if (storedAccessToken) {
      setTokens(storedAccessToken, storedRefreshToken || null);
      console.log('[App] AccessToken loaded from localStorage:', storedAccessToken.substring(0, 20) + '...');
    }

    if (storedDoctorId) {
      setDoctorId(storedDoctorId);
      console.log('[App] DoctorId loaded from localStorage:', storedDoctorId);
    }
  }, []);

  // 의사 전역 WebSocket 초기화
  useEffect(() => {
    const initializeDoctorWebSocket = async () => {
      if (!doctorId || !accessToken) return;

      try {
        // 이미 연결되어 있으면 스킵
        if (wsService.isConnected()) {
          return;
        }

        const wsUrl = import.meta.env.VITE_WS_URL;
        if (!wsUrl) {
          throw new Error('WebSocket URL not configured');
        }

        // WebSocket 연결
        await wsService.connectAsDoctor(
          {
            url: wsUrl,
            accessToken,
          },
          doctorId
        );

        // 새로운 채팅방 알림 수신
        wsService.subscribe(
          `/sub/doctors/${doctorId}`,
          (message: { body: string }) => {
            console.log('[App] 새로운 채팅방 알림:', message.body);
            try {
              const newRoom = JSON.parse(message.body);
              const chatRoomId = newRoom.chatRoomId || newRoom.id;
              if (chatRoomId) {
                // 알림 카운트 증가
                setNotificationCount((prev) => prev + 1);

                // 채팅 상태 저장
                setChatRoom(chatRoomId.toString(), 'doctor', String(doctorId));

                // 환자 정보 저장
                if (newRoom.patientName || newRoom.startedAt) {
                  setChatRoomInfo(newRoom.patientName, newRoom.doctorName, newRoom.startedAt);
                  // localStorage에도 저장 (새로고침 후 데이터 복구용)
                  localStorage.setItem('patientName', newRoom.patientName || '환자');
                }

                // 자동으로 채팅 페이지로 이동
                console.log('[App] 채팅 페이지로 이동:', `/doctor/chat/${chatRoomId}`);
                navigate(`/doctor/chat/${chatRoomId}`);

                // 브라우저 알림
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('새로운 환자', {
                    body: `${newRoom.patientName || '환자'}가 진료를 요청했습니다.`,
                    tag: `chat-${chatRoomId}`,
                  });
                }
              }
            } catch (error) {
              console.error('[App] 알림 파싱 실패:', error);
            }
          }
        );

        console.log('[App] 의사 WebSocket 초기화 완료');
      } catch (error) {
        console.error('[App] 의사 WebSocket 초기화 실패:', error);
      }
    };

    initializeDoctorWebSocket();
  }, [doctorId, accessToken]);

  return (
    <Routes>
      <Route path="/qr-checkin" element={<QrCheckIn />} />
      <Route path="/doctor/consultation-list" element={<DoctorChatList />} />
      <Route path="/doctor/waiting" element={<DoctorWaiting />} />
      <Route path="/doctor/chat/:chatRoomId" element={<DoctorChat />} />
      <Route path="/doctor/consultation-completed" element={<ConsultationCompleted />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signuphosp" element={<SignUpHosp />} />
      <Route path="/hospital-profile/:hospitalId" element={<HospitalProfile />} />
      <Route path="/hospital-profile-edit/:hospitalId" element={<HospitalProfileEdit />} />
      <Route
        path="*"
        element={
          <div style={{ width: '360px', height: '680px', margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<SplashPageWeb />} />
              <Route path="/logointro" element={<Intro />} />
              <Route path="/login" element={<LogIn />} />
              <Route path="/medical-records" element={<Calendar />} />
              <Route path="/add-schedule" element={<AddSchedule />} />
              <Route path="/edit-schedule" element={<EditSchedule />} />
              <Route path="/service" element={<Service />} />
              <Route path="/setting" element={<Setting />} />
              <Route path="/hospitalmap" element={<Hospitalmap />} />
              <Route path="/favorite-hospitals" element={<FavoriteHospitals />} />
              <Route path="/select-doctor" element={<SelectDoctor />} />
              <Route path='/camqr' element={<CamQR />} />
              <Route path="/pre-question1" element={<PreQuestion1 />} />
              <Route path="/pre-question2" element={<PreQuestion2 />} />
              <Route path="/pre-question3" element={<PreQuestion3 />} />
              <Route path="/patientchat" element={<PatientChat />} />
              <Route path="/patient-consultation-completed" element={<PatientConsultationCompleted />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
