import axios from 'axios';
import { useAuthStore } from '../hooks/useAuthStore';

export const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (reponse) => reponse,
  (error) => {
    if (error.reponse?.status == 401) {
      console.log('401: 토큰 만료 또는 인증 오류');
    }
    return Promise.reject(error);
  }
);

export default instance;
