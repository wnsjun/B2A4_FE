import { useEffect, useState } from 'react';
import { photoSelect } from '../styles/typography';

interface FileFormProps {
  mainImage?: File | null;
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  previewUrl?: string | null;
}

// 폼 컴포넌트

const FileForm = ({ mainImage, handleFileChange, type, previewUrl }: FileFormProps) => {
  const [currentObjectURL, setCurrentObjectURL] = useState<string | null>(null);

  useEffect(() => {
    // 1. 새로 업로드된 파일이 있으면 objectUrl 생성
    if (mainImage && mainImage instanceof File) {
      const objectUrl = URL.createObjectURL(mainImage);
      setCurrentObjectURL(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    // 2. 새로 업로드된 파일이 없으면, 기존 URL (previewUrl)을 띄움
    setCurrentObjectURL(previewUrl || null);

    // 이 useEffect는 mainImage나 previewUrl이 바뀔 때 실행되어야 합니다.
  }, [mainImage, previewUrl]);

  // ⭐️ 렌더링에 사용할 최종 이미지 소스 (currentObjectURL이 유효한 URL입니다)
  const imageToDisplay = currentObjectURL;

  return (
    <>
      <label
        htmlFor="mainImageInput"
        className={
          (type === 'profile' ? '' : ' mr-[80px]') +
          ' w-[208px] h-[208px] bg-[#F4F6F8] rounded-full flex flex-col items-center justify-center cursor-pointer'
        }
      >
        {imageToDisplay ? (
          <img
            src={imageToDisplay}
            alt="병원 사진 미리보기"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="flex flex-col items-center content-center justify-center gap-[8px]">
            <img src="/camera.svg" alt="카메라 아이콘" className="w-[24px]" />
            <span style={photoSelect} className="text-sm mt-2 ">
              사진을 선택해주세요
            </span>
          </div>
        )}
      </label>
      <input
        type="file"
        id="mainImageInput"
        name="mainImage"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden" // 화면에서 숨김
      />
    </>
  );
};

export default FileForm;
