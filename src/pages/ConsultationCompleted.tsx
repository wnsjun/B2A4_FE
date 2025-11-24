import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';

const ConsultationCompleted = () => {
  const navigate = useNavigate();
  const { doctorId, accessToken } = useAuthStore();

  useEffect(() => {
    // 의사 인증 확인
    if (!doctorId || !accessToken) {
      navigate('/login');
    }
  }, [doctorId, accessToken, navigate]);


  // 확인 버튼 클릭
  const handleConfirm = () => {
    navigate('/qr-checkin');
  };

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* 손빛 이미지 */}
      <div className="mb-8">
        <div className="text-7xl">✋</div>
        {/* 빛 효과를 위한 radial gradient 원형 */}
        <div className="relative w-32 h-32 -mt-16 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-200 to-transparent opacity-40 rounded-full blur-2xl animate-pulse"></div>
        </div>
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className="text-center mb-12">
        {/* 메인 텍스트 */}
        <h1
          style={{
            color: '#1A1A1A',
            fontFamily: 'Inter',
            fontSize: '32px',
            fontWeight: '600',
            lineHeight: '150%',
            letterSpacing: '-0.64px',
            marginBottom: '16px',
          }}
        >
          이어진 진료가 끝났어요
        </h1>

        {/* 서브 텍스트 */}
        <p
          style={{
            color: '#666B76',
            fontFamily: 'Inter',
            fontSize: '24px',
            fontWeight: '600',
            lineHeight: '150%',
            letterSpacing: '-0.48px',
          }}
        >
          진료 기록은 모바일로 전송할게요
        </p>
      </div>

      {/* 확인 버튼 */}
      <button
        onClick={handleConfirm}
        style={{
          background: 'linear-gradient(207deg, #0C58FF 13.18%, #3FB6FF 91.66%)',
        }}
        className="w-[244px] h-[88px] text-white rounded-[12px] font-medium hover:shadow-lg transition-shadow flex items-center justify-center"
      >
        <span
          className="text-[32px] font-[600] leading-[150%] tracking-[-0.64px]"
          style={{ fontFamily: 'Inter' }}
        >
          확인
        </span>
      </button>
    </div>
  );
};

export default ConsultationCompleted;
