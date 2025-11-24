import React, { useRef, useEffect, useState } from 'react';
import HospitalDetailContent from './HospitalDetailContent';
import './HospitalDetailBottomSheet.css';

interface HospitalDetailBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: {
    image: string;
    name: string;
    department: string;
    address: string;
    hours: {
      day: string;
      startTime: string;
      endTime: string;
    };
    phone: string;
    isFavorite?: boolean;
    operatingHours?: Array<{
      dayOfWeek: string;
      openTime?: string;
      closeTime?: string;
      breakStartTime?: string;
      breakEndTime?: string;
      isClosed: boolean;
    }>;
  };
  onFavoriteToggle?: () => void;
}

const HospitalDetailBottomSheet: React.FC<HospitalDetailBottomSheetProps> = ({
  isOpen,
  onClose,
  hospital,
  onFavoriteToggle,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  // 드래그 이동
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const diff = e.clientY - startY;
      if (diff > 0) {
        // 아래로만 드래그 가능
        setTranslateY(diff);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // 150px 이상 드래그하면 닫기
      if (translateY > 150) {
        onClose();
      }
      setTranslateY(0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startY, translateY, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 백그라운드 오버레이 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 bg-white rounded-t-4xl shadow-lg z-50"
        style={{
          left: '50%',
          marginLeft: '-180px',
          width: '360px',
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          animation: isOpen ? 'slideUp 0.3s ease-out' : 'slideDown 0.3s ease-out',
        }}
      >
        <div>
        {/* 드래그 핸들 */}
        <div
          className="flex justify-center pt-2 pb-4 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="bg-[#E2E4E8] h-1 rounded-full w-12" />
        </div>

        {/* 내용 */}
        <div className="px-5 pb-8 w-full">
          <HospitalDetailContent
            image={hospital.image}
            name={hospital.name}
            department={hospital.department}
            address={hospital.address}
            hours={hospital.hours}
            phone={hospital.phone}
            isFavorite={hospital.isFavorite}
            onFavoriteToggle={onFavoriteToggle}
            operatingHours={hospital.operatingHours}
          />
        </div>
        </div>
      </div>
    </>
  );
};

export default HospitalDetailBottomSheet;
