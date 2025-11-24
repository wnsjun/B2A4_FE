import React, { useState } from 'react';
import LocationIcon from '../../assets/hospitalmap/location.svg';
import PhoneCallIcon from '../../assets/hospitalmap/phonecall.svg';
import TimeIcon from '../../assets/hospitalmap/time.svg';
import StarOffIcon from '../../assets/hospitalmap/star-off.svg';
import StarOnIcon from '../../assets/hospitalmap/star-on.svg';
import { processOperatingTimeForDisplay } from '../../utils/timeConvertor';

interface HospitalFavoriteContentProps {
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
  onFavoriteToggle?: () => void;
  operatingHours?: Array<{
    dayOfWeek: string;
    openTime?: string;
    closeTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    isClosed: boolean;
  }>;
}

const HospitalFavoriteContent: React.FC<HospitalFavoriteContentProps> = ({
  image,
  name,
  department,
  address,
  hours,
  phone,
  isFavorite = false,
  onFavoriteToggle,
  operatingHours,
}) => {
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  // operatingHours가 있으면 변환, 없으면 기본 hours 사용
  const processedOperatingHours = operatingHours
    ? processOperatingTimeForDisplay(operatingHours)
    : null;
  const defaultTime = processedOperatingHours ? processedOperatingHours[0] : null;

  return (
    <div className="border-b border-[#f4f6f8] pb-4 px-5 pt-4">
      {/* 기본 정보 */}
      <div className="flex gap-4 items-start">
        {/* 병원 이미지 */}
        <div className="shrink-0 rounded-full overflow-hidden" style={{ width: '93px', height: '93px' }}>
          <img
            alt={name}
            className="w-full h-full object-cover"
            src={image}
          />
        </div>

        {/* 병원 정보 */}
        <div className="flex flex-col gap-2 flex-1">
          {/* 헤더 */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-end gap-2">
              <h3 className="text-[#1a1a1a] text-base font-semibold">
                {name}
              </h3>
              <p className="text-[#343841] text-xs font-medium">
                {department}
              </p>
            </div>
            {/* 즐겨찾기 */}
            <button
              onClick={onFavoriteToggle}
              className="shrink-0 cursor-pointer transition-transform hover:scale-110"
              aria-label="Toggle favorite"
            >
              <img
                src={isFavorite ? StarOnIcon : StarOffIcon}
                alt="favorite"
                className="w-6 h-6"
              />
            </button>
          </div>

          {/* 상세 정보 */}
          <div className="flex flex-col gap-2">
            {/* Location */}
            <div className="flex gap-2 items-start">
              <img
                src={LocationIcon}
                alt="location"
                className="w-4 h-4 shrink-0 mt-0.5"
              />
              <p className="text-[#343841] text-xs font-medium">
                {address}
              </p>
            </div>

            {/* Time - operatingHours가 있으면 토글형, 없으면 단순형 */}
            {processedOperatingHours && defaultTime ? (
              <div className="flex flex-col gap-2">
                <div
                  className="flex gap-2 items-center justify-between cursor-pointer"
                  onClick={() => setIsTimeOpen(!isTimeOpen)}
                >
                  <div className="flex gap-2 items-center">
                    <img
                      src={TimeIcon}
                      alt="time"
                      className="w-4 h-4 shrink-0"
                    />
                    <p className="text-[#343841] text-xs font-medium">
                      {defaultTime.day} {defaultTime.hours}
                    </p>
                  </div>
                  <img
                    src="/dropdown.svg"
                    alt="toggle"
                    className={`w-3 h-3 transition-transform duration-300 ${
                      isTimeOpen ? 'rotate-0' : 'rotate-180'
                    }`}
                  />
                </div>
                {isTimeOpen && (
                  <div className="flex flex-col gap-1 pl-6 pt-1 border-t border-gray-200">
                    {processedOperatingHours.map((item, index) => (
                      <div key={index} className="flex flex-col gap-0.5">
                        <div className="flex gap-2 text-xs">
                          <span className="font-medium text-[#343841]">{item.day}</span>
                          <span className="text-[#343841]">{item.hours}</span>
                        </div>
                        {item.break && (
                          <div className="text-xs text-gray-500 ml-1">{item.break}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <img
                  src={TimeIcon}
                  alt="time"
                  className="w-4 h-4 shrink-0"
                />
                <p className="text-[#343841] text-xs font-medium">
                  {hours.day} {hours.startTime} - {hours.endTime}
                </p>
              </div>
            )}

            {/* Phone */}
            <div className="flex gap-2 items-center">
              <img
                src={PhoneCallIcon}
                alt="phone"
                className="w-4 h-4 shrink-0"
              />
              <p className="text-[#343841] text-xs font-medium opacity-80">
                {phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalFavoriteContent;
