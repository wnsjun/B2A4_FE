import axiosInstance from '../utils/axiosInstance';

export interface VoiceMessageResponse {
  messageType: string;
  content: string;
  originalVoiceUrl: string;
  createdAt: string;
  success: boolean;
}

export interface CloseChatRoomResponse {
  is_success: boolean;
  message: string;
  data: {
    chatRoomId: number;
    status: 'CLOSED' | string;
    closedAt: string;
    aiSummaryGeneratedAt: string;
  };
}

/**
 * QR 스캔으로 채팅방 생성
 * POST /api/chats/rooms/scan-qr
 */
export const scanQRAndCreateChat = async (doctorId: string, qrCode: string) => {
  try {
    const response = await axiosInstance.post('/chats/rooms/scan-qr', {
      doctorId,
      qrCode,
    });
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to scan QR:', error);
    throw error;
  }
};

/**
 * 음성 메시지 전송 (의사)
 * POST /api/chats/{chatRoomId}/messages/voice
 * 응답: { messageType, content, originalVoiceUrl, createdAt, success }
 */
export const sendVoiceMessage = async (
  chatRoomId: string,
  audioFile: File
): Promise<VoiceMessageResponse> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await axiosInstance.post<VoiceMessageResponse>(
      `/chats/${chatRoomId}/messages/voice`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to send voice message:', error);
    throw error;
  }
};

/**
 * 채팅방 종료
 * POST /api/chats/{chatRoomId}/close
 * 응답: { is_success, message, data: { chatRoomId, status, closedAt, aiSummaryGeneratedAt } }
 */
export const closeChatRoom = async (
  chatRoomId: string
): Promise<CloseChatRoomResponse> => {
  try {
    const response = await axiosInstance.post<CloseChatRoomResponse>(
      `/chats/${chatRoomId}/close`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to close chat room:', error);
    throw error;
  }
};

/**
 * 채팅방 정보 조회
 * GET /api/chats/{chatRoomId}
 */
export const getChatRoom = async (chatRoomId: string) => {
  try {
    const response = await axiosInstance.get(`/chats/${chatRoomId}`);
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to get chat room:', error);
    throw error;
  }
};

/**
 * 채팅 메시지 히스토리 조회
 * GET /api/chats/{chatRoomId}/messages
 */
export const getChatMessages = async (chatRoomId: string) => {
  try {
    const response = await axiosInstance.get(`/chats/${chatRoomId}/messages`);
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to get chat messages:', error);
    throw error;
  }
};

/**
 * 채팅방 요약 조회
 * GET /api/chats/{chatRoomId}/summary
 */
export const getChatSummary = async (chatRoomId: string) => {
  try {
    const response = await axiosInstance.get(`/chats/${chatRoomId}/summary`);
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to get chat summary:', error);
    throw error;
  }
};
