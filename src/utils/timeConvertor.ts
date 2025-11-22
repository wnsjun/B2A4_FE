export interface IOperatingTime {
  mon: string | null;
  tue: string | null;
  wed: string | null;
  thu: string | null;
  fri: string | null;
  sat: string | null;
  sun: string | null;
}

// 요일 변환 맵
const dayMap: Record<string, string> = {
  mon: 'MON',
  tue: 'TUE',
  wed: 'WED',
  thu: 'THU',
  fri: 'FRI',
  sat: 'SAT',
  sun: 'SUN',
};

/**
 * 프론트엔드의 시간 문자열("09 : 00 ~ 18 : 00")을
 * 백엔드 포맷({ openTime: "09:00", ... })으로 변환하는 함수
 */
export const transformOperatingData = (operatingTime: IOperatingTime) => {
  const operatingHours: any = {};
  const breakTimes: any = {};

  Object.keys(operatingTime).forEach((key) => {
    const dayKey = key as keyof IOperatingTime;
    const rawTime = operatingTime[dayKey];
    const upperDay = dayMap[dayKey];

    // 1. 휴무거나 데이터가 없는 경우
    if (!rawTime || rawTime === '휴무') {
      operatingHours[upperDay] = { isClosed: true };
      return;
    }

    // 2. 데이터가 있는 경우 파싱
    try {
      // " 휴게: "를 기준으로 분리
      const [mainPart, breakPart] = rawTime.split(' 휴게: ');

      const clean = (str: string) => str.replace(/\s/g, ''); // 공백 제거
      const [openStr, closeStr] = mainPart.split(' ~ ');

      operatingHours[upperDay] = {
        openTime: clean(openStr),
        closeTime: clean(closeStr),
        isClosed: false,
      };

      // 휴게시간 처리
      if (breakPart) {
        const [breakStart, breakEnd] = breakPart.split(' ~ ');
        breakTimes[upperDay] = {
          breakStartTime: clean(breakStart),
          breakEndTime: clean(breakEnd),
        };
      }
    } catch (e) {
      console.error(`${upperDay} 시간 파싱 에러:`, e);
      operatingHours[upperDay] = { isClosed: true }; // 에러나면 닫음 처리
    }
  });

  return { operatingHours, breakTimes };
};

export const reverseTransformOperatingData = (serverData: any, serverBreak: any) => {
  const result: any = {
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  };

  // 대문자 키(MON)를 소문자 키(mon)로 매핑
  const dayMap: Record<string, string> = {
    MON: 'mon',
    TUE: 'tue',
    WED: 'wed',
    THU: 'thu',
    FRI: 'fri',
    SAT: 'sat',
    SUN: 'sun',
  };

  if (!serverData) return result;

  Object.keys(serverData).forEach((upperDay) => {
    const lowerDay = dayMap[upperDay];
    if (!lowerDay) return;

    const timeInfo = serverData[upperDay];

    // 휴무인 경우
    if (timeInfo.isClosed) {
      result[lowerDay] = '휴무';
      return;
    }

    // 영업 시간 문자열 만들기 (예: "09:00 ~ 18:00")
    let timeString = `${timeInfo.openTime} ~ ${timeInfo.closeTime}`;

    // 휴게 시간이 있다면 붙이기
    if (serverBreak && serverBreak[upperDay]) {
      const breakInfo = serverBreak[upperDay];
      if (breakInfo.breakStartTime && breakInfo.breakEndTime) {
        timeString += ` 휴게: ${breakInfo.breakStartTime} ~ ${breakInfo.breakEndTime}`;
      }
    }

    result[lowerDay] = timeString;
  });

  return result;
};

export interface ProcessedOperatingDay {
  day: string;
  hours: string;
  break: string | null;
}

// ⭐️ 요일 매핑 테이블
const dayMapKR: Record<string, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
};

/**
 * 서버에서 받은 복잡한 운영 시간 배열을 UI 표시용 간결한 배열로 변환합니다.
 * (Break time 정보가 operatingHours 배열 객체 안에 포함되어 있는 구조 처리)
 * * @param serverOperatingHours API 응답의 operatingHours 필드 (배열)
 * @returns {ProcessedOperatingDay[]} UI 표시용 배열
 */
export const processOperatingTimeForDisplay = (
  serverOperatingHours: any[]
): ProcessedOperatingDay[] => {
  if (!serverOperatingHours || !Array.isArray(serverOperatingHours)) return [];

  return serverOperatingHours.map((dayInfo) => {
    const krDay = dayMapKR[dayInfo.dayOfWeek] || dayInfo.dayOfWeek; // MON -> 월
    const isClosed = dayInfo.isClosed;

    // 1. 진료 시간 문자열 생성
    const hours = isClosed ? '휴무' : `${dayInfo.openTime} - ${dayInfo.closeTime}`;

    let breakStr: string | null = null;

    // 2. 휴게 시간 처리 (breakStartTime과 breakEndTime이 있을 때만 문자열 생성)
    if (!isClosed && dayInfo.breakStartTime && dayInfo.breakEndTime) {
      // 예: "12:00 - 13:00 휴게시간"
      breakStr = `${dayInfo.breakStartTime} - ${dayInfo.breakEndTime} 휴게시간`;
    }
    // else if (!isClosed) {
    //   // 진료는 하지만 휴게 시간 정보가 없는 경우
    //   breakStr = '휴게시간 없음';
    // }

    return {
      day: krDay,
      hours: hours,
      break: breakStr,
    };
  });
};
