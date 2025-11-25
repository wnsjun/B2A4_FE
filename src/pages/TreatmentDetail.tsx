import { useLocation, useParams } from "react-router-dom";
import Topbar from "../layouts/Topbar";
import { useEffect, useMemo, useState } from "react";
import { fetchAllMessages, fetchTreatmentSum } from "../apis/CalendarAPi";
import type { MedicalTreatment } from "../components/Calendar/DailyRecord";
import aiImg from "../assets/calendar/ai.svg";

interface Message {
    messageId: number;
    senderType: "patient" | "hospital";
    senderId: number;
    messageType: "text" | "voice";
    content: string;
    originalVoiceUrl: string | null;
    createdAt: string;
    roomId: number;
}

interface MessageBubble {
    message: Message;
}

const MessageBubble: React.FC<MessageBubble> = ({ message }) => {
    const isPatient = message.senderType === 'patient';
    const time = message.createdAt.substring(11, 16);
    console.log(isPatient, time);

    const bubbleStyle = isPatient 
        ? "bg-[#3D84FF] text-white rounded-b-[12px] rounded-tl-[12px]" 
        : "bg-[#F4F6F8] text-[#1A1A1A] rounded-b-[12px] rounded-tr-[12px]";

    const bubblePosition = isPatient
        ? "justify-end" 
        : "justify-start";

    return (
        <div className={`flex w-full ${bubblePosition}`}>
            <div className="flex items-end max-w-[80%]">
                <div className={`px-4 py-2 w-fit wrap-break-word max-w-full ${bubbleStyle}`}>
                    {message.content}
                </div>
            </div>
        </div>
    )
}

const TreatmentDetail = () => {
    const location = useLocation();
    const {chatRoomId} = useParams();
    const {medTreatData} = location.state as {medTreatData: MedicalTreatment | null}

    const [treatmentSummary, setTreatmentSummary] = useState(null); 
    const [messages, setMessages] = useState<Message[]>([]);

    const parsedData = useMemo(() => {
        if (!medTreatData) return null;

        const fullDate = medTreatData.startedAt.split('T')[0];
        const [_, month, day] = fullDate.split('-');
        const date = `${month}월 ${day}일`;

        const timeOnly = medTreatData.startedAt.split('T')[1].split('.')[0];
        const [h, m] = timeOnly.split(':');
        const time = `${h}:${m}`;

        return {
            date, time,
            symptom: medTreatData.symptomSummary,
            doctor: medTreatData.doctorName,
            hospital: medTreatData.hospitalName,
            diagnosis: medTreatData.diagnosisSummary,
            doctorImageUrl: medTreatData.doctorImageUrl,
        }
    }, [medTreatData]);
    
    useEffect(() => {
        if (!chatRoomId) {
            return;
        }

        const id = Number(chatRoomId);

        const loadTreatment = async (id: number) => {
         
            try {
                const treatmentSum = await fetchTreatmentSum(id);
                setTreatmentSummary(treatmentSum.data.diagnosisSummary);
            } catch (error) {
                console.log(error);
                setTreatmentSummary(null);
            }
        }

        const loadMessages = async (id: number) => {
    
            try {
                const messages = await fetchAllMessages(id);
                console.log(messages);
                setMessages(messages.data || []);
            } catch (error) {
                console.log(error);
            } 
        }
        loadTreatment(id);
        loadMessages(id);
    }, [chatRoomId, medTreatData]);

    const alpha = 0.1; // 10% 투명도

    const gradientStyle = {
        background: `linear-gradient(to bottom, 
            rgba(12, 88, 255, ${alpha}) 0%, 
            rgba(57, 171, 255, ${alpha}) 89%, 
            rgba(63, 182, 255, ${alpha}) 100%)`,
    };

    return (
        <div className="flex flex-col min-h-screen" style={gradientStyle}>
            <div className="z-10 bg-white sticky top-0">
                <Topbar title="진료 기록 상세" type="header" />

                <div className="flex flex-row w-full py-4 px-5 justify-between z-10 bg-white">
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-row gap-2 text-[#666B76] items-end">
                            <p className="font-semibold text-[16px]">{parsedData?.date}</p>
                            <p className="font-medium text-[12px]">{parsedData?.time}</p>
                        </div>
                        <div className="text-#1A1A1A]">
                            {parsedData?.symptom || "증상 없음"}
                        </div>
                    </div>

                    <div className="flex flex-row gap-2">
                        <div className="flex flex-col items-end gap-1 justify-center">
                            <p className="text-[#666B76]">{parsedData?.hospital}</p>
                            <p className="text-[#1A1A1A] font-medium text-[14px]">{parsedData?.doctor}</p>
                        </div>

                        <div className="w-12 h-12 rounded-full items-center flex justify-center bg-[#F4F6F8]">
                            {parsedData?.doctorImageUrl ? (
                                <img src={parsedData?.doctorImageUrl} alt="profile" className="w-12 h-12 rounded-full object-cover"/>
                            ) : (
                                <img src="/camera.svg" alt="no profile" />
                            )}
                            
                        </div>
                    </div>
                </div>

            </div>
            
            <div className="flex flex-col w-full px-5 flex-1">
                <div className="mt-4 bg-white rounded-xl px-5 py-4 shrink-0 w-[320px] fixed"> 
                    <div className="flex flex-row gap-1 items-center">
                        <img src={aiImg} alt="ai summary" className="w-4 h-4"/>
                        <p className="text-[#666B76] font-semibold text-[14px]">AI 요약</p>
                    </div>
                    <div className="font-semibold text-[14px]">
                        {treatmentSummary ? (
                            <p>{treatmentSummary}</p>
                        ) : (
                            <p>AI 요약이 없습니다.</p>
                        )}
                    </div>

                </div>

                <div className="flex-1 overflow-y-auto mt-[110px]"> 
                    <div className="flex flex-col gap-4"> 
                        {messages.length > 0 ? (
                            messages.map((message) => (
                                <MessageBubble 
                                    key={message.messageId}
                                    message={message} 
                                />
                            ))
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                메시지 기록이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
                
            </div>
        </div>
    )
}

export default TreatmentDetail;