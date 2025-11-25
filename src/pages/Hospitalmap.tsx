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
import { getLocationPermissionApi, updateLocationPermissionApi } from "../apis/location";
import { getNearbyHospitalsApi, getHospitalDetailApi, getAllHospitalsApi } from "../apis/hospital";
import { addBookmarkApi, deleteBookmarkApi } from "../apis/bookmark";
import { useAuthStore } from "../hooks/useAuthStore";
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
  operatingHours?: Array<{
    dayOfWeek: string;
    openTime?: string;
    closeTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    isClosed: boolean;
  }>;
}

interface LatLng {
  lat: number;
  lng: number;
}

const Hospitalmap = () => {
  const navigate = useNavigate();
  const { isReady: kakaoReady } = useKakaoMaps();
  const { isLoggedIn } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [initialZoomLevel] = useState(3);
  const [firstHospitalLocation, setFirstHospitalLocation] = useState<LatLng | null>(null);

  // 페이지 마운트 시 스크롤을 맨 위로 리셋
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // 위치 권한 상태 확인 (로그인 후 최초 방문인지 확인)
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        if (!isLoggedIn) {
          // 로그인하지 않은 상태 - 기본 위치로 지도 표시
          setShowMyLocationMarker(false);
          setCenter({ lat: 37.55561, lng: 126.9234 });
          setIsLoading(false);
          return;
        }

        // API로 위치 권한 상태 확인
        const response = await getLocationPermissionApi();
        console.log('위치 권한 API 응답:', response);

        if (response.isSuccess && response.data.locationPermission) {
          // 권한이 있으면 현재 위치 기반으로 지도 초기화
          setShowMyLocationMarker(true);

          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setCenter(userLocation);
              setPosition(userLocation);
              localStorage.setItem('userLocation', JSON.stringify(userLocation));

              // 주변 병원 검색 API 호출
              try {
                const hospitalResponse = await getNearbyHospitalsApi(userLocation.lat, userLocation.lng, 2000);
                console.log('주변 병원 검색 성공:', hospitalResponse.data);

                // API 응답을 Hospital 타입으로 변환
                const convertedHospitals: Hospital[] = hospitalResponse.data.map((hospital) => ({
                  id: hospital.hospitalId,
                  lat: hospital.latitude,
                  lng: hospital.longitude,
                  image: hospitalImage,
                  name: hospital.hospitalName,
                  department: '',
                  address: '',
                  hours: {
                    day: '',
                    startTime: '',
                    endTime: '',
                  },
                  phone: '',
                }));

                setHospitals(convertedHospitals);
                if (convertedHospitals.length > 0) {
                  setFirstHospitalLocation({ lat: convertedHospitals[0].lat, lng: convertedHospitals[0].lng });
                }
              } catch (error) {
                console.error('주변 병원 검색 실패:', error);
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
        } else {
          // 권한 요청 필요 - 최초 방문 모달 표시
          setModalOpen(true);
          setShowMyLocationMarker(false);

          // 모든 병원 조회
          try {
            const hospitalResponse = await getAllHospitalsApi();
            const convertedHospitals: Hospital[] = hospitalResponse.data.map((hospital) => ({
              id: hospital.hospitalId,
              lat: hospital.latitude,
              lng: hospital.longitude,
              image: hospitalImage,
              name: hospital.hospitalName,
              department: '',
              address: '',
              hours: {
                day: '',
                startTime: '',
                endTime: '',
              },
              phone: '',
            }));
            setHospitals(convertedHospitals);
            if (convertedHospitals.length > 0) {
              setFirstHospitalLocation({ lat: convertedHospitals[0].lat, lng: convertedHospitals[0].lng });
              setCenter({ lat: convertedHospitals[0].lat, lng: convertedHospitals[0].lng });
            } else {
              setCenter({ lat: 37.55561, lng: 126.9234 });
            }
          } catch (error) {
            console.error('모든 병원 검색 실패:', error);
            setCenter({ lat: 37.55561, lng: 126.9234 });
          }
        }
      } catch (error) {
        console.error('위치 권한 확인 중 오류:', error);
        // 오류 발생 시 모달 표시
        setModalOpen(true);
        setShowMyLocationMarker(false);

        // 모든 병원 조회
        try {
          const hospitalResponse = await getAllHospitalsApi();
          const convertedHospitals: Hospital[] = hospitalResponse.data.map((hospital) => ({
            id: hospital.hospitalId,
            lat: hospital.latitude,
            lng: hospital.longitude,
            image: hospitalImage,
            name: hospital.hospitalName,
            department: '',
            address: '',
            hours: {
              day: '',
              startTime: '',
              endTime: '',
            },
            phone: '',
          }));
          setHospitals(convertedHospitals);
          if (convertedHospitals.length > 0) {
            setFirstHospitalLocation({ lat: convertedHospitals[0].lat, lng: convertedHospitals[0].lng });
            setCenter({ lat: convertedHospitals[0].lat, lng: convertedHospitals[0].lng });
          } else {
            setCenter({ lat: 37.55561, lng: 126.9234 });
          }
        } catch (hospitalError) {
          console.error('모든 병원 조회 실패:', hospitalError);
          setCenter({ lat: 37.55561, lng: 126.9234 });
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkLocationPermission();
  }, [isLoggedIn]);

  // 지도 초기화 (한 번만)
  useEffect(() => {
    // Kakao Maps SDK가 로드될 때까지 기다림
    if (!kakaoReady) return;
    if (mapRef.current) return; // 이미 초기화됨
    if (isLoading) return; // 로딩 중이면 대기

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

    // 기존 마커 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 마커 생성
    hospitals.forEach((hospital) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(hospital.lat, hospital.lng),
        map: map,
      });

      markersRef.current.push(marker);

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', async () => {
        console.log('마커 클릭:', hospital.name);

        // 상세 정보 조회 API 호출
        try {
          const detailResponse = await getHospitalDetailApi(hospital.id);
          console.log('병원 상세 정보:', detailResponse.data);

          // API 응답 데이터로 selectedHospital 업데이트
          setSelectedHospital({
            id: detailResponse.data.hospitalId,
            lat: detailResponse.data.latitude,
            lng: detailResponse.data.longitude,
            image: detailResponse.data.imageUrl || hospitalImage,
            name: detailResponse.data.name,
            department: detailResponse.data.specialties.join('·'),
            address: detailResponse.data.address,
            hours: {
              day: '',
              startTime: '',
              endTime: '',
            },
            phone: detailResponse.data.contact,
            isFavorite: detailResponse.data.bookmark,
            operatingHours: detailResponse.data.operatingHours,
          });
        } catch (error) {
          console.error('병원 상세 정보 조회 실패:', error);
          // 오류 발생 시 기존 정보로 표시
          setSelectedHospital({
            ...hospital,
            isFavorite: favorites.has(hospital.id),
          });
        }
      });
    });
  }, [kakaoReady, isLoading, center, hospitals]);

  // 위치 권한 허용
  const handleConfirmLocation = async () => {
    console.log('위치 권한이 승인되었습니다!');
    setModalOpen(false);
    setShowMyLocationMarker(true);

    // API 호출: 위치 권한 true로 업데이트
    try {
      const response = await updateLocationPermissionApi(true);
      console.log('위치 권한 업데이트 성공:', response.message);
    } catch (error) {
      console.error('위치 권한 업데이트 실패:', error);
    }

    // 현재 위치 가져오기
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(userLocation);
        setPosition(userLocation);

        // localStorage에 위치 정보 저장
        localStorage.setItem('userLocation', JSON.stringify(userLocation));

        // 지도 포커싱 (현재 위치 + 초기 배율)
        if (mapRef.current) {
          mapRef.current.setCenter(
            new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
          );
          mapRef.current.setLevel(initialZoomLevel);
        }

        // 주변 병원 검색 API 호출
        try {
          const hospitalResponse = await getNearbyHospitalsApi(userLocation.lat, userLocation.lng, 2000);
          console.log('주변 병원 검색 성공:', hospitalResponse.data);

          // API 응답을 Hospital 타입으로 변환
          const convertedHospitals: Hospital[] = hospitalResponse.data.map((hospital) => ({
            id: hospital.hospitalId,
            lat: hospital.latitude,
            lng: hospital.longitude,
            image: hospitalImage,
            name: hospital.hospitalName,
            department: '',
            address: '',
            hours: {
              day: '',
              startTime: '',
              endTime: '',
            },
            phone: '',
          }));

          setHospitals(convertedHospitals);
          if (convertedHospitals.length > 0) {
            setFirstHospitalLocation({ lat: convertedHospitals[0].lat, lng: convertedHospitals[0].lng });
          }
        } catch (error) {
          console.error('주변 병원 검색 실패:', error);
        }
      },
      (error) => {
        console.error('위치 정보를 가져올 수 없습니다:', error);
        // 오류 발생 시 기본 위치로 설정
        setCenter({ lat: 37.55561, lng: 126.9234 });
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

  // 지도 포커싱 (권한 상태에 따라 다르게 동작)
  const setCenterToMyPosition = () => {
    if (!mapRef.current) return;

    if (showMyLocationMarker) {
      // 권한 허용: 현재 위치로 포커싱
      mapRef.current.setCenter(new window.kakao.maps.LatLng(position.lat, position.lng));
    } else {
      // 권한 취소: 첫 번째 병원 위치로 포커싱
      if (firstHospitalLocation) {
        mapRef.current.setCenter(
          new window.kakao.maps.LatLng(firstHospitalLocation.lat, firstHospitalLocation.lng)
        );
      }
    }
    mapRef.current.setLevel(initialZoomLevel);
  };

  // 위치 권한 거부
  const handleCancelLocation = async () => {
    console.log('위치 권한이 거부되었습니다!');
    setModalOpen(false);
    setShowMyLocationMarker(false);

    // API 호출: 위치 권한 false로 업데이트
    try {
      const response = await updateLocationPermissionApi(false);
      console.log('위치 권한 업데이트 성공:', response.message);
    } catch (error) {
      console.error('위치 권한 업데이트 실패:', error);
    }

    // 기본 위치로 유지
    const defaultLocation = { lat: 37.55561, lng: 126.9234 };
    setCenter(defaultLocation);
    localStorage.removeItem('userLocation');

    // 모든 병원 조회 API 호출
    try {
      const hospitalResponse = await getAllHospitalsApi();
      console.log('모든 병원 조회 성공:', hospitalResponse.data);

      // API 응답을 Hospital 타입으로 변환
      const convertedHospitals: Hospital[] = hospitalResponse.data.map((hospital) => ({
        id: hospital.hospitalId,
        lat: hospital.latitude,
        lng: hospital.longitude,
        image: hospitalImage,
        name: hospital.hospitalName,
        department: '',
        address: '',
        hours: {
          day: '',
          startTime: '',
          endTime: '',
        },
        phone: '',
      }));

      setHospitals(convertedHospitals);

      // 첫 번째 병원을 중심으로 지도 표시
      let targetLocation = defaultLocation;
      if (convertedHospitals.length > 0) {
        targetLocation = { lat: convertedHospitals[0].lat, lng: convertedHospitals[0].lng };
        setFirstHospitalLocation(targetLocation);
        setCenter(targetLocation);
      } else {
        setCenter(defaultLocation);
      }

      // 지도를 첫 번째 병원 위치로 포커싱 (초기 배율)
      if (mapRef.current) {
        mapRef.current.setCenter(new window.kakao.maps.LatLng(targetLocation.lat, targetLocation.lng));
        mapRef.current.setLevel(initialZoomLevel);
      }
    } catch (error) {
      console.error('주변 병원 검색 실패:', error);
      setCenter(defaultLocation);

      // 에러 발생 시에도 지도 포커싱
      if (mapRef.current) {
        mapRef.current.setCenter(new window.kakao.maps.LatLng(defaultLocation.lat, defaultLocation.lng));
        mapRef.current.setLevel(initialZoomLevel);
      }
    }

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

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
    };
  }, []);

  const handleFavoriteToggle = async () => {
    if (!selectedHospital) return;

    try {
      if (selectedHospital.isFavorite) {
        // 즐겨찾기 제거 API 호출
        const response = await deleteBookmarkApi(selectedHospital.id);
        console.log('즐겨찾기 제거 성공:', response.message);
      } else {
        // 즐겨찾기 추가 API 호출
        const response = await addBookmarkApi(selectedHospital.id);
        console.log('즐겨찾기 추가 성공:', response.message);
      }

      // 로컬 상태 업데이트
      const newFavorites = new Set(favorites);
      if (newFavorites.has(selectedHospital.id)) {
        newFavorites.delete(selectedHospital.id);
      } else {
        newFavorites.add(selectedHospital.id);
      }
      setFavorites(newFavorites);

      // selectedHospital의 isFavorite 상태 토글
      setSelectedHospital({
        ...selectedHospital,
        isFavorite: !selectedHospital.isFavorite,
      });
    } catch (error) {
      console.error('즐겨찾기 처리 실패:', error);
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
      <div className="relative w-[360px] h-[480px]">
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
