import { useState } from "react";
import Topbar from "../../layouts/Topbar";
import { Icon } from "@iconify/react";
import Button from "../Button";
import BottomSheet from "../Calendar/BottomSheet";
import checkImg from "../../assets/calendar/check.svg";
import defaultImg from "../../assets/calendar/check_default.svg";
import CalendarModal from "../Calendar/CalendarModal";
import TimeModal from "../Calendar/TimeModal";
import { useNavigate } from "react-router-dom";
import { postMedication } from "../../apis/CalendarAPi";

// 요일(MON, TUE 등) 배열을 체크박스(boolean) 배열로 변환
const convertDaysToState = (days: string[]): boolean[] => {
  const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  return dayLabels.map(label => days.includes(label));
}

// 복용 시간(morning, lunch 등)을 체크박스(boolean) 배열로 변환
const convertPeriodsToState = (schedules: scheduleDetail[]): boolean[] => {
  const periodLabels = ["morning", "lunch", "dinner", "bedtime"];
  return periodLabels.map(period => schedules.some(s => s.period === period && s.enabled));
}

// API 시간 형식("HH:MM")을 UI 표시 형식("H : MM A/PM")으로 변환
const convertTimesToState = (schedules: scheduleDetail[]): string[] => {
  const periodLabels = ["morning", "lunch", "dinner", "bedtime"];
  return periodLabels.map(period => {
    const schedule = schedules.find(s => s.period === period && s.enabled);
    if (schedule) {
      const [hourStr, minuteStr] = schedule.time.split(":");
      let hour = parseInt(hourStr, 10);
      const minute = minuteStr;
      let ampm = "AM";
      
      if (hour >= 12) {
        ampm = "PM";
        if (hour > 12) hour -= 12;
      } else if (hour === 0) {
        hour = 12; 
      }

      const formattedMinute = minute.padStart(2, '0');
      return `${hour} : ${formattedMinute} ${ampm}`;
    }
    return "";
  });
}

// 날짜 문자열("YYYY-MM-DD")에서 월과 일만 추출
const getMonthDayFromDate = (date: string | null): { month: string, day: string } => {
    if (!date) return { month: "", day: "" };
    const parts = date.split('-');
    return { month: parts[1] || "", day: parts[2] || "" };
}

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

interface MedicationFormProps {
    mode: 'add' | 'edit';
    initialData?: medProps | null;
    recordId?: number;
}

const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const periodLabels = ["morning", "lunch", "dinner", "bedtime"];

const MedicationForm = ({mode, initialData, recordId} : MedicationFormProps) => {
    const nav = useNavigate();
    
    const initialStart = getMonthDayFromDate(initialData?.startDate || null);
    const initialEnd = getMonthDayFromDate(initialData?.endDate || null);

    const [medName, setMedName] = useState(initialData?.name || "");
    const [notify, setNotify] = useState(initialData?.alarmEnabled ?? true); // 수정 데이터가 없으면 기본값 true

    const initialSchedules = initialData?.schedules || [];
    const initialDays = initialData?.daysOfWeek || [];

    const [isChecked, setIsChecked] = useState(convertPeriodsToState(initialSchedules));
    const [dayCheck, setDayCheck] = useState(convertDaysToState(initialDays));
    const [selectedTimes, setSelectedTimes] = useState(convertTimesToState(initialSchedules));

    const [isCalendarOpen, setIsCalendarOpen] = useState([false, false]);
    const [isDateSelected, setIsDateSelected] = useState(false);
    const [startMonth, setStartMonth] = useState(initialStart.month);
    const [startDay, setStartDay] = useState(initialStart.day);
    const [endMonth, setEndMonth] = useState(initialEnd.month);
    const [endDay, setEndDay] = useState(initialEnd.day);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const onClickCheck = (index: number) => () => {
        const newChecked = [...isChecked];
        newChecked[index] = !newChecked[index];
        setIsChecked(newChecked);

        if (!isChecked[index]) {
            setSelectedIndex(index);
            setIsTimeModalOpen(true);
        } else {
            const newSelectedTimes = [...selectedTimes];
            newSelectedTimes[index] = "";
            setSelectedTimes(newSelectedTimes);
        }
    }
    const onDayCheck = (index: number) => () => {
        const newChecked = [...dayCheck];
        newChecked[index] = !newChecked[index];
        setDayCheck(newChecked);
    }

    const onClickCalendar = (index: number) => () => {
        const newCalendarCheck = [false, false]; 
        newCalendarCheck[index] = !isCalendarOpen[index];
        setIsCalendarOpen(newCalendarCheck);

        if (newCalendarCheck[index]) {
            setIsDateSelected(false);
        }
        
    }

    const handleSelectedDate = (childMonth: string, childDay: string) => {
        if (isCalendarOpen[0]) {
            setStartMonth(childMonth);
            setStartDay(childDay);
        } else if (isCalendarOpen[1]) {
            setEndMonth(childMonth);
            setEndDay(childDay);
        }
    }

    const handleSelectionChange = (hasSelected: boolean) => {
        setIsDateSelected(hasSelected);
    }
    
    const exitModal = () => {
        setIsCalendarOpen([false, false]);
        setIsTimeModalOpen(false);
    }

    const formatDate = (month: string, day: string, dafaultText: string) => {
        return month && day ? `${month}월 ${day}일` : dafaultText;
    
    }

    const handleTimeChange = (time: {
        hour: string;
        minute: string;
        period: string
    }) => {
        if (selectedIndex === null) return;
        const newTimes = [...selectedTimes];
        newTimes[selectedIndex] = `${time.hour} : ${time.minute} ${time.period}`;
        setSelectedTimes(newTimes);
    }

    const getSelectedTime = (index: number) => {
        return selectedTimes[index] ? selectedTimes[index] : "시간을 선택하세요";
    }

    const handleSubmit = async () => {
        const daysOfWeek: string[] =
            dayCheck.map((checked, i) => checked ? dayLabels[i] : null)
            .filter((day): day is string => day !== null);
        
        const currentYear = new Date().getFullYear();
        const formatToAPIDate = (month: string, day: string) => {
            if (!month || !day) return "";
            const m = month.padStart(2, '0');
            const d = day.padStart(2, '0');
            return `${currentYear}-${m}-${d}`;
        };
        const startDate = formatToAPIDate(startMonth, startDay);
        const endDate = formatToAPIDate(endMonth, endDay);

        const schedules: scheduleDetail[] = 
            isChecked.map((checked, i) => {
                if (checked && selectedTimes[i]) {
                    const splitStr = selectedTimes[i].split(" ");
                    const timeStr = splitStr[0];
                    const minuteStr = splitStr[2];
                    const dn = splitStr[3];
                    let hour = parseInt(timeStr, 10);
                    if (dn === "PM" && hour !== 12) {
                        hour += 12;
                    } else if (dn === "AM" && hour === 12) {
                        hour = 0;
                    }
                    const hourStr = hour.toString().padStart(2, '0');
                    const time = `${hourStr}:${minuteStr}`
                    const period = periodLabels[i];

                    return {
                        period: period,
                        time: time,
                        enabled: true

                    }
                }
                return null;
            })
            .filter((schedule): schedule is scheduleDetail => schedule !== null);

        const finalData: medProps = {
            name: medName.trim(),
            startDate: startDate,
            endDate: endDate,
            alarmEnabled: notify,
            daysOfWeek: daysOfWeek,
            schedules: schedules,
        }
        
        try {
            if (mode === 'add') {
                await postMedication(finalData); 
                console.log("일정 등록이 완료되었습니다. (추가 모드)");
            } else if (mode === 'edit' && recordId) {
                // await putMedication(recordId, finalData); 
                console.log(`일정 ${recordId} 수정이 완료되었습니다. (수정 모드)`);
            }
            nav("/medical-records");

        } catch (error) {
            alert(mode === 'add' ? "일정 등록에 실패했습니다." : "일정 수정에 실패했습니다.");
            console.error(error);
        }
    }

    const isFormValid =
        medName.trim() !== "" && 
        dayCheck.some(Boolean) && 
        startMonth && startDay && 
        endMonth && endDay && 
        isChecked.some((_, i) => isChecked[i] && selectedTimes[i] !== "");

    const buttonLabel = mode === 'add' ? '등록' : '수정 완료';
    const formTitle = mode === 'add' ? '복약 일정 추가' : '복약 일정 수정';

    return (
        <>
        <div className="flex flex-col min-h-screen items-center px-5">
            <div className="fixed items-center"> 
                <Topbar title={formTitle}/> 
                <div>
                    <img src="/goback.svg" alt="prev" className="fixed top-3.5 cursor-pointer" onClick={() => nav(-1)}/>
                </div>
            </div>
            
            <form className="flex flex-col w-full gap-8 mt-[70px]">
                {mode === "add" ? (
                <div className="flex flex-col">
                    <p>약 이름</p>
                    <input 
                        type="text" 
                        placeholder="약 이름을 입력하세요" 
                        className="h-12 border border-b-[#A9ACB2] border-t-0 border-x-0 pl-2"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                    />
                </div>
                ) : (<></>)}

                <div className="flex flex-col gap-2">
                    <p>복용 주기</p>
                    <div className="flex flex-row text-[#666B76] justify-between">
                        {["월", "화", "수", "목", "금", "토", "일"].map((label, i) => (
                            <div key={i}
                                className={`w-11 h-11 rounded-[25px] flex justify-center items-center
                                ${dayCheck[i] ? 'bg-[#3D84FF] text-[#ffffff]' : 'bg-[#F4F6F8]'}`}
                                onClick={onDayCheck(i)}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="h-12 flex flex-row gap-2 justify-between">
                        <div className="flex flex-row w-full justify-between py-3 px-2 border border-b-[#A9ACB2] border-t-0 border-x-0" onClick={onClickCalendar(0)}>
                            <div className={`w-full ${startDay ? 'text-[#1A1A1A]' : 'text-[#A9ACB2]'}`}>{formatDate(startMonth, startDay, "시작일")}</div>
                            <div className="w-4 h-4 cursor-pointer"><Icon icon="lets-icons:date-today" className="w-4 h-4 text-[#666B76]"/></div>
                        </div>
                        <div className="flex flex-row w-full justify-between py-3 px-2 border border-b-[#A9ACB2] border-t-0 border-x-0" onClick={onClickCalendar(1)}>
                            <div className={`w-full ${startDay ? 'text-[#1A1A1A]' : 'text-[#A9ACB2]'}`}>{formatDate(endMonth, endDay, "종료일")}</div>
                            <div className="w-4 h-4 cursor-pointer"><Icon icon="lets-icons:date-today" className="w-4 h-4 text-[#666B76]"/></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <p>복약 시간</p>
                    <div className="flex flex-col gap-2 text-[#666B76]">
                        {["아침", "점심", "저녁", "취침 전"].map((label, i) => (
                            <div key={i} className="flex flex-row h-12 items-center justify-between">
                                <div className="flex flex-row gap-2 items-center">
                                    <div className="w-8 h-8 items-center flex cursor-pointer" onClick={onClickCheck(i)}>
                                        {isChecked[i] ? (<img src={checkImg} alt="checked" />) : (<img src={defaultImg} alt="default" />)}
                                    </div>
                                    <div className="font-semibold">{label}</div>
                                </div>
                                <div className="w-[220px] h-full flex justify-center items-center rounded-lg bg-[#F4F6F8] font-pretendard">
                                    <p className={selectedTimes[i] ? "text-[#343841]" : "text-[#A9ACB2]"}>
                                        {getSelectedTime(i)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-row justify-between">
                    <div className="text-[#1A1A1A]">알림 여부</div>
                    <label className="relative w-10 h-6 cursor-pointer">
                        <input type="checkbox" className="peer sr-only" checked={notify} onChange={() => setNotify(!notify)} /> 
                        <div className={`w-full h-full rounded-full transition-colors duration-300 ${notify ? 'bg-[#3D84FF]' : 'bg-[#A9ACB2]'}`}></div>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#ffffff] transition-transform duration-300 ${notify ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </label>
                </div>
            </form>

            <div className="fixed bottom-8 w-[320px]">
                <Button 
                    children={buttonLabel} 
                    disabled={!isFormValid} 
                    variant={isFormValid ? "colored" : "default"} 
                    onClick={handleSubmit}
                />
            </div>
            {(isCalendarOpen[0] || isCalendarOpen[1]) && 
                <BottomSheet 
                    title={isCalendarOpen[0] ? "시작일을 선택해주세요." : "종료일을 선택해주세요."}
                    content={<CalendarModal onSelectDate={handleSelectedDate} onSelectionChange={handleSelectionChange}/>}
                    onClick={exitModal}
                    isConfirmDisabled={!isDateSelected}
            />}

            {isTimeModalOpen && (
                <BottomSheet
                    title={"복용 시간을 선택해주세요."}
                    content={<TimeModal onChangeTime={handleTimeChange}/>}
                    onClick={exitModal}
                    isConfirmDisabled={false}
                />
            )}
        </div>
        </>
    )
}

export default MedicationForm;