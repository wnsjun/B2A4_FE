import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../hooks/useChatStore';
import img11 from '../assets/prequestion/1-1.GIF';
import img12 from '../assets/prequestion/1-2.GIF';
import img13 from '../assets/prequestion/1-3.GIF';

const PreQuestion1 = () => {
  const navigate = useNavigate();
  const { setPreQuestion1 } = useChatStore();

  const options = [
    { text: '아파요', gif: img11 },
    { text: '어지러워요', gif: img12 },
    { text: '기타', gif: img13 },
  ];

  const handleOptionClick = (symptom: string) => {
    setPreQuestion1(symptom);
    navigate('/pre-question2');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-[120px] px-5">
      <h1 className="text-center text-[32px] font-semibold leading-[150%] tracking-[-0.64px] text-[#1A1A1A]">
        어떻게 불편하신가요?
      </h1>
      <p className="mt-4 text-center text-[24px] font-semibold leading-[150%] tracking-[-0.48px] text-[#666B76]">
        수어 이미지를 보고 골라주세요
      </p>

      <div className="mt-[100px] flex justify-center gap-6">
        {options.map((option, index) => (
          <div
            key={index}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => handleOptionClick(option.text)}
          >
            <img
              src={option.gif}
              alt={`${option.text} 수어 이미지`}
              className="w-[296px] h-[296px] rounded-lg cursor-pointer hover:scale-110 transition-transform duration-200"
            />
            <p className="mt-6 text-center text-[32px] font-semibold leading-[150%] tracking-[-0.64px] text-[#666B76]">
              {option.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreQuestion1;
