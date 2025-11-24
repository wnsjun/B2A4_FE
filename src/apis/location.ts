import instance from '../utils/axiosInstance';

interface LocationPermissionResponse {
  isSuccess: boolean;
  message: string;
  data: {
    locationPermission: boolean;
  };
}

interface LocationPermissionUpdateResponse {
  isSuccess: boolean;
  message: string;
}

export const getLocationPermissionApi = async () => {
  const response = await instance.get<LocationPermissionResponse>('/api/patients/locations');
  return response.data;
};

export const updateLocationPermissionApi = async (locationPermission: boolean) => {
  const response = await instance.post<LocationPermissionUpdateResponse>(
    '/api/patients/locations',
    { locationPermission }
  );
  return response.data;
};
