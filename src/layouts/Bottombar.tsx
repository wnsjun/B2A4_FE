import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HospitalSearchIcon from '../assets/bottombar/hospitalsearch.svg';
import MedicalRecordsIcon from '../assets/bottombar/medicalrecords.svg';
import QRCodeIcon from '../assets/bottombar/qr.svg';
import CircleIcon from '../assets/bottombar/circle.svg';
import { bodySmallBold } from '../styles/typography';

type NavigationTab = 'map' | 'qr' | 'record';

export default function Bottombar() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('map');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Bottombar를 표시할 경로들
  const showBottombarPaths = ['/qr-code', '/medical-records', '/hospitalmap'];
  const shouldShow = showBottombarPaths.includes(pathname);

  if (!shouldShow) {
    return null;
  }

  const handleTabClick = (tab: NavigationTab) => {
    setActiveTab(tab);

    // 각 탭에 맞는 경로로 네비게이션
    switch (tab) {
      case 'map':
        navigate('/hospitalmap'); // 지도 경로를 여기에 입력
        break;
      case 'qr':
        navigate('/camqr'); // QR 코드 경로를 여기에 입력
        break;
      case 'record':
        navigate('/medical-records'); // 진료 기록 경로를 여기에 입력
        break;
    }
  };

  return (
    <nav className="relative w-full bg-white" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center justify-center h-[95px] max-w-full" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Map Tab */}
        <button
          onClick={() => handleTabClick('map')}
          className="flex-1 flex flex-col items-center just
          ify-center py-4 px-4 transition-all duration-200 cursor-pointer"
          style={{ gap: '4px', backgroundColor: '#FFFFFF', border: 'none' }}
          aria-label="병원 찾기"
        >
          <img
            src={HospitalSearchIcon}
            alt="병원 찾기"
            className={`w-6 h-6 transition-all duration-200 ${
              activeTab === 'map'
                ? 'brightness-100'
                : 'brightness-75 opacity-50'
            }`}
            style={{
              filter: activeTab === 'map'
                ? 'brightness(1) grayscale(0%)'
                : 'brightness(0.7) grayscale(100%)'
            }}
          />
          <span
            style={{
              ...bodySmallBold,
              color: activeTab === 'map' ? '#1A1A1A' : '#A9ACB2',
              transition: 'color 200ms'
            }}
          >
            병원 찾기
          </span>
        </button>

        {/* QR Code Button - Center */}
        <button
          onClick={() => handleTabClick('qr')}
          className="flex flex-col items-center justify-center mb-8 transition-all duration-200 cursor-pointer relative"
          aria-label="진료 QR"
          style={{ width: '116px', height: '116px', backgroundColor: 'transparent', border: 'none',zIndex: 20 }}
        >
          <div
            style={{
              width: '116px',
              height: '116px',
              borderRadius: '50%',
              backgroundColor: '#FFF',
              filter: 'drop-shadow(0 -16px 20px rgba(0, 0, 0, 0.03))',
              position: 'absolute',
              zIndex: 0,
              border: '3px solid #FFF'
            }}
          />
          <img
            src={CircleIcon}
            alt="circle"
            style={{
              position: 'absolute',
              zIndex: 1
            }}
          />
          <img
            src={QRCodeIcon}
            alt="진료 QR"
            className="w-8 h-8"
            style={{ position: 'relative', zIndex: 10, marginBottom: '4px' }}
          />
          <span style={{ ...bodySmallBold, color: '#FFFFFF', fontSize: '11px', position: 'relative', zIndex: 10 }}>진료 QR</span>
        </button>

        {/* Medical Record Tab */}
        <button
          onClick={() => handleTabClick('record')}
          className="flex-1 flex flex-col items-center justify-center py-4 px-4 transition-all duration-200 cursor-pointer"
          style={{ gap: '4px', backgroundColor: '#FFFFFF', border: 'none' }}
          aria-label="진료 기록"
        >
          <img
            src={MedicalRecordsIcon}
            alt="진료 기록"
            className={`w-6 h-6 transition-all duration-200 ${
              activeTab === 'record'
                ? 'brightness-100'
                : 'brightness-75 opacity-50'
            }`}
            style={{
              filter: activeTab === 'record'
                ? 'brightness(1) grayscale(0%)'
                : 'brightness(0.7) grayscale(100%)'
            }}
          />
          <span
            style={{
              ...bodySmallBold,
              color: activeTab === 'record' ? '#1A1A1A' : '#A9ACB2',
              transition: 'color 200ms'
            }}
          >
            진료 기록
          </span>
        </button>
      </div>
    </nav>
  );
}