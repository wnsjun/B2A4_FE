import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
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
  mainImage: File | null; // 사용자가 '새로' 올린 파일
}

const HospitalProfileEdit = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDays, setSelectedDays] = useState<(keyof IOperatingTime)[]>([]);
  const nav = useNavigate();

  // ⭐️ [추가] 기존 이미지 URL을 저장할 state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [initialOperatingTime, setInitialOperatingTime] = useState<IOperatingTime | null>(null);

  // 폼 데이터 관리
  const [formData, setFormData] = useState<IFormData>({
    hospitalName: '',
    subject: '',
    address: '',
    contactNumber: '',
    operatingTime: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
    mainImage: null,
  });

  // 1. 데이터 불러오기 (GET)
  useEffect(() => {
    const fetchHospitalInfo = async () => {
      const myId = localStorage.getItem('hospitalId'); // hospitalId 확인!

      if (!myId) {
        alert('로그인 정보가 유효하지 않습니다.');
        nav('/login');
        return;
      }

      try {
        const response = await getHospitalInfoApi(myId);
        const data = response.data.data || response.data || response; // 데이터 경로 안전하게 찾기

        // 운영시간 역변환
        const convertedTime = reverseTransformOperatingData(data.operatingHours, data.breakTimes);

        setInitialOperatingTime(convertedTime);
        setSelectedDays(['mon']);

        // 폼 데이터 채우기
        setFormData({
          hospitalName: data.name,
          subject: data.specialties ? data.specialties[0] : '',
          address: data.address,
          contactNumber: data.contact,
          operatingTime: convertedTime,
          mainImage: null, // ⚠️ 중요: 파일 객체는 없으므로 null로 둡니다!
        });

        // ⭐️ [핵심] 서버에서 받은 이미지 URL을 미리보기 state에 저장
        setPreviewImageUrl(data.imageUrl);
      } catch (error) {
        console.error('정보 불러오기 실패:', error);
        alert('정보를 불러오지 못했습니다.');
      } finally {
        alert('병원 정보를 불러오지 못했습니다. 콘솔을 확인해주세요.');
      }
    };

    fetchHospitalInfo();
  }, [nav]);

  // // 2. 유효성 검사 (수정 페이지용)
  // const isStep1Valid =
  //   formData.hospitalName !== '' &&
  //   formData.subject !== '' &&
  //   formData.address !== '' &&
  //   formData.contactNumber.length >= 9;
  // // ⭐️ [수정] 이미지는 '새 파일(mainImage)'이 있거나 '기존 URL(previewImageUrl)'이 있으면 통과
  // // (formData.mainImage !== null || previewImageUrl !== null);

  // const isStep2Valid = Object.values(formData.operatingTime).every((time) => time !== null);

  const isOperatingTimeChanged = (
    current: IOperatingTime,
    initial: IOperatingTime | null
  ): boolean => {
    // 초기값이 null이면 안전을 위해 true 반환 (변경되었다고 가정하고 전송)
    if (!initial) return true;
    // 모든 요일의 값이 하나라도 다르면 true 반환
    // const days: (keyof IOperatingTime)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    // JSON.stringify를 사용하면 객체 구조 전체를 비교하여 안정성이 높습니다.
    return JSON.stringify(current) !== JSON.stringify(initial);
  };

  const handleDayToggle = (dayKey: keyof IOperatingTime) => {
    // 1. 이미 선택된 요일을 또 눌렀다면? -> 선택 해제 (빈 배열)
    if (selectedDays.includes(dayKey)) {
      setSelectedDays([]);
    }
    // 2. 다른 요일을 눌렀다면? -> 그 요일로 교체
    else {
      setSelectedDays([dayKey]);
    }
  };

  const applyBatchTime = (time: string | null) => {
    /* ... 기존 코드 ... */
    if (selectedDays.length === 0) return;
    setFormData((prev) => {
      const newTime = { ...prev.operatingTime };
      if (selectedDays.length === 1) {
        newTime[selectedDays[0]] = time;
      } else {
        const currentDatas = selectedDays.map((dayKey) => prev.operatingTime[dayKey]);
        const hasLocked = currentDatas.some((data) => data !== null && data !== '휴무');
        const hasUnlocked = currentDatas.some((data) => data === null || data === '휴무');
        if (hasLocked && hasUnlocked) {
          selectedDays.forEach((dayKey) => {
            const isLocked =
              prev.operatingTime[dayKey] !== null && prev.operatingTime[dayKey] !== '휴무';
            if (!isLocked) newTime[dayKey] = time;
          });
        } else {
          selectedDays.forEach((dayKey) => {
            newTime[dayKey] = time;
          });
        }
      }
      return { ...prev, operatingTime: newTime };
    });
  };

  const applyBatchDayOff = (isDayOff: boolean) => {
    /* ... 기존 코드 ... */
    if (selectedDays.length === 0) {
      console.warn('휴무 처리할 요일을 선택해주세요.');
      return;
    }
    setFormData((prev) => {
      const newTime = { ...prev.operatingTime };
      selectedDays.forEach((dayKey) => {
        const currentData = prev.operatingTime[dayKey];
        const isLocked = currentData !== null && currentData !== '휴무';
        if (!isLocked) {
          newTime[dayKey] = isDayOff ? '휴무' : null;
        }
      });
      return { ...prev, operatingTime: newTime };
    });
  };
  const handleKeyDownEnter = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };
  const handleSubjectChange = (subjectValue: string) => {
    setFormData((prev) => ({ ...prev, subject: subjectValue }));
  };

  // ⭐️ [중요] 파일 변경 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData((prevData) => ({ ...prevData, mainImage: file }));
    }
  };

  // 3. 수정 제출 핸들러 (Blob 방식)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const myId = localStorage.getItem('hospitalId');
    // ⭐️ [수정] initialOperatingTime을 상태에서 가져옴
    const initialTime = initialOperatingTime;

    if (!myId) {
      alert('병원 ID를 찾을 수 없습니다.');
      return;
    }

    try {
      const apiFormData = new FormData(); // 1. 운영시간 변환 (DTO에 포함될 데이터)

      const { operatingHours, breakTimes } = transformOperatingData(formData.operatingTime); // 2. DTO 객체 생성 (기본 필드는 무조건 포함)

      const updateDto: { [key: string]: any } = {
        name: formData.hospitalName,
        address: formData.address,
        contact: formData.contactNumber,
        specialties: [formData.subject], // 배열
      }; // ⭐️ [핵심 로직] 운영시간 수정 여부 확인 // initialTime이 null이면 (로딩 실패나 초기 상태) 변경된 것으로 간주하고 전송 (shouldSendOperatingTime = true)
      const timeHasChanged = initialTime
        ? isOperatingTimeChanged(formData.operatingTime, initialTime)
        : true;

      if (timeHasChanged) {
        // 수정사항이 있을 때만 필드를 DTO에 추가
        updateDto.operatingHours = operatingHours;
        updateDto.breakTimes = breakTimes;
      } // ➡️ 수정하지 않은 경우, updateDto에 해당 필드들은 존재하지 않게 됩니다. // 3. JSON Blob
      const jsonBlob = new Blob([JSON.stringify(updateDto)], {
        type: 'application/json',
      });
      apiFormData.append('request', jsonBlob); // 4. 이미지 (새로 올린 파일이 있을 때만!)

      if (formData.mainImage) {
        apiFormData.append('image', formData.mainImage);
      } // 5. 전송

      await updateHospitalInfoApi(apiFormData);

      alert('정보 수정이 완료되었습니다!');
      nav(`/hospital-profile/${myId}`); // 프로필로 이동
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <WebTopbar />
      <div className="max-w-[688px] my-[120px] mx-auto">
        <div style={hospHeader} className="flex justify-center items-center mb-[105px] text-[24px]">
          수정할 정보를 입력해주세요
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-row max-w-[688px]">
            {/* ⭐️ [핵심] FileForm에 props 전달 방식 변경 ⭐️ */}
            <FileForm
              mainImage={formData.mainImage} // 1. 내가 방금 올린 파일 (없으면 null)
              handleFileChange={handleFileChange}
              previewUrl={previewImageUrl} // 2. 서버에서 받은 기존 이미지 URL
            />

            <div>
              <div className="flex flex-1 flex-col max-w-[400px] min-h-[418px] justify-center items-center content-center">
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
                    isEdit={true}
                  />
                )}

                <div className="flex flex-col">
                  <div>
                    <div className="flex flex-row gap-[12px] my-[32px] justify-center">
                      <div
                        className={`w-[8px] h-[8px] rounded-full outline-0 ${
                          currentStep === 1 ? 'bg-[#3D84FF]' : 'bg-[#E2E4E8]'
                        }`}
                        onClick={() => setCurrentStep(1)}
                      />
                      <div
                        className={`w-[8px] h-[8px] rounded-full outline-0 ${
                          currentStep === 2 ? 'bg-[#3D84FF]' : 'bg-[#E2E4E8]'
                        }`}
                        onClick={() => setCurrentStep(2)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center content-center items-center">
                  <Button type="submit" variant={'colored'}>
                    수정
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
