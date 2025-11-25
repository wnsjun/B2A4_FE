import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form'; // 1. RHF import
import WeeklyButton from './WeeklyButton';
import FormInput from './FormInput';
import { Dirty, hintDisabled } from '../styles/typography';
import Button from './Button';

// --- (Interfaces and 'weeklist' remain unchanged) ---
interface IOperatingTime {
  mon: string | null;
  tue: string | null;
  wed: string | null;
  thu: string | null;
  fri: string | null;
  sat: string | null;
  sun: string | null;
}

interface Step2FormProps {
  operatingTime: IOperatingTime;
  selectedDays: (keyof IOperatingTime)[];
  onDayToggle: (dayKey: keyof IOperatingTime) => void;
  onBatchTimeApply: (time: string) => void;
  onBatchDayOffApply: (dayOff: boolean) => void;
  isEdit?: boolean;
}

const weeklist = [
  { key: 'mon', name: '월' },
  { key: 'tue', name: '화' },
  { key: 'wed', name: '수' },
  { key: 'thu', name: '목' },
  { key: 'fri', name: '금' },
  { key: 'sat', name: '토' },
  { key: 'sun', name: '일' },
];

// --- ('parseTime' utility function remains unchanged) ---
// const parseTime = (timeString: string | null) => {
//   const defaults = {
//     start: { hour: '', minute: '' },
//     end: { hour: '', minute: '' },
//     break: { start: { hour: '', minute: '' }, end: { hour: '', minute: '' } },
//     isBreak: false,
//     isDayOff: timeString === '휴무',
//     mainTimeString: '',
//     breakTimeString: '',
//   };

//   if (!timeString || timeString === '휴무') {
//     return defaults;
//   }

//   const parts = timeString.split(' 휴게: ');
//   const mainTimeStr = parts[0];
//   const breakTimeStr = parts[1];

//   const mainTimes = mainTimeStr.split(' ~ ');
//   const startTimeParts = mainTimes[0]?.split(' : ') || ['', ''];
//   const endTimeParts = mainTimes[1]?.split(' : ') || ['', ''];

//   const result = {
//     ...defaults,
//     start: { hour: startTimeParts[0] || '', minute: startTimeParts[1] || '' },
//     end: { hour: endTimeParts[0] || '', minute: endTimeParts[1] || '' },
//     mainTimeString: mainTimeStr,
//   };

//   if (breakTimeStr) {
//     result.isBreak = true;
//     result.breakTimeString = breakTimeStr;
//     const breakTimes = breakTimeStr.split(' ~ ');
//     const breakStartParts = breakTimes[0]?.split(' : ') || ['', ''];
//     const breakEndParts = breakTimes[1]?.split(' : ') || ['', ''];
//     result.break = {
//       start: { hour: breakStartParts[0] || '', minute: breakStartParts[1] || '' },
//       end: { hour: breakEndParts[0] || '', minute: breakEndParts[1] || '' },
//     };
//   }

//   return result;
// };

const parseTime = (timeString: string | null) => {
  const defaults = {
    start: { hour: '', minute: '' },
    end: { hour: '', minute: '' },
    break: { start: { hour: '', minute: '' }, end: { hour: '', minute: '' } },
    isBreak: false,
    isDayOff: timeString === '휴무',
    mainTimeString: '',
    breakTimeString: '',
  };

  if (!timeString || timeString === '휴무') {
    return defaults;
  }

  // 1. ⭐️ [핵심] 띄어쓰기 유무 상관없이 쪼개기 위해 정규식이나 유연한 split 사용
  // " 휴게: " 또는 "휴게:" 모두 대응
  const parts = timeString.split(/ 휴게: |휴게:/);
  const mainTimeStr = parts[0];
  const breakTimeStr = parts[1];

  // 2. ⭐️ " ~ " 또는 "~" (물결 앞뒤 공백 유연하게)
  const mainTimes = mainTimeStr.split(/ ~ |~/);

  // 3. ⭐️ " : " 또는 ":" (콜론 앞뒤 공백 유연하게) -> 이게 제일 중요!
  const splitTime = (str: string) => (str ? str.split(/ : |:/) : ['', '']);

  const startTimeParts = splitTime(mainTimes[0]);
  const endTimeParts = splitTime(mainTimes[1]);

  const result = {
    ...defaults,
    // 공백 제거(trim)를 한 번 더 해서 안전하게 넣기
    start: { hour: startTimeParts[0].trim(), minute: startTimeParts[1].trim() },
    end: { hour: endTimeParts[0].trim(), minute: endTimeParts[1].trim() },
    mainTimeString: mainTimeStr,
  };

  if (breakTimeStr) {
    result.isBreak = true;
    result.breakTimeString = breakTimeStr;

    const breakTimes = breakTimeStr.split(/ ~ |~/);
    const breakStartParts = splitTime(breakTimes[0]);
    const breakEndParts = splitTime(breakTimes[1]);

    result.break = {
      start: { hour: breakStartParts[0].trim(), minute: breakStartParts[1].trim() },
      end: { hour: breakEndParts[0].trim(), minute: breakEndParts[1].trim() },
    };
  }

  return result;
};

// 2. RHF Form SChema
interface IFormInputs {
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  breakTime: boolean;
  breakHourStart: string;
  breakMinuteStart: string;
  breakHourEnd: string;
  breakMinuteEnd: string;
  dayOff: boolean;
}

const defaultValues: IFormInputs = {
  startHour: '',
  startMinute: '',
  endHour: '',
  endMinute: '',
  breakTime: false,
  breakHourStart: '',
  breakMinuteStart: '',
  breakHourEnd: '',
  breakMinuteEnd: '',
  dayOff: false,
};

const Step2Form = ({
  operatingTime,
  selectedDays,
  onDayToggle,
  onBatchTimeApply,
  onBatchDayOffApply,
  isEdit = false,
}: Step2FormProps) => {
  // 3. 'Locked' state는 폼 데이터가 아닌 UI 상태이므로 useState로 유지
  const [clinicLocked, setClinicLocked] = useState(false);
  const [breakLocked, setBreakLocked] = useState(false);

  // 4. useForm hook으로 폼 상태 관리
  const { control, reset, watch, setValue } = useForm<IFormInputs>({
    defaultValues,
  });

  const [
    dayOff,
    breakTime,
    startHour,
    startMinute,
    endHour,
    endMinute,

    breakHourStart,
    breakMinuteStart,
    breakHourEnd,
    breakMinuteEnd,
  ] = watch([
    'dayOff',
    'breakTime',
    'startHour',
    'startMinute',
    'endHour',
    'endMinute',

    'breakHourStart',
    'breakMinuteStart',
    'breakHourEnd',
    'breakMinuteEnd',
  ]);

  // // 5. UI 로직을 위해 RHF state를 'watch'
  // const dayOff = watch('dayOff');
  // const breakTime = watch('breakTime');

  const isSingleSelection = selectedDays.length === 1;

  // 6. RHF state를 읽도록 헬퍼 함수 수정 (getValues 사용)
  const hasValidMainTime = () => {
    // const { startHour, startMinute, endHour, endMinute } = getValues();
    return [startHour, startMinute, endHour, endMinute].every((value) => value.trim() !== '');
  };

  const hasValidBreakTime = () => {
    // const { breakHourStart, breakMinuteStart, breakHourEnd, breakMinuteEnd } = getValues();
    return [breakHourStart, breakMinuteStart, breakHourEnd, breakMinuteEnd].every(
      (value) => value.trim() !== ''
    );
  };

  const buildMainTimeString = () => {
    // const { startHour, startMinute, endHour, endMinute } = getValues();
    return `${startHour} : ${startMinute} ~ ${endHour} : ${endMinute}`;
  };

  const buildBreakTimeString = () => {
    // const { breakHourStart, breakMinuteStart, breakHourEnd, breakMinuteEnd } = getValues();
    return `${breakHourStart} : ${breakMinuteStart} ~ ${breakHourEnd} : ${breakMinuteEnd}`;
  };

  // useEffect(() => {
  //   // 'selectedDays'가 실제로 변경되었는지 확인
  //   const selectedDaysString = JSON.stringify(selectedDays.sort());
  //   const prevSelectedDaysString = JSON.stringify(prevSelectedDaysRef.current.sort());
  //   const selectedDaysChanged = selectedDaysString !== prevSelectedDaysString;

  //   // 공통 폼 리셋 함수
  //   const resetForm = () => {
  //     reset(defaultValues);
  //     setClinicLocked(false);
  //     setBreakLocked(false);
  //   };

  //   // ★★★ 1. (Problem 1: isDirty 보존 / Problem 2: '휴무' 버튼)
  //   // '입력 완료' 또는 '휴무 토글' 등으로 prop이 바뀌었지만 요일 선택은 그대로일 때
  //   if (!selectedDaysChanged && selectedDays.length > 0) {
  //     // ★★★ '휴무' 버튼이 눌렸을 때, 이 로직이 폼 상태를 되돌리지 않도록
  //     //     (isDirty 보존을 위해) 그냥 return만 합니다.
  //     //     'handleDayOffToggle'의 setValue()가 UI를 즉시 변경할 수 있게 합니다.
  //     return;
  //   }

  //   // --- (이 하단은 selectedDays가 0이거나, selectedDays가 변경됐을 때만 실행) ---

  //   if (selectedDays.length === 0) {
  //     resetForm();
  //   } else if (isSingleSelection) {
  //     // (단일 선택: 데이터 로드)
  //     const dayKey = selectedDays[0];
  //     const savedTime = operatingTime[dayKey];
  //     const parsed = parseTime(savedTime);

  //     reset({
  //       startHour: parsed.start.hour,
  //       startMinute: parsed.start.minute,
  //       endHour: parsed.end.hour,
  //       endMinute: parsed.end.minute,
  //       breakTime: parsed.isBreak,
  //       breakHourStart: parsed.break.start.hour,
  //       breakMinuteStart: parsed.break.start.minute,
  //       breakHourEnd: parsed.break.end.hour,
  //       breakMinuteEnd: parsed.break.end.minute,
  //       dayOff: parsed.isDayOff, // (selectedDays가 바뀌었으므로 prop 값으로 reset)
  //     });

  //     setClinicLocked(!!savedTime && !parsed.isDayOff);
  //     setBreakLocked(parsed.isBreak);
  //   } else {
  //     // (다중 선택)
  //     const firstDayKey = selectedDays[0];
  //     const firstTime = operatingTime[firstDayKey];

  //     // ★★★ 3. (Problem 3: 폼 초기화) - 이것도 해결됨
  //     const allSame = selectedDays.every((dayKey) => operatingTime[dayKey] === firstTime);

  //     if (allSame) {
  //       // (A) '월수금' (모두 09시) -> 데이터 로드
  //       const parsed = parseTime(firstTime);
  //       reset({
  //         startHour: parsed.start.hour,
  //         startMinute: parsed.start.minute,
  //         endHour: parsed.end.hour,
  //         endMinute: parsed.end.minute,
  //         breakTime: parsed.isBreak,
  //         breakHourStart: parsed.break.start.hour,
  //         breakMinuteStart: parsed.break.start.minute,
  //         breakHourEnd: parsed.break.end.hour,
  //         breakMinuteEnd: parsed.break.end.minute,
  //         dayOff: parsed.isDayOff,
  //       });
  //       setClinicLocked(!!firstTime && !parsed.isDayOff);
  //       setBreakLocked(parsed.isBreak);
  //     } else {
  //       // (B) '월'(09시) + '화'(null) -> 폼을 비움
  //       resetForm();
  //     }
  //   }

  //   // '이전' 선택일을 현재로 업데이트
  //   if (selectedDaysChanged) {
  //     prevSelectedDaysRef.current = selectedDays;
  //   }
  // }, [selectedDays, operatingTime, isSingleSelection, reset, getValues]);

  useEffect(() => {
    // 1. 선택된 요일이나 운영시간 데이터가 없으면 리셋 X (혹은 초기화)
    if (selectedDays.length === 0) {
      if (isEdit) {
        reset(defaultValues); // 필요 시 주석 해제
        setClinicLocked(false); // 버튼 상태 초기화
        setBreakLocked(false);
      }
      return;
    }

    // 2. 현재 선택된 첫 번째 요일 가져오기
    const currentDay = selectedDays[0];
    const timeString = operatingTime[currentDay];

    // 📸 CCTV: 데이터가 잘 넘어왔는지 확인! (콘솔을 꼭 확인하세요)
    console.log(`[Step2Form] 요일: ${currentDay}, 시간문자열:`, timeString);

    // 3. 시간 문자열 파싱 ("09:00 ~ 18:00" -> { startHour: "09", ... })
    const parsed = parseTime(timeString);

    console.log('[Step2Form] 파싱 결과:', parsed);

    // 4. 폼(input)에 값 강제 주입 (reset)
    reset({
      startHour: parsed.start.hour,
      startMinute: parsed.start.minute,
      endHour: parsed.end.hour,
      endMinute: parsed.end.minute,

      breakTime: parsed.isBreak,
      breakHourStart: parsed.break.start.hour,
      breakMinuteStart: parsed.break.start.minute,
      breakHourEnd: parsed.break.end.hour,
      breakMinuteEnd: parsed.break.end.minute,

      dayOff: parsed.isDayOff,
    });

    // 5. 입력 완료(잠금) 상태 동기화
    // (값이 있으면 잠금 처리, 휴무면 잠금 해제 등 UI 상태 맞추기)
    const hasData = !!timeString && !parsed.isDayOff;
    setClinicLocked(hasData);
    setBreakLocked(parsed.isBreak);
  }, [selectedDays, operatingTime, reset]);

  // 핸들러 함수
  const handleClinicTimeApplyClick = () => {
    if (selectedDays.length === 0) {
      alert('요일을 먼저 선택해주세요.');
      return;
    }

    if (clinicLocked) {
      setClinicLocked(false);
      return;
    }

    // --- '입력 완료' 로직 (잠겨있지 않을 때) ---

    if (!hasValidMainTime()) {
      alert('진료 시간을 모두 입력해주세요');
      return;
    }

    let combinedTime = buildMainTimeString();

    if (isSingleSelection) {
      const parsed = parseTime(operatingTime[selectedDays[0]]);
      if (parsed.isBreak && parsed.breakTimeString) {
        combinedTime += ` 휴게: ${parsed.breakTimeString}`;
      }
    }
    // (일괄 적용 모드에서는 '진료 시간'만 덮어씁니다)

    // ★★★ (수정 3) Problem 1: '입력 완료' 시 항상 잠급니다. (isSingleSelection 제거)
    setClinicLocked(true);
    onBatchTimeApply(combinedTime);
  };

  // 8. RHF state를 변경하도록 핸들러 수정 (setValue 사용)
  const handleBreakTimeCheckboxToggle = () => {
    if (dayOff) return; // 'dayOff'는 watch된 값

    if (isSingleSelection && !clinicLocked) {
      alert('진료 시간을 먼저 입력 완료해주세요.');
      return;
    }

    const nextState = !breakTime; // 'breakTime'은 watch된 값
    setValue('breakTime', nextState, { shouldDirty: true }); // RHF의 setValue

    if (!nextState) {
      // 휴게시간 체크를 '해제'하는 경우
      setValue('breakHourStart', '');
      setValue('breakMinuteStart', '');
      setValue('breakHourEnd', '');
      setValue('breakMinuteEnd', '');
      setBreakLocked(false);

      if (selectedDays.length > 0 && hasValidMainTime()) {
        onBatchTimeApply(buildMainTimeString());
      }
    }
  };

  // getValues()를 사용하도록 수정된 헬퍼를 사용하므로 이 함수는 수정 불필요
  const handleBreakApplyClick = () => {
    if (selectedDays.length === 0) {
      console.error('요일을 먼저 선택해주세요.');
      return;
    }

    if (breakLocked) {
      setBreakLocked(false); // 수정 모드
      return;
    }

    // --- '입력 완료' 로직 (잠겨있지 않을 때) ---

    if (isSingleSelection && !clinicLocked) {
      console.error('진료 시간을 먼저 입력 완료하세요.');
      return;
    }

    if (!breakTime) {
      console.error('휴게시간을 먼저 활성화해주세요.');
      return;
    }

    if (!hasValidBreakTime()) {
      console.error('휴게 시간을 모두 입력해주세요');
      return;
    }

    // 3. (검사 통과) 저장
    onBatchTimeApply(`${buildMainTimeString()} 휴게: ${buildBreakTimeString()}`);
    setBreakLocked(true);
  };

  // 9. RHF state를 변경하도록 핸들러 수정 (setValue 사용)
  const handleDayOffToggle = () => {
    if (selectedDays.length === 0) {
      alert('요일을 먼저 선택해주세요.');
      return;
    }

    const newDayOffState = !dayOff; // 'dayOff'는 watch된 값
    setValue('dayOff', newDayOffState, { shouldDirty: true }); // RHF의 setValue

    if (newDayOffState) {
      setValue('breakTime', false, { shouldDirty: true }); // RHF의 setValue
      setBreakLocked(false);
      onBatchDayOffApply(true);
    } else {
      onBatchDayOffApply(false);
    }
  };

  // 10. 'watch'된 값 (dayOff, breakTime)을 사용하도록 로직 업데이트
  const isClinicDisabled = dayOff || (clinicLocked && selectedDays.length > 0);
  const isBreakDisabled = dayOff || !breakTime || (breakLocked && selectedDays.length > 0);
  const clinicButtonLabel = clinicLocked ? '수정' : '입력 완료';
  const breakButtonLabel = breakLocked ? '수정' : '입력 완료';

  // hasValidMainTime()가 RHF 값을 사용하도록 업데이트되었으므로 로직 정상 작동
  const isClinicButtonDisabled = () => {
    if (dayOff || selectedDays.length === 0) return true;
    if (clinicLocked && isSingleSelection) return false;
    if (hasValidMainTime()) return false;
    return true;
  };
  const clinicDisabled = isClinicButtonDisabled();

  const isBreakButtonDisabled = () => {
    if (dayOff || selectedDays.length === 0) return true;
    if (breakLocked) return false;
    if (!hasValidBreakTime()) return true;
    return false;
  };
  const breakDisabled = isBreakButtonDisabled();

  // 11. JSX: FormInput을 Controller로 래핑
  return (
    <div className="min-h-[290px]">
      <div style={Dirty}>운영일 선택</div>
      <div>
        <div className="flex flex-row gap-x-[2px] mb-[8px] mt-[16px]">
          {/* --- (요일 버튼 로직은 동일) --- */}
          {weeklist.map((day) => {
            const dayKey = day.key as keyof IOperatingTime;

            return (
              <WeeklyButton
                key={day.key}
                day={day.name}
                // isSaved={isSaved}
                isSelected={selectedDays.includes(dayKey)}
                onDayClick={() => onDayToggle(dayKey)}
                disabled={false}
              />
            );
          })}
        </div>
        <div
          className={
            `flex flex-row gap-x-[24px] ` +
            `${isClinicDisabled ? ' cursor-not-allowed' : ' cursor-pointer'}`
          }
        >
          {/* 진료시간 선택 */}
          <div
            className={
              `flex flex-row gap-x-[4px] items-center mb-[24px]` +
              `${isClinicDisabled ? ' opacity-50' : 'cursor-pointer'}`
            }
          >
            <div className="flex flex-col gap-y-[4px]">
              <div className="flex flex-row gap-x-[8px] px-[8px] items-center">
                <Controller
                  name="startHour"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormInput
                      {...field}
                      label="form"
                      placeholder=""
                      containerClassName="w-[56px]"
                      disabled={isClinicDisabled}
                      maxLength={2}
                      isDirty={fieldState.isDirty}
                    />
                  )}
                />
                <div className="text-[16px]">:</div>
                <Controller
                  name="startMinute"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormInput
                      {...field}
                      label="form"
                      placeholder=""
                      containerClassName="w-[56px]"
                      disabled={isClinicDisabled}
                      maxLength={2}
                      isDirty={fieldState.isDirty}
                    />
                  )}
                />
              </div>
              <div className="text-start justify-end ml-2" style={hintDisabled}>
                진료 시작 시간
              </div>
            </div>
            <div>—</div>
            <div className="flex flex-col gap-y-[4px]">
              <div className="flex flex-row gap-x-[8px] px-[8px] items-center">
                <Controller
                  name="endHour"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormInput
                      {...field}
                      label="form"
                      placeholder=""
                      containerClassName="w-[56px]"
                      disabled={isClinicDisabled}
                      maxLength={2}
                      isDirty={fieldState.isDirty}
                    />
                  )}
                />
                <div className="text-[16px]">:</div>
                <Controller
                  name="endMinute"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormInput
                      {...field}
                      label="form"
                      placeholder=""
                      containerClassName="w-[56px]"
                      disabled={isClinicDisabled}
                      maxLength={2}
                      isDirty={fieldState.isDirty}
                    />
                  )}
                />
              </div>
              <div className="ml-2" style={hintDisabled}>
                진료 종료 시간
              </div>
            </div>
          </div>
          <div className={dayOff ? 'cursor-not-allowed' : 'cursor-pointer'}>
            {/* --- (버튼 로직은 동일) --- */}
            <Button
              type="button"
              size="mini"
              isMobile={false}
              children={clinicButtonLabel}
              disabled={dayOff} // 'dayOff'는 watch된 값
              onClick={handleClinicTimeApplyClick}
              variant={
                clinicDisabled || !hasValidMainTime() || clinicLocked
                  ? // ( && isSingleSelection) ||
                    'default'
                  : 'colored'
              }
            />
          </div>
        </div>
        <div>
          <div className="flex flex-row justify-start items-center gap-x-[8px] mt-[24px]">
            <div
              onClick={handleBreakTimeCheckboxToggle}
              className={`flex flex-row gap-x-[8px] items-center ${
                dayOff ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <img
                src={breakTime ? '/check_filled.svg' : '/check_unfilled.svg'}
                className="w-[32px] h-[32px] "
              />
            </div>
            <div className="tect-[16px] mb-0" style={Dirty}>
              휴게시간
            </div>
          </div>
          {breakTime && (
            <div className="flex flex-row gap-[24px]">
              <div
                className={
                  `flex flex-row items-center gap-[4px]` + (breakLocked ? ' opacity-50' : ' ')
                }
              >
                <div className="flex flex-col gap-y-[4px]">
                  <div className="flex flex-row gap-x-[8px] px-[8px] items-center">
                    <Controller
                      name="breakHourStart"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormInput
                          {...field}
                          label="form"
                          placeholder=""
                          containerClassName="w-[56px]"
                          disabled={isBreakDisabled}
                          maxLength={2}
                          isDirty={fieldState.isDirty}
                        />
                      )}
                    />
                    <div className="text-[16px]">:</div>
                    <Controller
                      name="breakMinuteStart"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormInput
                          {...field}
                          label="form"
                          placeholder=""
                          containerClassName="w-[56px]"
                          disabled={isBreakDisabled}
                          maxLength={2}
                          isDirty={fieldState.isDirty}
                        />
                      )}
                    />
                  </div>
                  <div className=" ml-2" style={hintDisabled}>
                    휴게 시작 시간
                  </div>
                </div>
                <div>—</div>
                <div className="flex flex-col gap-y-[4px]">
                  <div className="flex flex-row gap-x-[8px] px-[8px] items-center">
                    <Controller
                      name="breakHourEnd"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormInput
                          {...field}
                          label="form"
                          placeholder=""
                          containerClassName="w-[56px]"
                          disabled={isBreakDisabled}
                          maxLength={2}
                          isDirty={fieldState.isDirty}
                        />
                      )}
                    />
                    <div className="text-[16px]">:</div>
                    <Controller
                      name="breakMinuteEnd"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormInput
                          {...field}
                          label="form"
                          placeholder=""
                          containerClassName="w-[56px]"
                          disabled={isBreakDisabled}
                          maxLength={2}
                          isDirty={fieldState.isDirty}
                        />
                      )}
                    />
                  </div>
                  <div className="text-[12px] text-[#666B76] ml-2" style={hintDisabled}>
                    휴게 종료 시간
                  </div>
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  size="mini"
                  isMobile={false}
                  children={breakButtonLabel}
                  disabled={dayOff} // 'dayOff'는 watch된 값
                  onClick={handleBreakApplyClick}
                  variant={breakDisabled || !hasValidBreakTime() ? 'default' : 'colored'}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        onClick={handleDayOffToggle}
        className="flex flex-row gap-x-[8px] mt-[24px] items-center cursor-pointer"
      >
        <img
          src={dayOff ? '/check_filled.svg' : '/check_unfilled.svg'}
          className="w-[32px] h-[32px] "
        />
        <div className="" style={Dirty}>
          휴무
        </div>
      </div>
    </div>
  );
};

export default Step2Form;
