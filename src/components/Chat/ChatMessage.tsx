import React from 'react';
import type { ChatMessage as ChatMessageType } from '../../hooks/useChatStore';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-[#666B76] text-white px-4 py-2 rounded-full text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* 메시지 내용 */}
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isOwnMessage
            ? 'bg-[#5B9EFF] text-white rounded-br-none'
            : 'bg-[#E8EAED] text-[#1A1A1A] rounded-bl-none'
        }`}
      >
        <p className="break-words text-sm">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-blue-200' : 'text-[#999]'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
