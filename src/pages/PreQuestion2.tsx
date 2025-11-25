import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../hooks/useChatStore';
import Topbar from '../layouts/Topbar';
import img21 from '../assets/prequestion/2-1.GIF';
import img22 from '../assets/prequestion/2-2.GIF';
import img23 from '../assets/prequestion/2-3.GIF';

const PreQuestion2 = () => {
  const navigate = useNavigate();
  const { setPreQuestion2 } = useChatStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const options = [
    { text: '오늘', gif: img21 },
    { text: '며칠 전', gif: img22 },
    { text: '오래 전', gif: img23 },
  ];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? options.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === options.length - 1 ? 0 : prev + 1));
  };

  const handleOptionClick = (duration: string) => {
    setPreQuestion2(duration);
    navigate('/pre-question3');
  };

  const currentOption = options[currentIndex];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Topbar type="header" title="사전 응답" />
      <div className="pt-[80px] px-5">
        <h1 className="text-center text-[32px] font-semibold leading-[150%] tracking-[-0.64px] text-[#1A1A1A]">
          언제부터 불편하셨나요?
        </h1>
        <p className="mt-2 text-center text-[24px] font-semibold leading-[150%] tracking-[-0.48px] text-[#666B76]">
          수어 이미지를 보고 골라주세요
        </p>

        <div className="mt-[15px] flex flex-col items-center">
          {/* 캐러셀 컨테이너 */}
          <div className="flex items-center gap-8">
            {/* 이전 버튼 */}
            <button
              onClick={handlePrevious}
              className="flex items-center justify-center cursor-pointer transition-colors"
              aria-label="이전"
            >
              <span className="text-4xl text-[#666B76] hover:text-[#1A1A1A]">&lt;</span>
            </button>

            {/* 이미지 표시 */}
            <div className="flex flex-col items-center cursor-pointer" onClick={() => handleOptionClick(currentOption.text)}>
              <img
                src={currentOption.gif}
                alt={`${currentOption.text} 수어 이미지`}
                className="w-[296px] h-[296px] rounded-lg cursor-pointer hover:scale-110 transition-transform duration-200"
              />
              <p className="mt-6 text-center text-[32px] font-semibold leading-[150%] tracking-[-0.64px] text-[#666B76]">
                {currentOption.text}
              </p>
            </div>

            {/* 다음 버튼 */}
            <button
              onClick={handleNext}
              className="flex items-center justify-center cursor-pointer transition-colors"
              aria-label="다음"
            >
              <span className="text-4xl text-[#666B76] hover:text-[#1A1A1A]">&gt;</span>
            </button>
          </div>

          {/* 페이지 표시기 */}
          <div className="mt-4 flex gap-2 justify-center">
            {options.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#1A1A1A]' : 'bg-[#E0E0E0]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreQuestion2;
