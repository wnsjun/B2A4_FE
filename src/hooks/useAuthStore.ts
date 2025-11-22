// src/stores/useAuthStore.ts

import { create } from 'zustand';

// 1. 상태(State)의 타입 정의
interface AuthState {
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

// 2. 액션(Actions)의 타입 정의
interface AuthActions {
  setAccessToken: (token: string) => void;
  setTokens: (accessToken: string, refreshToken: string | null) => void;
  clearAuth: () => void;
}

// 3. Store의 전체 타입 (State + Actions)
type AuthStore = AuthState & AuthActions;

// 4. Store 생성 함수
// StateCreator를 사용하여 명확하게 타입을 지정합니다.
export const useAuthStore = create<AuthStore>((set) => ({
  // State 초기값
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,

  // Actions 구현
  setAccessToken: (token) => set({ accessToken: token }),

  setTokens: (accessToken, refreshToken) => {
    set({
      isLoggedIn: true,
      accessToken,
      refreshToken,
    });
  },

  clearAuth: () => {
    set({
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
    });
  },
}));
