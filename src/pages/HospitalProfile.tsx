import WebTopbar from '../layouts/WebTopbar';
import FileForm from '../components/FileForm';
import { hospHeader, logoText, hospitalProfileText } from '../styles/typography';
import Button from '../components/Button';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getHospitalInfoApi } from '../apis/auth';
import { processOperatingTimeForDisplay } from '../utils/timeConvertor';
import LocaionIcon from '../assets/profile/location.svg';
import CallIcon from '../assets/profile/call.svg';
import TimeIcon from '../assets/profile/time.svg';

interface HospitalData {
  name: string;
  address: string;
  contact: string;
  operatingTime: Array<{ day: string; hours: string; break: string | null }>;
  subject: string;
  imageUrl: string | null;
}

const HospitalProfile = () => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) {
      setIsLoading(false);
      console.error('⛔️ URL에 hospitalId가 없습니다. 라우팅 문제!');
      return;
    }

    const fetchProfile = async () => {
      try {
        // 1. API 호출
        const response = await getHospitalInfoApi(hospitalId);

        // ⭐️ CCTV 1: API 응답이 왔는지 확인
        console.log('--- 1. API 통신 성공! 응답 원본:', response);

        // 2. ⭐️ [핵심 추출] 서버 응답이 'data' 안에 들어있는지 확인하고 데이터 추출
        // API 응답 구조: { data: { name: ..., operatingHours: [...] } }
        const hospitalDataFromApi = response.data.data || response.data; // 가장 안전한 방식으로 핵심 데이터를 꺼냅니다.

        // ⭐️ CCTV 2: 추출된 핵심 데이터 확인
        console.log('--- 2. 추출된 병원 데이터:', hospitalDataFromApi);

        // 3. 데이터 유효성 최종 점검
        if (!hospitalDataFromApi || !hospitalDataFromApi.operatingHours) {
          console.error('⛔️ ERROR: 응답 구조가 예상과 다릅니다. 운영시간 데이터가 없습니다.');
          throw new Error('데이터 구조 오류');
        }

        // 4. 변환 및 상태 저장 (이하 로직은 그대로)
        const processedTime = processOperatingTimeForDisplay(hospitalDataFromApi.operatingHours);

        setHospitalData({
          name: hospitalDataFromApi.name,
          address: hospitalDataFromApi.address,
          contact: hospitalDataFromApi.contact,
          subject: hospitalDataFromApi.specialties ? hospitalDataFromApi.specialties[0] : '',
          operatingTime: processedTime,
          imageUrl: hospitalDataFromApi.imageUrl || null,
        });
      } catch (error: any) {
        // ⭐️ CCTV 3: 최종 실패! Network 탭 상태 코드와 함께 이 로그를 확인해주세요.
        console.error('🚨 3. 최종 실패! 에러:', error.response || error);

        // setHospitalData(null)이 실행되어 "정보를 찾을 수 없습니다"가 뜸
        setHospitalData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [hospitalId]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (!hospitalData) {
    return <div>병원 정보를 찾을 수 없습니다.</div>;
  }

  const validOperatingTime = hospitalData.operatingTime.filter(
    (item) => item.hours && item.hours.trim() !== '' && item.hours.trim() !== 'null - null'
  );

  const defaultTime = validOperatingTime.length > 0 ? validOperatingTime[0] : null;
  return (
    <div className="w-screen max-h-screen">
      <WebTopbar />
      <div className="flex justify-center mt-[128px] ">
        <div id="병원 프로필 div" className="flex flex-col h-screen w-[400px] gap-y-[48px] ">
          <div
            id="프로필 기본 정보"
            className="flex flex-col justify-center items-center content-center gap-y-[16px]"
          >
            <FileForm mainImage={null} type="profile" previewUrl={hospitalData.imageUrl} />{' '}
            <div
              id="텍스트 디바이스"
              className="flex flex-col justify-center items-center content-center"
            >
              <div id="병원 이름" style={hospHeader}>
                {hospitalData.name}
              </div>
              <div id="진료 과목" style={logoText}>
                {hospitalData.subject}
              </div>
            </div>
          </div>
          <div
            id="위치 영업일 연락처"
            className="flex flex-col mb-[120px] gap-y-[8px]"
            style={hospitalProfileText}
          >
            <div id="위치" className="flex flex-row gap-[8px]">
              <img src={LocaionIcon} className="w-[20px] h-[20px]" />
              {hospitalData.address}
            </div>
            <div id="운영일" className="flex flex-row gap-[8px] ">
              <div>
                <img src={TimeIcon} className="w-[20px] h-[20px]" />
              </div>
              <div className="flex w-full max-h-[145px] overflow-y-auto ">
                {isTimeOpen ? (
                  <div className="w-full flex flex-col">
                    {hospitalData.operatingTime.map((item) => {
                      if (!item.hours || item.hours.trim() === 'null - null') {
                        return null;
                      }
                      const isDayOff = item.hours === '휴무';

                      return (
                        <div className="flex flex-row gap-x-[4px]">
                          <div>{item.day}</div>
                          {isDayOff ? (
                            '휴무'
                          ) : (
                            <div>
                              {item.hours}
                              {item.break && <div className="">{item.break}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : defaultTime ? (
                  <div className="flex flex-row gap-x-[4px]">
                    <div>{defaultTime.day}</div>
                    <div>{defaultTime.hours}</div>
                  </div>
                ) : (
                  <div>운영 정보 없음</div>
                )}
              </div>
              <div
                onClick={() => {
                  setIsTimeOpen(!isTimeOpen);
                }}
                className="itmes-center"
              >
                <img
                  src="/dropdown.svg"
                  className={
                    `flex-shrink-0 transition-transform duration-200 ` +
                    (isTimeOpen ? 'rotate-0' : 'rotate-180')
                  }
                />
              </div>
            </div>
            <div id="연락처" className="flex flex-row gap-[8px]">
              <img src={CallIcon} className="w-[20px] h-[20px]" />
              {hospitalData.contact}
            </div>
          </div>
          <div className=" w-[400px] absolute bottom-4">
            <Button
              children="수정"
              variant="default"
              className="w-full"
              onClick={() => nav(`/hospital-profile-edit/${hospitalId}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalProfile;
