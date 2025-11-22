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
