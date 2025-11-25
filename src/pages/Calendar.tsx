import {
  format,
  isWithinInterval,
  parseISO,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  startOfMonth,
  isBefore,
  isSameDay,
  addDays,
} from 'date-fns';
import Topbar from '../layouts/Topbar';
import CalendarDays from '../components/Calendar/CalendarDays';
import CalendarCells from '../components/Calendar/CalendarCells';
import Bottombar from '../layouts/Bottombar';
import DailyRecord from '../components/Calendar/DailyRecord';
import { useEffect, useState } from 'react';
import {
  fetchAllMedication,
  fetchAllTreatment,
  fetchDailyRecord,
  fetchDailyTake,
  fetchDailyTreatment,
} from '../apis/CalendarAPi';

export interface MedicalTreatment {
  year: number;
  month: number;
  dates: string[];
}

// 백엔드의 요일 약어와 date-fns의 요일 약어(영문)를 매핑합니다.
// date-fns의 format(date, 'EEE')는 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'을 반환합니다.
const DAY_OF_WEEK_MAP: Record<string, string> = {
  Mon: 'MON',
  Tue: 'TUE',
  Wed: 'WED',
  Thu: 'THU',
  Fri: 'FRI',
  Sat: 'SAT',
  Sun: 'SUN',
};

// 일정 범위에서 해당 요일만
const isMedicationActiveOnDate = (dateString: string, record: any): boolean => {
  const checkDate = parseISO(dateString);
  const startDate = parseISO(record.startDate);
  const endDate = parseISO(record.endDate);

  const isDateInRange = isWithinInterval(checkDate, { start: startDate, end: endDate });

  if (!isDateInRange) {
    return false;
  }

  // 2. 요일 확인
  const dayOfWeekShort = format(checkDate, 'EEE'); // 예: 'Fri'
  const apiDay = DAY_OF_WEEK_MAP[dayOfWeekShort]; // 예: 'FRI'

  // record.daysOfWeek가 배열인지 확인하고, 해당 요일을 포함하는지 확인
  const isDayActive = Array.isArray(record.daysOfWeek) && record.daysOfWeek.includes(apiDay);

  return isDayActive;
};

const Calendar = () => {
  const [calendarDate, _setCalendarDate] = useState(new Date());

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [isClicked, setIsClicked] = useState(false);
  const [selectedDateString, setSelectedDateString] = useState('');

  const [calendarMedData, setCalendarMedData] = useState<
    Record<string, { hasMed: boolean; isAllTaken: boolean }>
  >({});
  const [calendarMedTreat, setCalendarMedTreat] = useState<MedicalTreatment | null>(null);
  const [dailyRecordData, setDailyRecordData] = useState<any>(null);
  const [dailyTreatmentData, setDailyTreatmentData] = useState<any>(null);
  const [dailyRecordTaken, setDailyRecordTaken] = useState<any>(null);
  const [statusLoadedForMonth, setStatusLoadedForMonth] = useState('');
  const [monthlyScheduleMap, setMonthlyScheduleMap] = useState<any[]>([]);

  const loadDailyRecord = async (date: string) => {
    try {
      const data = await fetchDailyRecord(date);
      const dailyTaken = await fetchDailyTake(date);
      const treatment = await fetchDailyTreatment(date);
      console.log(data);

      const filteredRecords = data.data.filter((record: any) =>
        isMedicationActiveOnDate(date, record)
      );

      console.log('필터링된 레코드:', filteredRecords);

      setDailyRecordData(filteredRecords);
      setDailyRecordTaken(dailyTaken.data || []);
      setDailyTreatmentData(treatment.data);
    } catch (error) {
      console.error('복약 일정 데이터 로드 중 오류: ', error);
      setDailyRecordData(null);
      setDailyTreatmentData(null);
      setDailyRecordTaken([]);
    }
  };

  const refeshDailyRecords = () => {
    if (selectedDateString) loadDailyRecord(selectedDateString);
  };

  const loadAllMedication = async (year: string, month: string) => {
    try {
      const allMedication = await fetchAllMedication(year, month);
      console.log(allMedication);

      if (allMedication.data) {
        setMonthlyScheduleMap(allMedication.data);
      } else {
        setMonthlyScheduleMap([]);
      }
    } catch (error) {
      console.log('error', error);
      setMonthlyScheduleMap([]);
    }
  };

  // med_all인지 med_noAll인지
  const calculateMonthlyMedStatus = (currentMonthYearKey: string) => {
    setStatusLoadedForMonth('LOADING');
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    let day = startOfWeek(monthStart);
    const today = new Date();

    const newCalendarMedData: Record<string, { hasMed: boolean; isAllTaken: boolean }> = {};

    const dailyMedicationStatus: Record<string, { totalScheduled: number; totalTaken: number }> =
      {};

    monthlyScheduleMap.forEach((record) => {
      if (Array.isArray(record.days)) {
        record.days.forEach((dayStatus: { date: string; taken: boolean }) => {
          const dateString = dayStatus.date;

          if (!dailyMedicationStatus[dateString]) {
            dailyMedicationStatus[dateString] = { totalScheduled: 0, totalTaken: 0 };
          }
          dailyMedicationStatus[dateString].totalScheduled += 1;
          if (dayStatus.taken === true) dailyMedicationStatus[dateString].totalTaken += 1;
        });
      }
    });

    while (day <= endOfWeek(monthEnd, { weekStartsOn: 0 })) {
      const dateString = format(day, 'yyyy-MM-dd');
      const sum = dailyMedicationStatus[dateString];

      if (isBefore(day, today) || isSameDay(day, today)) {
        if (sum) {
          // 복약 일정 있음
          const hasMed = sum.totalScheduled > 0;
          let isAllTaken = false;
          if (hasMed) isAllTaken = sum.totalScheduled === sum.totalTaken;

          newCalendarMedData[dateString] = { hasMed, isAllTaken };
        } else {
          newCalendarMedData[dateString] = { hasMed: false, isAllTaken: false };
        }
      } else {
        // 오늘 이후
        newCalendarMedData[dateString] = { hasMed: false, isAllTaken: false };
      }
      day = addDays(day, 1);
    }
    setStatusLoadedForMonth(currentMonthYearKey);
    setCalendarMedData(newCalendarMedData);
  };

  useEffect(() => {
    const yearstr = calendarDate.getFullYear().toString();
    const monthstr = (calendarDate.getMonth() + 1).toString().padStart(2, '0');
    const currentMonthYearKey = `${yearstr}-${monthstr}`;

    if (statusLoadedForMonth === currentMonthYearKey || statusLoadedForMonth === 'LOADING') return;

    const loadMonthlyData = async () => {
      try {
        const allTreatment = await fetchAllTreatment(yearstr, monthstr);
        setCalendarMedTreat(allTreatment.data);
      } catch (error) {
        console.error('월간 진료 조회 오류: ', error);
        setCalendarMedTreat(null);
      }

      await loadAllMedication(yearstr, monthstr);
    };

    loadMonthlyData();
  }, [calendarDate]);

  useEffect(() => {
    if (monthlyScheduleMap.length === 0 && statusLoadedForMonth !== 'LOADING') return;

    const yearstr = calendarDate.getFullYear().toString();
    const monthstr = (calendarDate.getMonth() + 1).toString().padStart(2, '0');
    const currentMonthYearKey = `${yearstr}-${monthstr}`;

    if (statusLoadedForMonth !== currentMonthYearKey) {
      calculateMonthlyMedStatus(currentMonthYearKey);
    }
  }, [monthlyScheduleMap, calendarDate]);

  const onDateClick = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    setSelectedDateString(dateString);
    setSelectedMonth(format(day, 'MM'));
    setSelectedDay(format(day, 'dd'));
    setIsClicked(true);

    console.log(dateString);
    loadDailyRecord(dateString);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-center">
        <Topbar title="진료 기록" setting={true} />
      </div>
      {statusLoadedForMonth === 'LOADING' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-white opacity-30" />
          <div className="relative flex flex-col p-4 rounded-lg bg-white text-black font-semibold shadow-2xl">
            <p>복약 아이콘 표시 중</p>
          </div>
        </div>
      )}
      <div className="flex flex-col mx-5 gap-2">
        <CalendarDays />
        <CalendarCells
          currentDate={calendarDate}
          onDateClick={onDateClick}
          selectedMonth={selectedMonth}
          selectedDay={selectedDay}
          mode={0}
          calendarMedData={calendarMedData}
          calendarMedTreat={calendarMedTreat}
        />
        <DailyRecord
          selectedMonth={selectedMonth}
          selectedDay={selectedDay}
          onDateClick={onDateClick}
          isClicked={isClicked}
          recordData={dailyRecordData}
          medTreatData={dailyTreatmentData}
          recordTaken={dailyRecordTaken}
          onRefresh={refeshDailyRecords}
        />
      </div>

      <div>
        <Bottombar />
      </div>
    </div>
  );
};

export default Calendar;
