import React from 'react';
import { useChatStore } from '../../hooks/useChatStore';
import { wsService } from '../../services/websocketService';

interface PreQuestionPanelProps {
  chatRoomId: string;
}

const PreQuestionPanel: React.FC<PreQuestionPanelProps> = ({ chatRoomId }) => {
  const { preQuestionAnswers } = useChatStore();

  // 사전질문 답변 조합으로 메시지 생성
  const generatePreQuestionMessage = (): string => {
    const { symptom, duration } = preQuestionAnswers;

    if (!symptom || !duration) {
      return '';
    }

    // 증상 + 기간 조합으로 메시지 생성
    const durationMap: Record<string, string> = {
      오늘: '오늘부터',
      '며칠 전': '며칠 전부터',
      '오래 전': '오래 전부터',
    };

    const symptomMap: Record<string, string> = {
      아파요: '아파요',
      어지러워요: '어지러워요',
      기타: '기타 증상이 있어요',
    };

    const durationText = durationMap[duration] || duration;
    const symptomText = symptomMap[symptom] || symptom;

    return `${durationText} ${symptomText}`;
  };

  const handleSendPreQuestion = () => {
    const message = generatePreQuestionMessage();
    if (message && chatRoomId) {
      wsService.sendChatMessage(chatRoomId, message);
    }
  };

  const message = generatePreQuestionMessage();

  if (!message) {
    return null;
  }

  return (
    <div className="bg-[#F5F5F5] border-t border-[#E8EAED] p-4">
      <p className="text-sm text-[#666B76] mb-3">사전응답 보내기</p>
      <div className="flex gap-2">
        <div className="flex-1 bg-white border border-[#E8EAED] rounded-lg px-4 py-3">
          <p className="text-[#1A1A1A] text-sm">{message}</p>
        </div>
        <button
          onClick={handleSendPreQuestion}
          className="px-4 py-3 bg-[#5B9EFF] text-white rounded-lg font-medium hover:bg-[#4A8AE8] transition-colors"
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default PreQuestionPanel;
