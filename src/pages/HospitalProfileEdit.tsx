import React, { useEffect } from 'react';
import Button from '../components/Button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Step2Form from '../components/Step2Form';
import Step1Form from '../components/Step1Form';
import FileForm from '../components/FileForm';
import { hospHeader } from '../styles/typography';
import WebTopbar from '../layouts/WebTopbar';
import { reverseTransformOperatingData, transformOperatingData } from '../utils/timeConvertor';
import { getHospitalInfoApi, updateHospitalInfoApi } from '../apis/auth';

interface IOperatingTime {
  mon: string | null;
  tue: string | null;
  wed: string | null;
  thu: string | null;
  fri: string | null;
  sat: string | null;
  sun: string | null;
}

interface IFormData {
  hospitalName: string;
  subject: string;
  address: string;
  contactNumber: string;
  operatingTime: IOperatingTime;
  mainImage: File | null;
}

const HospitalProfileEdit = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDays, setSelectedDays] = useState<(keyof IOperatingTime)[]>([]);
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  //폼 데이터를 객체로 관리
  const [formData, setFormData] = useState<IFormData>({
    hospitalName: '',
    subject: '',
    address: '',
    contactNumber: '',
    operatingTime: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
    mainImage: null,
  });

  useEffect(() => {
    const fetchHospitalInfo = async () => {
      const myId = localStorage.getItem('hospitalId');

      if (!myId) {
        // ID가 없으면 경고 후 로그인 페이지로 튕겨냄
        alert('로그인 정보가 유효하지 않습니다.');
        nav('/login');
        return;
      }

      try {
        // 1. API 호출
        const response = await getHospitalInfoApi(myId);
        const data = response.data || response;

        // 2. 데이터 처리 및 변환
        const convertedTime = reverseTransformOperatingData(data.operatingTime, data.breakTimes);

        const activeDays = Object.keys(convertedTime).filter(
          (key) => convertedTime[key as keyof IOperatingTime] !== null
        ) as (keyof IOperatingTime)[];

        // 3. 상태 업데이트
        setFormData({
          hospitalName: data.name,
          subject: data.specialties ? data.specialties[0] : '',
          address: data.address,
          contactNumber: data.contact,
          operatingTime: convertedTime,
          mainImage: null,
        });
        setSelectedDays(activeDays);
      } catch (error) {
        console.error('정보 불러오기 실패:', error);
        alert('병원 정보를 불러오지 못했습니다. 콘솔을 확인해주세요.');
      } finally {
        // 4. 로딩 끝! (성공/실패와 관계없이 UI를 보여줌)
        setIsLoading(false);
      }
    };

    fetchHospitalInfo();
  }, [nav]);

  // 유효성 검사
  const isStep1Valid =
    formData.hospitalName !== '' &&
    formData.subject !== '' &&
    formData.address !== '' &&
    formData.contactNumber.length >= 9 &&
    formData.mainImage! == null;

  const isStep2Valid = Object.values(formData.operatingTime).every((time) => time !== null);

  // 이벤트 핸들러
  const handleDayToggle = (dayKey: keyof IOperatingTime) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const applyBatchTime = (time: string | null) => {
    if (selectedDays.length === 0) return;

    setFormData((prev) => {
      const newTime = { ...prev.operatingTime };

      if (selectedDays.length === 1) {
        // 1. 단일 수정 모드: 무조건 덮어쓰기
        const dayKey = selectedDays[0];
        newTime[dayKey] = time;
      } else {
        // 2. 다중 선택 모드

        // 선택된 요일들의 현재 데이터를 가져옴
        const currentDatas = selectedDays.map((dayKey) => prev.operatingTime[dayKey]);

        // 'locked' (데이터 있음)와 'unlocked' (null 또는 '휴무')가 섞여있는지 확인
        const hasLocked = currentDatas.some((data) => data !== null && data !== '휴무');
        const hasUnlocked = currentDatas.some((data) => data === null || data === '휴무');

        if (hasLocked && hasUnlocked) {
          // 3. (Case C) 섞인 경우: '잠기지 않은' 요일에만 적용 (새로 추가)
          selectedDays.forEach((dayKey) => {
            const currentData = prev.operatingTime[dayKey];
            const isLocked = currentData !== null && currentData !== '휴무';
            if (!isLocked) {
              newTime[dayKey] = time;
            }
          });
        } else {
          // 4. (Case A or B) 섞이지 않은 경우: '모두 null/휴무' 이거나 '모두 잠김'
          //    -> 모든 요일에 덮어쓰기 (새로 추가 또는 일괄 수정)
          selectedDays.forEach((dayKey) => {
            newTime[dayKey] = time;
          });
        }
      }
      return { ...prev, operatingTime: newTime };
    });
  };

  const applyBatchDayOff = (isDayOff: boolean) => {
    if (selectedDays.length === 0) {
      console.warn('휴무 처리할 요일을 선택해주세요.');
      return;
    }

    setFormData((prev) => {
      const newTime = { ...prev.operatingTime };

      selectedDays.forEach((dayKey) => {
        const currentData = prev.operatingTime[dayKey];
        // "잠금" 상태 = (null도 아니고 '휴무'도 아닌, 즉 진료 시간이 입력된 상태)
        const isLocked = currentData !== null && currentData !== '휴무';

        if (isLocked) {
          // 1. 잠긴 요일은 건드리지 않습니다.
        } else {
          // 2. 잠기지 않은 요일(null 또는 '휴무')에만 상태를 적용합니다.
          newTime[dayKey] = isDayOff ? '휴무' : null;
        }
      });
      return { ...prev, operatingTime: newTime };
    });
    // (선택 해제 로직 삭제됨 - 폼 초기화 방지)
  };

  const handleKeyDownEnter = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isStep1Valid) {
        setCurrentStep(2);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      setFormData((prevData) => ({
        ...prevData,
        mainImage: file,
      }));
    }
  };

  const handleSubjectChange = (subjectValue: string) => {
    setFormData((prev) => ({
      ...prev,
      subject: subjectValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isStep1Valid && isStep2Valid) {
      try {
        const apiFormData = new FormData();

        // 1. 운영시간 변환 (문자열 -> 객체)
        const { operatingHours, breakTimes } = transformOperatingData(formData.operatingTime);

        // 2. DTO 객체 생성 (수정할 데이터)
        const updateDto = {
          name: formData.hospitalName,
          address: formData.address,
          contact: formData.contactNumber, // (필요시 하이픈 제거/추가)
          specialties: [formData.subject],
          operatingHours: operatingHours,
          breakTimes: breakTimes,
        };

        // 3. JSON Blob 담기 (request)
        const jsonBlob = new Blob([JSON.stringify(updateDto)], { type: 'application/json' });
        apiFormData.append('request', jsonBlob);

        // 4. 이미지 (새로 올린 경우만)
        if (formData.mainImage) {
          apiFormData.append('image', formData.mainImage);
        }

        // 5. 수정 API 호출 (updateHospitalInfoApi는 auth.ts나 hospital.ts에 만들어야 함)
        // (인자는 apiFormData 하나만 보내면 됨. ID는 토큰에 있거나 URL에 포함)
        const myId = localStorage.getItem('hospitalId');

        if (myId) await updateHospitalInfoApi(myId, apiFormData);

        alert('정보 수정이 완료되었습니다!');
        // nav('/mypage'); // 이동할 곳
      } catch (error) {
        console.error('수정 실패:', error);
        alert('수정 중 오류가 발생했습니다.');
      }
    } else {
      if (!isStep1Valid) {
        alert('1단계 입력 정보를 확인해주세요.');
        setCurrentStep(1);
      } else if (!isStep2Valid) alert('2단계 입력 정보를 확인해주세요');
    }
  };
  return (
    <div>
      <WebTopbar />
      <div className="max-w-[688px] my-[120px] mx-auto">
        {/* 안내문구 */}
        <div style={hospHeader} className="flex justify-center items-center mb-[105px] text-[24px]">
          수정할 정보를 입력해주세요
        </div>
        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="flex flex-row max-w-[688px]">
            <FileForm mainImage={formData.mainImage} handleFileChange={handleFileChange} />
            <div>
              <div className="flex flex-1 flex-col max-w-[400px] min-h-[418px] justify-center items-center content-center">
                {/* 정보 입력 칸 */}
                {currentStep === 1 && (
                  <Step1Form
                    formData={formData}
                    handleInputChange={handleInputChange}
                    onKeyDown={handleKeyDownEnter}
                    handleSubjectChange={handleSubjectChange}
                  />
                )}
                {currentStep === 2 && (
                  <Step2Form
                    operatingTime={formData.operatingTime}
                    selectedDays={selectedDays}
                    onDayToggle={handleDayToggle}
                    onBatchTimeApply={applyBatchTime}
                    onBatchDayOffApply={applyBatchDayOff}
                  />
                )}
                <div className="flex flex-col">
                  <div>
                    <div className="flex flex-row gap-[12px] my-[32px] justify-center">
                      {/* 슬라이더 용 버튼 */}
                      <div
                        className={
                          `w-[8px] h-[8px] rounded-full outline-0 ` +
                          (currentStep === 1 ? 'bg-[#3D84FF]' : 'bg-[#E2E4E8]')
                        }
                        onClick={() => setCurrentStep(1)}
                      />
                      <div
                        className={
                          `w-[8px] h-[8px] rounded-full outline-0 ` +
                          (currentStep === 2 ? 'bg-[#3D84FF]' : 'bg-[#E2E4E8]')
                        }
                        onClick={() => setCurrentStep(2)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center content-center items-center">
                  <Button
                    type="submit"
                    variant={isStep1Valid && isStep2Valid ? 'colored' : 'default'}
                    disabled={!(isStep1Valid && isStep2Valid)}
                  >
                    완료
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalProfileEdit;
