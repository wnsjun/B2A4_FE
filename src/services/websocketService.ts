// @ts-ignore - stompjs doesn't have type definitions
import Stomp from 'stompjs';
import { useChatStore } from '../hooks/useChatStore';
import type { ChatMessage } from '../hooks/useChatStore';

export interface WebSocketConfig {
  url: string;
  accessToken: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StompClient = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StompMessage = any;

class WebSocketService {
  private stompClient: StompClient | null = null;
  private subscriptions: Map<string, StompClient> = new Map();
  private subscriptionCallbacks: Map<string, (message: StompMessage) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000; // 시작: 3초
  private maxReconnectDelay = 30000; // 최대: 30초
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManuallyDisconnected = false;

  /**
   * WebSocket (STOMP) 연결 초기화
   */
  connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.stompClient = Stomp.client(config.url);
        this.stompClient.debug = () => {}; // 디버그 로그 비활성화

        // stompjs v2.3.3 방식: connect(connectHeaders, connectCallback, errorCallback)
        this.stompClient.connect(
          {
            Authorization: `Bearer ${config.accessToken}`,
            'heart-beat': '60000,60000', // 클라이언트→서버: 60초, 서버→클라이언트: 60초 (연결 유지용)
          }, // connectHeaders
          () => {
            // onConnect callback
            console.log('[WebSocket] Connected');
            this.reconnectAttempts = 0; // 재연결 카운트 리셋
            this.reconnectDelay = 3000; // 재연결 딜레이 리셋
            useChatStore.getState().setConnected(true);

            // 재연결 후 원래의 구독들을 다시 설정
            this.resubscribeAll();

            resolve();
          },
          (error: StompMessage) => {
            // onError callback
            // 사용자가 명시적으로 연결 해제한 경우는 에러 로그를 남기지 않음
            if (!this.isManuallyDisconnected) {
              console.error('[WebSocket] Connection error:', error);
            }
            useChatStore.getState().setConnected(false);

            // 사용자가 명시적으로 연결 해제한 경우는 재연결 안 함
            if (this.isManuallyDisconnected) {
              reject(error);
              return;
            }

            // 자동 재연결 시도
            this.attemptReconnect(config, resolve, reject);
          }
        );
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * 자동 재연결 시도
   */
  private attemptReconnect(
    config: WebSocketConfig,
    resolve: () => void,
    reject: (error: unknown) => void
  ): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `[WebSocket] Max reconnect attempts (${this.maxReconnectAttempts}) reached`
      );
      reject(new Error('Max reconnect attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect(config).then(resolve).catch(() => {
        // 재연결 실패 시 다시 시도 (attemptReconnect가 자동으로 호출됨)
      });
    }, this.reconnectDelay);

    // 다음 재연결 시간을 2배로 증가 (지수 백오프)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  /**
   * 의사용: 초기 연결 + /sub/doctors/{doctorId} 구독
   */
  connectAsDoctor(config: WebSocketConfig, doctorId: string): Promise<void> {
    return this.connect(config).then(() => {
      this.subscribe(`/sub/doctors/${doctorId}`, (message) => {
        console.log('[WebSocket] New room notification:', message);
        // 새 채팅방 알림 처리
        const body = JSON.parse(message.body);
        if (body.id) {
          // 의사가 자동으로 채팅방 구독
          this.subscribe(`/sub/chats/${body.id}/messages`, (chatMessage) => {
            this.handleChatMessage(chatMessage);
          });
        }
      });
    });
  }

  /**
   * 환자용: 초기 연결
   */
  connectAsPatient(config: WebSocketConfig): Promise<void> {
    return this.connect(config);
  }

  /**
   * 주제 구독
   */
  subscribe(
    topic: string,
    callback?: (message: StompMessage) => void
  ): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('[WebSocket] STOMP client not connected');
      return;
    }

    // 콜백 함수가 있으면 항상 업데이트 (재연결 시에도 최신 콜백 반영)
    if (callback) {
      this.subscriptionCallbacks.set(topic, callback);
    }

    // 이미 구독된 topic이면 기존 구독은 유지하고 콜백만 업데이트
    if (this.subscriptions.has(topic)) {
      console.log(`[WebSocket] Already subscribed to ${topic}, callback updated`);
      return;
    }

    const subscription = this.stompClient.subscribe(
      topic,
      (message: StompMessage) => {
        console.log(`[WebSocket] Message received from ${topic}:`, message);

        // 항상 최신 콜백 사용
        const latestCallback = this.subscriptionCallbacks.get(topic);
        if (latestCallback) {
          latestCallback(message);
        } else {
          this.handleChatMessage(message);
        }
      }
    );

    this.subscriptions.set(topic, subscription);
    console.log(`[WebSocket] Subscribed to ${topic}`);
  }

  /**
   * 재연결 후 모든 구독 다시 설정
   */
  private resubscribeAll(): void {
    console.log('[WebSocket] Resubscribing to all topics...');

    // 이미 구독된 것들을 다시 구독하되, 약간의 딜레이를 두어 CONNECTING 상태 회피
    let delayMs = 100;
    this.subscriptionCallbacks.forEach((callback, topic) => {
      setTimeout(() => {
        // 이미 구독되어 있으면 skip
        if (this.subscriptions.has(topic)) {
          console.log(`[WebSocket] Already subscribed to ${topic}, skipping resubscribe`);
          return;
        }

        if (!this.stompClient || !this.stompClient.connected) {
          console.warn(`[WebSocket] Client not connected, cannot resubscribe to ${topic}`);
          return;
        }

        try {
          const subscription = this.stompClient.subscribe(
            topic,
            (message: StompMessage) => {
              console.log(`[WebSocket] Message received from ${topic}:`, message);
              callback(message);
            }
          );

          if (subscription) {
            this.subscriptions.set(topic, subscription);
            console.log(`[WebSocket] Resubscribed to ${topic}`);
          }
        } catch (error) {
          console.error(`[WebSocket] Failed to resubscribe to ${topic}:`, error);
        }
      }, delayMs);

      delayMs += 100; // 각 구독 마다 100ms씩 지연
    });
  }

  /**
   * 주제 구독 해제
   */
  unsubscribe(topic: string): void {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      this.subscriptionCallbacks.delete(topic);
      console.log(`[WebSocket] Unsubscribed from ${topic}`);
    }
  }

  /**
   * 텍스트 메시지 전송 (환자 또는 의사)
   * 경로: /pub/chats/{chatRoomId}/send
   *
   * 요청 형식:
   * {
   *   "message": "전송할 텍스트"
   * }
   */
  sendChatMessage(chatRoomId: string, messageText: string): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('[WebSocket] STOMP client not connected');
      return;
    }

    const payload = {
      message: messageText,
    };

    this.stompClient.send(
      `/pub/chats/${chatRoomId}/send`,
      {},
      JSON.stringify(payload)
    );

    console.log(`[WebSocket] Message sent to ${chatRoomId}:`, messageText);
  }

  /**
   * 채팅 메시지 처리
   *
   * 예상 메시지 형식:
   * {
   *   "type": "message" | "voice" | "system",
   *   "senderId": "userId",
   *   "content": "메시지 내용",
   *   "timestamp": "ISO 시간",
   *   "id": "messageId",
   *   "action": "closed" (시스템 메시지)
   * }
   */
  private handleChatMessage(message: StompMessage): void {
    try {
      console.log('[WebSocket] handleChatMessage called with:', message.body);
      const body = JSON.parse(message.body);
      console.log('[WebSocket] Parsed body:', body);

      // 텍스트/음성 메시지 처리 (type 또는 messageType 필드 확인)
      const messageType = body.type || body.messageType;
      if (messageType === 'message' || messageType === 'text' || messageType === 'voice') {
        console.log('[WebSocket] Adding chat message...');
        const chatStore = useChatStore.getState();
        const chatMessage: ChatMessage = {
          id: body.id || body.messageId || `${Date.now()}`,
          senderId: String(body.senderId || body.userId || 'unknown'),
          type: messageType === 'voice' ? 'voice' : 'text',
          content: body.content || '',
          timestamp: body.timestamp || body.createdAt || new Date().toISOString(),
        };
        chatStore.addMessage(chatMessage);
        console.log('[WebSocket] Message added:', chatMessage);
      }

      // 시스템 메시지 처리
      if (body.type === 'system') {
        const chatStore = useChatStore.getState();
        const systemMessage: ChatMessage = {
          id: body.id || body.messageId || `${Date.now()}`,
          senderId: 'system',
          type: 'system',
          content: body.content || '',
          timestamp: body.timestamp || body.createdAt || new Date().toISOString(),
          action: body.action,
        };
        chatStore.addMessage(systemMessage);
        console.log('[WebSocket] System message:', systemMessage);

        if (body.action === 'closed') {
          chatStore.closeChatRoom();
        }
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error, message.body);
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.stompClient !== null && this.stompClient.connected;
  }

  /**
   * 연결 해제
   */
  disconnect(): void {
    // 재연결 시도 중지
    this.isManuallyDisconnected = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 모든 구독 해제
    this.subscriptions.forEach((subscription) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('[WebSocket] Error unsubscribing:', error);
      }
    });
    this.subscriptions.clear();
    this.subscriptionCallbacks.clear();

    // 연결 해제
    if (this.stompClient) {
      try {
        if (this.stompClient.connected) {
          this.stompClient.disconnect(() => {
            console.log('[WebSocket] Disconnected gracefully');
          });
        }
      } catch (error) {
        console.error('[WebSocket] Error during disconnect:', error);
      }
      this.stompClient = null;
    }

    useChatStore.getState().setConnected(false);
    console.log('[WebSocket] Disconnected');
  }
}

export const wsService = new WebSocketService();
