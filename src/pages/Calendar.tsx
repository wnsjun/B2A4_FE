import { format } from "date-fns";
import Topbar from "../layouts/Topbar";
import CalendarDays from "../components/Calendar/CalendarDays";
import CalendarCells from "../components/Calendar/CalendarCells";
import Bottombar from "../layouts/Bottombar";
import DailyRecord from "../components/Calendar/DailyRecord";
import { useEffect, useState } from "react";
import { mockMedicationData, mockDailyRecord, mockMedicalTreatment } from "../mock/MedicationData";

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

    useEffect(() => {
        setCalendarMedData(mockMedicationData);
        setCalendarMedTreat(mockMedicalTreatment);
    }, []);
    
    const onDateClick = (day: Date) => {
        //const dateString = format(day, "yyyy-MM-dd");

        setSelectedMonth(format(day, "MM"));
        setSelectedDay(format(day, "dd"));
        setIsClicked(true);

        

        setDailyRecordData(mockDailyRecord);
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