import axios from "axios";
import { useAuthStore } from "../hooks/useAuthStore";
const base_URL = import.meta.env.VITE_API_URL;
//const accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzIiwidXNlclR5cGUiOiJwYXRpZW50IiwiaWF0IjoxNzYzNzQ4NzUwLCJleHAiOjE3NjM3NTk1NTB9.i40ZELIj7nW9BZZo18JUTIyrk7fSKksQ_zBu_8ZNIRw";
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

// 특정 날짜 복약 일정 조회
export const fetchDailyRecord = async (date: string) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }
    try {
        const res = await axios.get(
            `${base_URL}/api/patients/medications?date=${date}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            }
        )
        //console.log("전송 성공:", res.data);
        return await res.data;
    } catch (error) {
        console.error("날짜별 복약 일정 조회 실패: ", error);
        throw error;
    }
}

// 특정 날짜 복약 여부 시간 별 조회
export const fetchDailyTake = async (date: string) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }
    try {
        const res = await axios.get(
            `${base_URL}/api/patients/medications/daily?date=${date}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            }
        )
        //console.log("전송 성공:", res.data);
        return await res.data;
    } catch (error) {
        console.error("날짜별 복약 일정 조회 실패: ", error);
        throw error;
    }
}

export const fetchAllTreatment = async (year: string, month: string) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }

    try {
        const res = await axios.get(`${base_URL}/api/patients/records/dates?year=${year}&month=${month}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        })
        console.log(res.data);
        return await res.data;
    } catch (error) {
        console.error("전체 진료 이력 조회 실패 : ", error);
        throw error;
    }
}

// 특정 날짜 진료 이력 조회
export const fetchDailyTreatment = async (date: string) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }

    try {
        const res = await axios.get(`${base_URL}/api/patients/records?date=${date}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        });
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
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }

    try {
        const res = await axios.post(`${base_URL}/api/patients/medications`, data, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            }
        })

        console.log("복약 일정 추가 성공: ", res.data);
        return res.data;
    } catch(error) {
        console.log("복약 일정 추가 실패 : ", error);
        throw error;
    }
}

// 복용 일정 수정
export const patchMedication = async (recordId: number, data: medProps) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }

    try {
        const res = await axios.patch(`${base_URL}/api/patients/medications/${recordId}`, data, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            }
        })

        console.log("복약 일정 수정 성공: ", res.data);
        return res.data;
    } catch(error) {
        console.log("복약 일정 수정 실패 : ", error);
        throw error;
    }
}

// 복용 여부 업데이트
export const updateMed = async (recordId: string, isTaken: boolean, date: string, period: string) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }

    try {
        const res = await axios.patch(`${base_URL}/api/patients/medications/${recordId}/history`, {
            date: date,
            taken: isTaken,
            period: period,
        }, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type" :'application/json',
            }
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
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }

    try {
        const res = await axios.delete(`${base_URL}/api/patients/medications/${recordId}/after?date=${date}`, {
            headers: {
                'Authorization' : `Bearer ${accessToken}`,
            }
        });
        console.log(res.data);
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}


// 복약 일정 당일만 삭제
export const deleteMedSingle = async (recordId: number, date: string) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
        console.error("accessToken이 없습니다.");
        throw new Error("Authorization token not found");
    }

    try {
        const res = await axios.delete(`${base_URL}/api/patients/medications/${recordId}/single?date=${date}`, {
            headers: {
                'Authorization' : `Bearer ${accessToken}`,
            }
        });
        console.log(res.data);
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}