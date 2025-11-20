import { format } from "date-fns";
import Topbar from "../layouts/Topbar";
import CalendarDays from "../components/Calendar/CalendarDays";
import CalendarCells from "../components/Calendar/CalendarCells";
import Bottombar from "../layouts/Bottombar";
import DailyRecord from "../components/Calendar/DailyRecord";
import { useEffect, useState } from "react";
import { mockMedicationData, mockMedicalTreatment } from "../mock/MedicationData";
import axios from "axios";

const base_URL = import.meta.env.VITE_API_URL;
const accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzIiwidXNlclR5cGUiOiJwYXRpZW50IiwiaWF0IjoxNzYzNjUxNTA5LCJleHAiOjE3NjM2NjIzMDl9.Pt8lZB0m9sZ-jnuFRnzdAP-aCYENv2jD-g-F2nTNKYo";


export interface MedicalTreatment {
  year: number;
  month: number;
  dates: string[];
}

const Calendar = () => {
    const currentDate = new Date();

    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedDay, setSelectedDay] = useState("");
    const [isClicked, setIsClicked] = useState(false);

    const [calendarMedData, setCalendarMedData] = useState<Record<string, {hasMed: boolean} >>({});
    const [dailyRecordData, setDailyRecordData] = useState<any>(null);
    const [calendarMedTreat, setCalendarMedTreat] = useState<MedicalTreatment | null>(null);

    const fetchDailyRecord = async (date: string) => {
        try {
            const res = await axios.get(
                `${base_URL}/api/patients/medications?date=${date}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        // 'Content-Type': 'application/json'
                    }
                }
            )
            console.log("전송 성공:", res.data);
            setDailyRecordData(res.data.data)
        } catch (error) {
            console.error("날짜별 복약 일정 조회 실패: ", error);
            
        }
    }

    useEffect(() => {
        setCalendarMedData(mockMedicationData);
        setCalendarMedTreat(mockMedicalTreatment);
    }, []);
    
    const onDateClick = (day: Date) => {
        const dateString = format(day, "yyyy-MM-dd");

        setSelectedMonth(format(day, "MM"));
        setSelectedDay(format(day, "dd"));
        setIsClicked(true);
        
        console.log(dateString);
        fetchDailyRecord(dateString);

        //setDailyRecordData(mockDailyRecord);
    }

    return (
        
    <div className="flex flex-col min-h-screen">
        <div className="flex justify-center">
            <Topbar title="진료 기록" />
        </div>
        <div className="flex flex-col mx-5 gap-2">
            <CalendarDays />
            <CalendarCells 
                currentDate={currentDate} 
                onDateClick={onDateClick} 
                selectedMonth={selectedMonth} 
                selectedDay={selectedDay} mode={0}
                calendarMedData = {calendarMedData} 
                calendarMedTreat = {calendarMedTreat}   
            />
            <DailyRecord 
                selectedMonth={selectedMonth} 
                selectedDay={selectedDay} 
                onDateClick={onDateClick} 
                isClicked={isClicked} 
                recordData={dailyRecordData}
                calendarMedTreat = {calendarMedTreat}
            />
        </div>
        
        <div>
            <Bottombar />
        </div>

    </div> 
        
    )
}

export default Calendar;