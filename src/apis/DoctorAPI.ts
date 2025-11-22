import axios from "axios";
const base_URL = import.meta.env.VITE_API_URL;
const accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxNiIsInVzZXJUeXBlIjoiaG9zcGl0YWwiLCJpYXQiOjE3NjM3MTgwMzIsImV4cCI6MTc2MzcyODgzMn0.H_whtx9Jetds9IBN_Ps3TPPAa-fk3hhq0PKsqZmChjc"

export interface Doctor {
    doctorId: number;
    name: string;
    specialty: string;
    imageURL: string | null;
    lastTreatment: string | null;
}

// 의사 목록 가져오기
export const fetchDoctorList = async () => {
    try {
        const res = await axios.get(`${base_URL}/api/hospitals/doctors`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })

        console.log("의사 목록 조회 성공 : ", res.data.data);
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// 의사 암호 확인
export const postDocPincode = async (doctorId:number, pinCode: string) => {
    try {
        const res = await axios.post(`${base_URL}/api/hospitals/doctors/select-doctor`,
            {
                doctorId : doctorId,
                pinCode: pinCode,
            }, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                }
            }
        )
        console.log("의사 암호 전송 성공", res.data);
        return res.data;
    } catch (error) {
        console.error("암호 전송 실패 : ", error);
        throw error;
    }
}