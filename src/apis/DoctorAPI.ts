import instance from '../utils/axiosInstance';

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
        const res = await instance.get('/api/hospitals/doctors');

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
        const res = await instance.post('/api/hospitals/doctors/select-doctor',
            {
                doctorId : doctorId,
                pinCode: pinCode,
            }
        )
        console.log("의사 암호 전송 성공", res.data);
        return res.data;
    } catch (error) {
        console.error("암호 전송 실패 : ", error);
        throw error;
    }
}