import Logo from '../components/TypoLogo';
import logoutImg from '../assets/webTopbar/logout.svg';
import doctorReselectImg from '../assets/webTopbar/doctor-reselect.svg';
import { useNavigate } from 'react-router-dom';
import { logoutHospitalApi } from '../apis/auth';
import { useAuthStore } from '../hooks/useAuthStore';

interface Props {
  text?: string;
  text_img?: string;
  showDoctorReselect?: boolean;
  onDoctorReselectClick?: () => void;
}

const WebTopbar = ({ text, text_img, showDoctorReselect, onDoctorReselectClick }: Props) => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

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

  return (
    <div className="fixed top-0 w-full py-8 px-32">
      <div className="flex flex-row justify-between w-full">
        <div>
          <Logo />
        </div>

        <div className="flex flex-row justify-center items-center gap-8 font-semibold text-[14px]">
          {(text || text_img) && (
            <div className="flex flex-row gap-2 items-center">
              <p className="text-[#343841]">{text}</p>
              <img src={text_img} alt="" className="w-6 h-6" />
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
