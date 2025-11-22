import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MedicationForm from "../components/Calendar/MedicationForm";

//import { getMedicationDetail } from "../apis/CalendarAPi";

export interface scheduleDetail {
    period: "morning" | "lunch" | "dinner" | "bedtime" | string;
    time: string;
    enabled: boolean;
}

export interface medProps {
    name: string;
    startDate: string;
    endDate: string;
    alarmEnabled: boolean;
    schedules: scheduleDetail[];
    daysOfWeek: string[];
}

const EditSchedule = () => {
    const [searchParams] = useSearchParams();
    const recordId = searchParams.get('recordId');
    const [initialData, setInitialData] = useState<medProps | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!recordId) {
            setIsLoading(false);
            return;
        }

        const fetchDetail = async () => {
            // 🚨 API 호출 로직은 여기에 위치합니다.
            // try {
            //     const data = await getMedicationDetail(recordId); 
            //     setInitialData(data.data); 
            // } catch (error) {
            //     console.error("데이터 로딩 실패", error);
            // } finally {
                setInitialData(null); // API 호출 대신 임시로 null 설정
                setIsLoading(false);
            //}
        };

        fetchDetail();
    }, [recordId]);

    if (isLoading) {
        return <div>로딩 중...</div>;
    }
    
    // initialData가 null일 경우, 폼 컴포넌트에는 initialData={null}이 전달됩니다.
    // MedicationForm은 이를 감지하여 모든 상태를 빈 값(추가 모드와 동일)으로 초기화합니다.
    return (
        <MedicationForm 
            mode="edit" 
            initialData={initialData} 
            recordId={9} 
        />
    );
}

export default EditSchedule;