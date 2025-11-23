// @ts-ignore - stompjs doesn't have type definitions
import * as StompJs from 'stompjs';
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
  private reconnectDelay = 3000;

  /**
   * WebSocket (STOMP) 연결 초기화
   */
  connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.stompClient = new StompJs.Client({
          brokerURL: config.url,
          connectHeaders: {
            Authorization: `Bearer ${config.accessToken}`,
          },
          debug: (str: string) => {
            console.log('[STOMP]', str);
          },
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.stompClient.onConnect = () => {
          console.log('[WebSocket] Connected');
          useChatStore.getState().setConnected(true);
          resolve();
        };

        this.stompClient.onDisconnect = () => {
          console.log('[WebSocket] Disconnected');
          useChatStore.getState().setConnected(false);
        };

        this.stompClient.onStompError = (frame: StompMessage) => {
          console.error('[WebSocket] STOMP Error:', frame.headers, frame.body);
          reject(new Error(`STOMP error: ${frame.body}`));
        };

        this.stompClient.activate();
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
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

    const subscription = this.stompClient.subscribe(
      topic,
      (message: StompMessage) => {
        console.log(`[WebSocket] Message received from ${topic}:`, message);

        if (callback) {
          callback(message);
        } else {
          this.handleChatMessage(message);
        }
      }
    );

    this.subscriptions.set(topic, subscription);
    console.log(`[WebSocket] Subscribed to ${topic}`);
  }

  /**
   * 주제 구독 해제
   */
  unsubscribe(topic: string): void {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
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

    this.stompClient.publish({
      destination: `/pub/chats/${chatRoomId}/send`,
      body: JSON.stringify(payload),
    });

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
      const body = JSON.parse(message.body);

      // 텍스트/음성 메시지 처리
      if (body.type === 'message' || body.type === 'text' || body.type === 'voice') {
        const chatStore = useChatStore.getState();
        const chatMessage: ChatMessage = {
          id: body.id || `${Date.now()}`,
          senderId: body.senderId || body.userId || 'unknown',
          type: body.type === 'voice' ? 'voice' : 'text',
          content: body.content || '',
          timestamp: body.timestamp || new Date().toISOString(),
        };
        chatStore.addMessage(chatMessage);
        console.log('[WebSocket] Message added:', chatMessage);
      }

      // 시스템 메시지 처리
      if (body.type === 'system') {
        const chatStore = useChatStore.getState();
        const systemMessage: ChatMessage = {
          id: body.id || `${Date.now()}`,
          senderId: 'system',
          type: 'system',
          content: body.content || '',
          timestamp: body.timestamp || new Date().toISOString(),
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
    // 모든 구독 해제
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    // 연결 해제
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }

    useChatStore.getState().setConnected(false);
    console.log('[WebSocket] Disconnected');
  }
}

export const wsService = new WebSocketService();
