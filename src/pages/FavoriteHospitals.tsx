import { useState, useEffect } from "react";
import Topbar from "../layouts/Topbar";
import Bottombar from "../layouts/Bottombar";
import HospitalFavoriteContent from "../components/HospitalMap/HospitalFavoriteContent";
import HospitalIamge from '../assets/hospitalmap/hospitalimage.png';
import { getBookmarkedHospitalsApi, deleteBookmarkApi } from "../apis/bookmark";

interface Hospital {
  id: number;
  lat: number;
  lng: number;
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
}

const FavoriteHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 즐겨찾기 병원 목록 조회 API 호출
  useEffect(() => {
    const fetchBookmarkedHospitals = async () => {
      try {
        const response = await getBookmarkedHospitalsApi();
        console.log('즐겨찾기 병원 목록:', response.data);

        // API 응답을 Hospital 타입으로 변환
        const convertedHospitals: Hospital[] = response.data.hospitals.map((hospital) => ({
          id: hospital.id,
          lat: 0, // 목록 조회 API에는 위도 정보 없음
          lng: 0, // 목록 조회 API에는 경도 정보 없음
          image: hospital.imageUrl || HospitalIamge,
          name: hospital.name,
          department: hospital.specialties.join('·'),
          address: hospital.address,
          hours: {
            day: hospital.operatingHours?.[0]?.dayOfWeek || '',
            startTime: hospital.operatingHours?.[0]?.openTime || '',
            endTime: hospital.operatingHours?.[0]?.closeTime || '',
          },
          phone: hospital.contact,
          isFavorite: hospital.bookmark,
          operatingHours: hospital.operatingHours,
        }));

        setHospitals(convertedHospitals);
      } catch (error) {
        console.error('즐겨찾기 병원 목록 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarkedHospitals();
  }, []);

  const handleRemoveFavorite = async (id: number) => {
    try {
      // DELETE API 호출
      const response = await deleteBookmarkApi(id);
      console.log('즐겨찾기 제거 성공:', response.message);

      // 로컬 상태에서 제거
      const updatedHospitals = hospitals.filter(hospital => hospital.id !== id);
      setHospitals(updatedHospitals);
    } catch (error) {
      console.error('즐겨찾기 제거 실패:', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Topbar type="header" title="즐겨찾기" />

      <div className="w-[360px] overflow-y-auto py-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-gray-600 text-sm">
            로딩 중...
          </div>
        ) : hospitals.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-600 text-sm">
            즐겨찾기 병원이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-0 w-full">
            {hospitals.map((hospital) => (
              <div key={hospital.id}>
                <HospitalFavoriteContent
                  image={hospital.image}
                  name={hospital.name}
                  department={hospital.department}
                  address={hospital.address}
                  hours={hospital.hours}
                  phone={hospital.phone}
                  isFavorite={hospital.isFavorite || false}
                  onFavoriteToggle={() => handleRemoveFavorite(hospital.id)}
                  operatingHours={hospital.operatingHours}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Bottombar />
    </div>
  );
};

export default FavoriteHospitals;
