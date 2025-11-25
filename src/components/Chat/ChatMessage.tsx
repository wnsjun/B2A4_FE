import React from 'react';
import type { ChatMessage as ChatMessageType } from '../../hooks/useChatStore';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
  userRole?: 'patient' | 'doctor';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage, userRole = 'patient' }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 텍스트를 지정된 글자 수마다 줄바꿈
  const splitTextByLength = (text: string, charLimit: number): string[] => {
    const result: string[] = [];
    for (let i = 0; i < text.length; i += charLimit) {
      result.push(text.substring(i, i + charLimit));
    }
    return result;
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-[#5A6270] text-[#B0B5BC] px-4 py-2 rounded-full text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  // userRole과 isOwnMessage에 따른 스타일 결정
  const getMessageStyle = () => {
    if (userRole === 'patient') {
      // 환자 채팅방
      if (isOwnMessage) {
        // 환자가 보내는 메시지
        return {
          borderRadius: '12px 0 12px 12px',
          background: '#3D84FF',
          color: '#FFF',
          padding: '8px 16px',
          minHeight: '37px',
          fontSize: '14px',
          fontWeight: '500',
          lineHeight: '150%',
          letterSpacing: '-0.28px',
          charLimit: 25,
        };
      } else {
        // 의사가 보내는 메시지
        return {
          borderRadius: '12px 0 12px 12px',
          background: '#FFFFFF',
          color: '#1A1A1A',
          padding: '8px 16px',
          minHeight: '37px',
          fontSize: '14px',
          fontWeight: '500',
          lineHeight: '150%',
          letterSpacing: '-0.28px',
          charLimit: 25,
        };
      }
    } else {
      // 의사 채팅방
      if (isOwnMessage) {
        // 의사가 보내는 메시지
        return {
          borderRadius: '24px 0 24px 24px',
          background: '#3D84FF',
          color: '#FFF',
          padding: '24px 48px',
          minHeight: '96px',
          fontSize: '32px',
          fontWeight: '600',
          lineHeight: '150%',
          letterSpacing: '-0.64px',
          charLimit: 30,
        };
      } else {
        // 환자가 보내는 메시지
        return {
          borderRadius: '0 24px 24px 24px',
          background: '#F4F6F8',
          color: '#1A1A1A',
          padding: '24px 48px',
          minHeight: '96px',
          fontSize: '32px',
          fontWeight: '600',
          lineHeight: '150%',
          letterSpacing: '-0.64px',
          charLimit: 30,
        };
      }
    }
  };

  const messageStyle = getMessageStyle();
  const textLines = splitTextByLength(message.content, messageStyle.charLimit);

  return (
    <div
      className={`flex gap-2 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* 메시지 내용 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: messageStyle.padding,
            gap: '10px',
            borderRadius: messageStyle.borderRadius,
            background: messageStyle.background,
            color: messageStyle.color,
            fontFamily: userRole === 'patient' ? 'Pretendard' : 'Inter',
            fontSize: messageStyle.fontSize,
            fontWeight: messageStyle.fontWeight,
            lineHeight: messageStyle.lineHeight,
            letterSpacing: messageStyle.letterSpacing,
            width: 'fit-content',
            maxWidth: userRole === 'patient' ? 'none' : '720px',
            minHeight: messageStyle.minHeight,
            whiteSpace: userRole === 'patient' ? 'nowrap' : 'normal',
          }}
        >
          {textLines.map((line, index) => (
            <p key={index} style={{ margin: 0, wordBreak: 'break-word' }}>
              {line}
            </p>
          ))}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: userRole === 'patient' ? '11px' : '14px',
            color: '#7A8090',
            textAlign: isOwnMessage ? 'right' : 'left',
            paddingRight: isOwnMessage ? (userRole === 'patient' ? '16px' : '48px') : '0',
            paddingLeft: isOwnMessage ? '0' : (userRole === 'patient' ? '16px' : '48px'),
          }}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
