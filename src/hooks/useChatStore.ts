import { create } from 'zustand';

// 사전질문 선택 타입
export interface PreQuestionAnswers {
  symptom: string | null; // '아파요', '어지러워요', '기타'
  duration: string | null; // '오늘', '며칠 전', '오래 전'
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  senderId: string; // 의사 ID 또는 환자 ID
  type: 'text' | 'voice' | 'system'; // 메시지 타입
  content: string; // 텍스트 내용
  timestamp: string;
  action?: string; // 시스템 메시지의 액션 (closed 등)
}

// 채팅 상태 타입
export interface ChatState {
  // 사전질문 답변
  preQuestionAnswers: PreQuestionAnswers;

  // 채팅 정보
  chatRoomId: string | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isChatClosed: boolean;

  // 사용자 정보
  userId: string | null;
  userRole: 'patient' | 'doctor' | null; // 환자 또는 의사
  doctorId: string | null;

  // 환자/의사 정보
  patientName: string | null;
  doctorName: string | null;
  appointmentTime: string | null; // ISO 형식의 시간 문자열

  // 상태 업데이트 함수들
  setPreQuestion1: (symptom: string) => void;
  setPreQuestion2: (duration: string) => void;
  clearPreQuestionAnswers: () => void;

  setChatRoom: (chatRoomId: string, userRole: 'patient' | 'doctor', userId: string) => void;
  setDoctorId: (doctorId: string) => void;
  setChatRoomInfo: (patientName?: string, doctorName?: string, appointmentTime?: string) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;

  setConnected: (connected: boolean) => void;
  closeChatRoom: () => void;
  clearChatRoom: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // 초기 상태
  preQuestionAnswers: {
    symptom: null,
    duration: null,
  },

  chatRoomId: null,
  messages: [],
  isConnected: false,
  isChatClosed: false,

  userId: null,
  userRole: null,
  doctorId: null,

  patientName: null,
  doctorName: null,
  appointmentTime: null,

  // 사전질문 관련 함수
  setPreQuestion1: (symptom) =>
    set((state) => ({
      preQuestionAnswers: {
        ...state.preQuestionAnswers,
        symptom,
      },
    })),

  setPreQuestion2: (duration) =>
    set((state) => ({
      preQuestionAnswers: {
        ...state.preQuestionAnswers,
        duration,
      },
    })),

  clearPreQuestionAnswers: () =>
    set({
      preQuestionAnswers: {
        symptom: null,
        duration: null,
      },
    }),

  // 채팅 관련 함수
  setChatRoom: (chatRoomId, userRole, userId) =>
    set({
      chatRoomId,
      userRole,
      userId,
      isChatClosed: false,
      messages: [],
    }),

  setDoctorId: (doctorId) =>
    set({ doctorId }),

  setChatRoomInfo: (patientName, doctorName, appointmentTime) =>
    set({
      ...(patientName !== undefined && { patientName }),
      ...(doctorName !== undefined && { doctorName }),
      ...(appointmentTime !== undefined && { appointmentTime }),
    }),

  addMessage: (message) =>
    set((state) => {
      const updatedMessages = [...state.messages, message];
      // localStorage에 메시지 저장
      if (state.chatRoomId) {
        localStorage.setItem(`chat_${state.chatRoomId}`, JSON.stringify(updatedMessages));
      }
      return { messages: updatedMessages };
    }),

  setMessages: (messages) => {
    set((state) => {
      // localStorage에 메시지 저장
      if (state.chatRoomId) {
        localStorage.setItem(`chat_${state.chatRoomId}`, JSON.stringify(messages));
      }
      return { messages };
    });
  },

  clearMessages: () =>
    set({ messages: [] }),

  setConnected: (connected) =>
    set({ isConnected: connected }),

  closeChatRoom: () =>
    set({ isChatClosed: true }),

  clearChatRoom: () =>
    set({
      chatRoomId: null,
      messages: [],
      isConnected: false,
      isChatClosed: false,
      userId: null,
      userRole: null,
      doctorId: null,
      patientName: null,
      doctorName: null,
      appointmentTime: null,
      preQuestionAnswers: {
        symptom: null,
        duration: null,
      },
    }),
}));
