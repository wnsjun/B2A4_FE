import Logo from '../components/TypoLogo';
import logoutImg from '../assets/webTopbar/logout.svg';
import doctorReselectImg from '../assets/webTopbar/doctor-reselect.svg';
import { useNavigate } from 'react-router-dom';
import { logoutHospitalApi } from '../apis/auth';
import { useAuthStore } from '../hooks/useAuthStore';
import { useState, useEffect } from 'react';

interface Props {
  text?: string;
  text_img?: string;
  showDoctorReselect?: boolean;
  onDoctorReselectClick?: () => void;
}

const WebTopbar = ({ text, text_img, showDoctorReselect, onDoctorReselectClick }: Props) => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [hospitalName, setHospitalName] = useState('');

  // 1. 컴포넌트 마운트 시 저장된 이름 불러오기
  useEffect(() => {
    const name = localStorage.getItem('hospitalName');
    if (name) {
      setHospitalName(name);
    }
  }, []);

  const handleDoctorReselectClick = () => {
    if (onDoctorReselectClick) {
      onDoctorReselectClick();
    }
    navigate('/select-doctor');
  };

  const handleClickLogOut = async () => {
    try {
      console.log('🚀 로그아웃 요청 시작!');

      // 1. API 호출 (여기서 에러나면 바로 catch로 점프!)
      await logoutHospitalApi();

      console.log('✅ 서버 로그아웃 성공!');

      // 2. 성공했을 때만 실행되는 뒷정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearAuth(); // 스토어 초기화

      alert('로그아웃 되었습니다.');
      navigate('/login'); // 로그인 페이지로 이동
    } catch (error) {
      // 3. 실패하면 여기서 멈춤! (화면 이동 안 함)
      console.error('🚨 로그아웃 실패! (여기서 멈춤)');
      console.error('에러 내용:', error);
      alert('로그아웃 요청 중 에러가 발생했습니다. 콘솔을 확인하세요.');
    }
  };

  const handleProfileClick = () => {
    // 저장된 ID 가져오기
    const hospitalId = localStorage.getItem('hospitalId');

    if (hospitalId) {
      // ⚠️ [경로 확인!] 병원 상세 페이지 주소로 이동 (예: /hospital/123)
      navigate(`/hospital-profile/${hospitalId}`);
    } else {
      // ID가 없을 경우 로그인 페이지로 튕겨냄
      alert('병원 정보가 유효하지 않습니다. 다시 로그인해주세요.');
      //   navigate('/login');
    }
  };

  return (
    <div className="fixed top-0 w-full py-8 px-32">
      <div className="flex flex-row justify-between w-full">
        <div>
          <Logo />
        </div>

        <div className="flex flex-row justify-center items-center gap-8 font-semibold text-[14px]">
          {(text || text_img) && (
            <div className="flex flex-row gap-2 items-center">
              <p className="text-[#343841]">{hospitalName}</p>
              <img
                src={text_img}
                alt=""
                className="w-6 h-6 hover:cursor-pointer"
                onClick={handleProfileClick}
              />
            </div>
          )}

          {showDoctorReselect && (
            <div
              className="flex flex-row gap-2 items-center cursor-pointer"
              onClick={handleDoctorReselectClick}
            >
              <p className="text-[#343841]">의사 재선택</p>
              <img src={doctorReselectImg} alt="doctor-reselect" className="w-6 h-6" />
            </div>
          )}

          <div
            className="flex flex-row gap-2 items-center"
            style={{ marginRight: showDoctorReselect ? '36px' : '0' }}
          >
            <p className="text-[#666B76]">로그아웃</p>
            <img
              src={logoutImg}
              alt="logout"
              className="w-6 h-6 hover:cursor-pointer"
              onClick={handleClickLogOut}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebTopbar;
