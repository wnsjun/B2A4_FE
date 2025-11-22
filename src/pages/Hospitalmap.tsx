import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../layouts/Topbar";
import Bottombar from "../layouts/Bottombar";
import Modal from "../components/Modal";
import HospitalDetailBottomSheet from "../components/HospitalMap/HospitalDetailBottomSheet";
import hospitalImage from "../assets/hospitalmap/hospitalimage.png";
import MyLocation from "../assets/hospitalmap/mylocation.png";
import LocationPin from "../assets/hospitalmap/locationpin.png";
import { debounce } from "lodash";
import { useKakaoMaps } from "../hooks/useKakaoMaps";
declare global {
  interface Window {
    kakao: any;
  }
}

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
}

interface LatLng {
  lat: number;
  lng: number;
}

// 샘플 병원 데이터
const HOSPITAL_DATA: Hospital[] = [
  {
    id: 1,
    lat: 37.5560379420754,
    lng: 126.924462416982,
    image: hospitalImage,
    name: '농인사랑병원',
    department: '외과·정형외과',
    address: '서울특별시 마포구 양화로 188 (동교동)',
    hours: { day: '월', startTime: '09:00', endTime: '18:00' },
    phone: '02-789-9800',
  },
  {
    id: 2,
    lat: 37.5553020767532,
    lng: 126.923590029183,
    image: hospitalImage,
    name: '마포의료센터',
    department: '내과·외과',
    address: '서울특별시 마포구 양화로 200',
    hours: { day: '월', startTime: '08:00', endTime: '19:00' },
    phone: '02-789-9801',
  },
  {
    id: 3,
    lat: 37.5545808852364,
    lng: 126.922708589618,
    image: hospitalImage,
    name: '동교병원',
    department: '정형외과',
    address: '서울특별시 마포구 양화로 180',
    hours: { day: '월', startTime: '09:30', endTime: '18:30' },
    phone: '02-789-9802',
  },
];

const Hospitalmap = () => {
  const navigate = useNavigate();
  const { isReady: kakaoReady } = useKakaoMaps();
  const [modalOpen, setModalOpen] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const mapRef = useRef<any>(null);
  const [center, setCenter] = useState<LatLng>({
    lat: 37.55561,
    lng: 126.9234,
  });
  const [position, setPosition] = useState<LatLng>({
    lat: 37.55561,
    lng: 126.9234,
  });
  const [showMyLocationMarker, setShowMyLocationMarker] = useState(false);
  const myLocationMarkerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const watchPositionIdRef = useRef<number | null>(null);

  // 지도 중심좌표 이동 감지 시 이동된 중심좌표로 설정
  const updateCenterWhenMapMoved = useMemo(
    () =>
      debounce((map: any) => {
        setCenter({
          lat: map.getCenter().getLat(),
          lng: map.getCenter().getLng(),
        });
      }, 500),
    []
  );

  // 지도 초기화 (한 번만)
  useEffect(() => {
    // Kakao Maps SDK가 로드될 때까지 기다림
    if (!kakaoReady) return;
    if (mapRef.current) return; // 이미 초기화됨

    // 카카오맵 SDK가 완전히 로드되었는지 확인
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
      return;
    }

    const container = document.getElementById(`map`);
    if (!container) return;
    if (!window.kakao || !window.kakao.maps) {
      return;
    }

    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 3,
    };

    const map = new window.kakao.maps.Map(container, options);
    mapRef.current = map;

    // 지도 중심 이동 이벤트 리스너
    window.kakao.maps.event.addListener(map, 'center_changed', () => {
      updateCenterWhenMapMoved(map);
    });

    // 마커 생성
    HOSPITAL_DATA.forEach((hospital) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(hospital.lat, hospital.lng),
        map: map,
      });

      markersRef.current.push(marker);

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        console.log('마커 클릭:', hospital.name);
        setSelectedHospital({
          ...hospital,
          isFavorite: favorites.has(hospital.id),
        });
      });
    });
  }, [kakaoReady]);

  // 위치 권한 허용
  const handleConfirmLocation = () => {
    console.log('위치 권한이 승인되었습니다!');
    setModalOpen(false);
    setShowMyLocationMarker(true);

    // 현재 위치 가져오기
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(userLocation);
        setPosition(userLocation);

        // 지도 포커싱
        if (mapRef.current) {
          mapRef.current.setCenter(
            new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
          );
        }
      },
      (error) => {
        console.error('위치 정보를 가져올 수 없습니다:', error);
      }
    );

    // 위치 변화 감지
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (error) => {
        console.error('위치 감시 중 오류:', error);
      }
    );
    watchPositionIdRef.current = watchId;
  };

  // 내 위치로 지도 포커싱
  const setCenterToMyPosition = () => {
    if (mapRef.current) {
      mapRef.current.setCenter(new window.kakao.maps.LatLng(position.lat, position.lng));
    }
  };

  // 위치 권한 거부
  const handleCancelLocation = () => {
    console.log('위치 권한이 거부되었습니다!');
    setModalOpen(false);
    setShowMyLocationMarker(false);

    // 기본 위치로 유지
    setCenter({ lat: 37.55561, lng: 126.9234 });

    // 마커 제거
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.setMap(null);
      myLocationMarkerRef.current = null;
    }

    // 위치 감시 중지
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }
  };

  // 내 위치 마커 업데이트
  useEffect(() => {
    if (!mapRef.current) return;

    if (showMyLocationMarker) {
      if (!myLocationMarkerRef.current) {
        // 첫 번째 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(position.lat, position.lng),
          map: mapRef.current,
          title: '내 위치',
          image: new window.kakao.maps.MarkerImage(
            LocationPin,
            new window.kakao.maps.Size(32, 32),
            {
              offset: new window.kakao.maps.Point(16, 32),
            }
          ),
        });
        myLocationMarkerRef.current = marker;
      } else {
        // 기존 마커 위치 업데이트
        myLocationMarkerRef.current.setPosition(
          new window.kakao.maps.LatLng(position.lat, position.lng)
        );
      }
    }
  }, [position, showMyLocationMarker]);

  const handleFavoriteToggle = () => {
    if (selectedHospital) {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(selectedHospital.id)) {
        newFavorites.delete(selectedHospital.id);
      } else {
        newFavorites.add(selectedHospital.id);
      }
      setFavorites(newFavorites);
      // selectedHospital의 isFavorite 상태 즉시 업데이트
      setSelectedHospital({
        ...selectedHospital,
        isFavorite: !selectedHospital.isFavorite,
      });
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/*위치 권한 모달*/}
      <Modal
        isOpen={modalOpen}
        title="위치 정보 권한"
        description={
          <>
            <p>병원을 찾기 위해 위치 정보를 사용할게요.</p>
            <p>나중에 설정에서 바꿀 수 있어요.</p>
          </>
        }
        cancelButtonText="취소"
        confirmButtonText="허용"
        onCancel={handleCancelLocation}
        onConfirm={handleConfirmLocation}
      />

      {/* Hospital Detail Bottom Sheet */}
      {selectedHospital && (
        <HospitalDetailBottomSheet
          isOpen={!!selectedHospital}
          onClose={() => setSelectedHospital(null)}
          hospital={selectedHospital}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      <Topbar showLogo={true} onStarClick={() => navigate('/favorite-hospitals')} />
      <div className="w-[360px] h-[50px] bg-white flex items-center px-5 py-2.5">
        <span className="text-sm text-[#1A1A1A] font-['Pretendard']">
          손빛이 닿는 병원을 찾아보세요
        </span>
      </div>
      <div className="relative w-[360px] h-[510px]">
        <div id="map" className="w-full h-full" />
        <div className="flex flex-col gap-[10px] absolute z-1 top-0 right-0 p-[10px]">
          <button
            className="flex justify-center items-center cursor-pointer rounded-full w-[45px] h-[45px] bg-white shadow-[0_0_8px_#00000025]"
            onClick={setCenterToMyPosition}
          >
            <img src={MyLocation} alt="내 위치" width={25} height={25} />
          </button>
        </div>
      </div>
      <Bottombar />
    </div>
  );
};

export default Hospitalmap;
