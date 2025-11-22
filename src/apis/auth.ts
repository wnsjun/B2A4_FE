import instance from '../utils/axiosInstance';
import { useAuthStore } from '../hooks/useAuthStore';

interface LoginPayload {
  loginId: string;
  pwd: string;
}

interface LoginResponse {
  isSuccess: boolean;
  message: string;
  patientId: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  imageUrl?: string;
}

interface SignupPatientPayload {
  loginId: string;
  pwd: string;
  name?: string;
}

// interface SignupHospitalPayload{
//     loginId: string;
//     pwd: string;
//     hospitalName:string;
//     address: string;
//     contact:string;
//     specialties: string;
//     image: string;
//     operatingHours: multipart | form-data
// }

export const loginPatientApi = async (payload: LoginPayload) => {
  const response = await instance.post<LoginResponse>('/api/patients/login', payload);
  return response.data;
};

export const logoutPatientApi = async () => {
  await instance.post('/api/patients/login');
  useAuthStore.getState().clearAuth();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const loginHospitalApi = async (payload: LoginPayload) => {
  const response = await instance.post<LoginResponse>('/api/hospitals/login', payload);
  return response.data;
};

export const logoutHospitalApi = async () => {
  await instance.post('/api/hospitals/login');
  useAuthStore.getState().clearAuth();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const signupPatientApi = async (payload: SignupPatientPayload) => {
  await instance.post('/api/patients/signup', payload);
  useAuthStore.getState().clearAuth();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const signUpHospitalApi = async (formData: FormData) => {
  const response = await instance.post('/api/hospitals/signup', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
