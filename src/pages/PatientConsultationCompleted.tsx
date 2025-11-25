import { useNavigate } from 'react-router-dom';

const PatientConsultationCompleted = () => {
  const navigate = useNavigate();

  // 확인 버튼 클릭
  const handleConfirm = () => {
    navigate('/hospitalmap');
  };

  return (
    <div style={{ width: '360px', height: '740px', margin: '0 auto' }} className="flex flex-col items-center justify-center bg-white">
      {/* 손빛 이미지 */}
      <div className="mb-8">
        <img src="/sonbit.svg" alt="손빛" className="w-20 h-20 mx-auto" />
        {/* 빛 효과를 위한 radial gradient 원형 */}
        <div className="relative w-32 h-32 -mt-16 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-200 to-transparent opacity-40 rounded-full blur-2xl animate-pulse"></div>
        </div>
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className="text-center">
        {/* 메인 텍스트 */}
        <h1
          style={{
            color: '#1A1A1A',
            fontFamily: 'Pretendard',
            fontSize: '20px',
            fontWeight: '600',
            lineHeight: '150%',
            letterSpacing: '-0.4px',
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
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '150%',
            letterSpacing: '-0.32px',
          }}
        >
          진료 기록은 모바일로 전송할게요
        </p>
      </div>

      {/* 확인 버튼 */}
      <button
        onClick={handleConfirm}
        style={{
          width: '320px',
          height: '56px',
          padding: '12px 0',
          borderRadius: '12px',
          background: '#3D84FF',
          marginTop: '150px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
          border: 'none',
          cursor: 'pointer',
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

export default PatientConsultationCompleted;
