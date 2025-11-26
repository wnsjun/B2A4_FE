import axios from "axios";
import instance from '../utils/axiosInstance';
const base_URL = import.meta.env.VITE_API_URL;

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

export interface dailyRecord {
    date: string;
    period: string;
    taken: boolean;
}

// 특정 달 복약 일정 전체 조회
export const fetchAllMedication = async(year: string, month: string) => {
    try {
        const res = await instance.get(`${base_URL}/api/patients/medications/month?year=${year}&month=${month}`)
        console.log(res.data);
        return res.data;
    } catch (error) {
        console.log("특정 달 전체 복약 일정 조회 실패: ", error);
        throw error;
    }
}

// 특정 날짜 복약 일정 조회
export const fetchDailyRecord = async (date: string) => {
    try {
        const res = await instance.get(
            `${base_URL}/api/patients/medications?date=${date}`)
        //console.log("전송 성공:", res.data);
        return await res.data;
    } catch (error) {
        console.error("날짜별 복약 일정 조회 실패: ", error);
        throw error;
    }
}

// 특정 날짜 복약 여부 시간 별 조회
export const fetchDailyTake = async (date: string) => {
    try {
        const res = await instance.get(
            `${base_URL}/api/patients/medications/daily?date=${date}`)
        console.log("전송 성공:", res.data);
        return await res.data;
    } catch (error) {
        console.error("날짜별 복약 일정 조회 실패: ", error);
        throw error;
    }
}

// 특정 달 진료 이력 조회
export const fetchAllTreatment = async (year: string, month: string) => {
    try {
        const res = await instance.get(`${base_URL}/api/patients/records/dates?year=${year}&month=${month}`)
        console.log(res.data);
        return await res.data;
    } catch (error) {
        console.error("전체 진료 이력 조회 실패 : ", error);
        throw error;
    }
}

// 특정 날짜 진료 이력 조회
export const fetchDailyTreatment = async (date: string) => {

    try {
        const res = await instance.get(`${base_URL}/api/patients/records?date=${date}`);
        console.log("진료 이력 조회 성공", res.data);
        return await res.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response && error.response.status === 400) {
            console.log("400: 진료 기록 없음");
            return {date: null}
        }
        console.log("날짜 진료 이력 조회 실패: ", error);
        throw error;
    }
}

// 복약 일정 추가
export const postMedication = async (data: medProps) => {
    try {
        const res = await instance.post(`${base_URL}/api/patients/medications`, data)

        console.log("복약 일정 추가 성공: ", res.data);
        return res.data;
    } catch(error) {
        console.log("복약 일정 추가 실패 : ", error);
        throw error;
    }
}

// 복용 일정 수정
export const patchMedication = async (recordId: number, data: medProps) => {
    try {
        const res = await instance.patch(`${base_URL}/api/patients/medications/${recordId}`, data)

        console.log("복약 일정 수정 성공: ", res.data);
        return res.data;
    } catch(error) {
        console.log("복약 일정 수정 실패 : ", error);
        throw error;
    }
}

// 복용 여부 업데이트
export const updateMed = async (recordId: string, isTaken: boolean, date: string, period: string) => {
    try {
        const res = await instance.patch(`${base_URL}/api/patients/medications/${recordId}/history`, {
            date: date,
            taken: isTaken,
            period: period,
        });
        console.log(res.data);
        return res.data;
    } catch (error) {
        console.log("복약 일정 업데이트 실패 : ", error);
        throw error;
    }
}

// 복약 일정 전체 삭제
export const deleteMedAll = async (recordId: number, date: string) => {
    try {
        const res = await instance.delete(`${base_URL}/api/patients/medications/${recordId}/after?date=${date}`);
        console.log(res.data);
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}


// 복약 일정 당일만 삭제
export const deleteMedSingle = async (recordId: number, date: string) => {
    try {
        const res = await instance.delete(`${base_URL}/api/patients/medications/${recordId}/single?date=${date}`);
        console.log(res.data);
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// 특정 채팅방 진료 ai 요약 조회
export const fetchTreatmentSum = async (chatRoomId: number) => {
    try {
        const res = await instance.get(`${base_URL}/api/chats/${chatRoomId}/summary`)
        //console.log(res.data);
        return res.data;
    } catch (error) {
        console.log("상세 조회 오류: ", error);
        throw error;
    }
}

// 특정 채팅방 모든 메시지 기록 조회
export const fetchAllMessages = async (chatRoomId: number) => {
    try {
        const res = await instance.get(`${base_URL}/api/chats/${chatRoomId}/messages`)
        //console.log(res.data);
        return res.data;
    } catch (error) {
        console.log("진료 메세지 오류: ", error);
        throw error;
    }
}