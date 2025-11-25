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
    <div className="relative w-full h-screen bg-white flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* 배경 이미지 */}
      <img
        src="/consultation.svg"
        alt="배경"
        className="absolute right-0 top-0 h-full object-cover opacity-80"
        style={{ width: 'auto' }}
      />

      {/* 텍스트 콘텐츠 */}
      <div className="text-center mb-12 relative z-10">
        {/* 메인 텍스트 */}
        <h1
          style={{
            color: '#1A1A1A',
            textAlign: 'center',
            fontFamily: 'Pretendard',
            fontSize: '32px',
            fontWeight: '600',
            lineHeight: '150%',
            letterSpacing: '-0.64px',
            marginBottom: '16px',
          }}
        >
          손빛으로 이어진 진료가 끝났어요
        </h1>

        {/* 서브 텍스트 */}
        <p
          style={{
            color: '#666B76',
            textAlign: 'center',
            fontFamily: 'Pretendard',
            fontSize: '24px',
            fontWeight: '600',
            lineHeight: '150%',
            letterSpacing: '-0.48px',
          }}
        >
          당신의 진료로 환자에게 따뜻한 손빛이 닿았어요.<br />
          진료 기록은 환자 모바일로 전송되었어요.
        </p>
      </div>

      {/* 확인 버튼 */}
      <button
        onClick={handleConfirm}
        style={{
          display: 'flex',
          width: '400px',
          height: '56px',
          padding: '12px 0',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
          borderRadius: '12px',
          background: '#3D84FF',
          border: 'none',
          cursor: 'pointer',
          marginTop: '100px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: 'white',
            fontFamily: 'Pretendard',
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '150%',
            letterSpacing: '-0.32px',
          }}
        >
          확인
        </span>
      </button>
    </div>
  );
};

export default ConsultationCompleted;
