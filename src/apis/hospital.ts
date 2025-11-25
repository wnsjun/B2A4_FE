import instance from '../utils/axiosInstance';

interface HospitalData {
  hospitalId: number;
  hospitalName: string;
  latitude: number;
  longitude: number;
  distance: number;
}

interface NearbyHospitalsResponse {
  message: string;
  data: HospitalData[];
  success: boolean;
}

interface OperatingHour {
  dayOfWeek: string;
  openTime?: string;
  closeTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isClosed: boolean;
}

interface HospitalDetailData {
  hospitalId: number;
  loginId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact: string;
  specialties: string[];
  imageUrl: string;
  operatingHours: OperatingHour[];
  bookmark: boolean;
}

interface HospitalDetailResponse {
  is_success: boolean;
  message: string;
  data: HospitalDetailData;
}

export const getNearbyHospitalsApi = async (lat: number, lng: number, radius: number = 3000) => {
  const response = await instance.get<NearbyHospitalsResponse>('/api/hospitals/nearby', {
    params: {
      lat,
      lng,
      radius,
    },
  });
  return response.data;
};

export const getHospitalDetailApi = async (hospitalId: number) => {
  const response = await instance.get<HospitalDetailResponse>(`/api/hospitals/${hospitalId}`);
  return response.data;
};

export const getAllHospitalsApi = async () => {
  const response = await instance.get<NearbyHospitalsResponse>('/api/hospitals/all');
  return response.data;
};
