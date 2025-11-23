import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MedicationForm from "../components/Calendar/MedicationForm";
import { fetchDailyRecord } from "../apis/CalendarAPi";

//import { getMedicationDetail } from "../apis/CalendarAPi";

export interface scheduleDetail {
    scheduleId: number;
    period: "morning" | "lunch" | "dinner" | "bedtime" | string;
    time: string;
    enabled: boolean;
}

export interface medProps {
    recordId: number;
    name: string;
    startDate: string;
    endDate: string;
    alarmEnabled: boolean;
    schedules: scheduleDetail[];
    daysOfWeek: string[];
}

const EditSchedule = () => {
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const recordIdStr = searchParams.get('recordId');
    
    const [initialData, setInitialData] = useState<medProps | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!recordIdStr) {
            setIsLoading(false);
            nav(-1);
            return;
        }
        const recordId = parseInt(recordIdStr, 10);

        const fetchDetail = async () => {
            const date = "2025-11-11";
            try {
                const res = await fetchDailyRecord(date);
                const allRecords = res.data;
                console.log(allRecords);
                console.log(recordId);
                const targetRecord = allRecords.find((rec: any) => rec.recordId === recordId);
                console.log(targetRecord);
                if (targetRecord) {
                    setInitialData(targetRecord);
                } else {
                    console.error("복약 일정을 찾을 수 없습니다.");
                    setInitialData(null);
                }
            } catch (error) {
                console.error("복약 일정 로딩 실패 : ", error);
                setInitialData(null);
            } finally {setIsLoading(false)}
        };

        fetchDetail();
    }, [recordIdStr, nav]);

    if (isLoading) {
        return <div>로딩 중...</div>;
    }
    
    // initialData가 null일 경우, 폼 컴포넌트에는 initialData={null}이 전달됩니다.
    // MedicationForm은 이를 감지하여 모든 상태를 빈 값(추가 모드와 동일)으로 초기화합니다.
    return (
        <MedicationForm 
            mode="edit" 
            initialData={initialData} 
            recordId={parseInt(recordIdStr || '0', 10)} 
        />
    );
}

export default EditSchedule;