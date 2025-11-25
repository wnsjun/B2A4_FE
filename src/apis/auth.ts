import instance from '../utils/axiosInstance';

interface LoginPayload {
  loginId: string;
  pwd: string;
}

interface LoginResponse {
  isSuccess: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string | null; // 백엔드에서 안 줄 수도 있으니 ?(선택) 붙임
    role?: string;
    name?: string;
    loginId?: string;
    imageUrl?: string;
    patientId?: string;
    hospitalId?: string;
  };
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
  const response = await instance.post('/api/patients/logout', {});
  return response.data;
};

export const loginHospitalApi = async (payload: LoginPayload) => {
  const response = await instance.post<LoginResponse>('/api/hospitals/login', payload);
  return response.data;
};

export const logoutHospitalApi = async () => {
  const response = await instance.post('/api/hospitals/logout');
  return response.data;
};

export const signupPatientApi = async (payload: SignupPatientPayload) => {
  await instance.post('/api/patients/signup', payload);
};

export const signUpHospitalApi = async (formData: FormData) => {
  const response = await instance.post('/api/hospitals/signup', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getHospitalInfoApi = async (hospitalId: string) => {
  const response = await instance.get(`/api/hospitals/${hospitalId}`);
  return response.data;
};

export const updateHospitalInfoApi = async (formData: FormData) => {
  // ⭐️ [필수] Content-Type을 undefined로 설정해서 기본값을 무효화해야 합니다!
  const response = await instance.patch(`/api/hospitals`, formData, {
    headers: {
      'Content-Type': undefined, // 이 한 줄이 충돌을 막아줍니다.
    },
  });
  return response.data;
};
