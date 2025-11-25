import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../hooks/useChatStore';
import Topbar from '../layouts/Topbar';
import img11 from '../assets/prequestion/1-1.GIF';
import img12 from '../assets/prequestion/1-2.GIF';
import img13 from '../assets/prequestion/1-3.GIF';

const PreQuestion1 = () => {
  const navigate = useNavigate();
  const { setPreQuestion1 } = useChatStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const options = [
    { text: '아파요', gif: img11 },
    { text: '어지러워요', gif: img12 },
    { text: '기타', gif: img13 },
  ];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? options.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === options.length - 1 ? 0 : prev + 1));
  };

  const handleOptionClick = (symptom: string) => {
    setPreQuestion1(symptom);
    navigate('/pre-question2');
  };

  const currentOption = options[currentIndex];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Topbar type="header" title="사전 응답" />
      <div className="pt-[80px] px-5">
        <h1 className="text-center text-[32px] font-semibold leading-[150%] tracking-[-0.64px] text-[#1A1A1A]">
          어떻게 불편하신가요?
        </h1>
        <p className="mt-4 text-center text-[24px] font-semibold leading-[150%] tracking-[-0.48px] text-[#666B76]">
          수어 이미지를 보고 골라주세요
        </p>

        <div className="mt-[100px] flex flex-col items-center">
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
          <div className="mt-8 flex gap-2 justify-center">
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

export default PreQuestion1;
