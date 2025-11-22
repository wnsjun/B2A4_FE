import { format } from "date-fns";
import Topbar from "../layouts/Topbar";
import CalendarDays from "../components/Calendar/CalendarDays";
import CalendarCells from "../components/Calendar/CalendarCells";
import Bottombar from "../layouts/Bottombar";
import DailyRecord from "../components/Calendar/DailyRecord";
import { useEffect, useState } from "react";
//import { mockMedicationData, mockMedicalTreatment } from "../mock/MedicationData";
import { fetchAllTreatment, fetchDailyRecord, fetchDailyTreatment } from "../apis/CalendarAPi";


export interface MedicalTreatment {
  year: number;
  month: number;
  dates: string[];
}

const Calendar = () => {
    const currentDate = new Date();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedDay, setSelectedDay] = useState("");
    const [isClicked, setIsClicked] = useState(false);

    const [calendarMedData, setCalendarMedData] = useState<Record<string, {hasMed: boolean} >>({});
    const [calendarMedTreat, setCalendarMedTreat] = useState<MedicalTreatment | null>(null);
    const [dailyRecordData, setDailyRecordData] = useState<any>(null);
    const [dailyTreatmentData, setDailyTreatmentData] = useState<any>(null);

    const loadDailyRecord = async (date: string) => {
        
        try {
            const data = await fetchDailyRecord(date);
            const treatment = await fetchDailyTreatment(date);
            setDailyRecordData(data.data);
            setDailyTreatmentData(treatment.data);
            
        } catch (error) {
            console.error("복약 일정 데이터 로드 중 오류: ", error);
            setDailyRecordData(null);
            setDailyTreatmentData(null);
        }
    }


    useEffect(() => {
        const yearstr = currentYear.toString();
        const monthstr = (currentMonth + 1).toString();
        const loadAllTreatment = async (year: string, month: string) => {
            try {
                const allTreatment = await fetchAllTreatment(year, month);
                //console.log(allTreatment.data.dates);
                setCalendarMedTreat(allTreatment.data);
                setCalendarMedData({});
            } catch (error) {
                console.log("error", error);
                setCalendarMedTreat(null);
            }
        }
        loadAllTreatment(yearstr, monthstr);
    }, []);
    
    const onDateClick = (day: Date) => {
        const dateString = format(day, "yyyy-MM-dd");

        setSelectedMonth(format(day, "MM"));
        setSelectedDay(format(day, "dd"));
        setIsClicked(true);
        
        console.log(dateString);
        loadDailyRecord(dateString);
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
                medTreatData = {dailyTreatmentData}
            />
        </div>
        
        <div>
            <Bottombar />
        </div>

    </div> 
        
    )
}

export default Calendar;