import Topbar from '../layouts/Topbar';
import { topHeader } from '../styles/typography';
import ToggleSwitch from '../components/ToggleSwitch';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { logoutPatientApi } from '../apis/auth';
import { useAuthStore } from '../hooks/useAuthStore';
import { getLocationPermissionApi, updateLocationPermissionApi } from '../apis/auth';

const Setting = () => {
  const nav = useNavigate();
  const [isOn, setIsOn] = useState(true);
  const [isLogOut, setIsLogOut] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const { clearAuth } = useAuthStore();

  useEffect(() => {
    const fetchPermission = async () => {
      try {
        const status = await getLocationPermissionApi();
        setIsOn(status);
      } catch (error) {
        console.error('위치 권한 상태 불러오기 실패:', error);
      }
    };
    fetchPermission();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.checked;
    if (isChanging) return;

    setIsChanging(true);
    try {
      await updateLocationPermissionApi(newStatus);
      setIsOn(newStatus);
      alert(`위치 정보 권한이 ${newStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('위치 권한 변경 실패:', error);
      alert('위치 권한 변경 요청 중 에러가 발생했습니다. 콘솔을 확인하세요.');
    } finally {
      setIsChanging(false); // 로딩 종료
    }
  };
  const handleClickLogOut = () => {
    setIsLogOut(true);
  };

  const handleCloseModal = () => {
    setIsLogOut(false);
  };

  const handleLogout = async () => {
    try {
      console.log('🚀 로그아웃 요청 시작!');

      // 1. API 호출 (여기서 에러나면 바로 catch로 점프!)
      await logoutPatientApi();

      console.log('✅ 서버 로그아웃 성공!');

      // 2. 성공했을 때만 실행되는 뒷정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearAuth(); // 스토어 초기화

      alert('로그아웃 되었습니다.');
      nav('/login'); // 로그인 페이지로 이동
    } catch (error) {
      // 3. 실패하면 여기서 멈춤! (화면 이동 안 함)
      console.error('🚨 로그아웃 실패! (여기서 멈춤)');
      console.error('에러 내용:', error);
      alert('로그아웃 요청 중 에러가 발생했습니다. 콘솔을 확인하세요.');
    }
  };

  return (
    <div>
      <Topbar title="설정" type="header" />
      {/* body */}
      <div style={topHeader}>
        <div className="flex flex-row justify-between py-[16px] px-[20px]">
          <div className="">위치 정보 권한</div>
          <ToggleSwitch id="location" checked={isOn} onChange={handleChange} />
        </div>
        <div className="py-[16px] px-[20px] hover:bg-gray-200" onClick={() => nav('/service')}>
          서비스 안내
        </div>
        <div className="py-[16px] px-[20px]" onClick={handleClickLogOut}>
          로그아웃
        </div>
      </div>
      <Modal
        isOpen={isLogOut}
        title="로그아웃"
        description={`지금 계정을 로그아웃할까요?\n다음에 다시 로그인할 수 있어요.`}
        confirmButtonText="확인"
        cancelButtonText="취소"
        onCancel={handleCloseModal}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default Setting;
