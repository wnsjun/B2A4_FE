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

// 의사 추가
export const postDoctorInfo = async (data: FormData) => {
    try {
        const res = await instance.post('/api/hospitals/doctors', data, {
            headers: {
                "Content-Type": undefined,
            }
        })
        console.log("의사 정보 등록 성공", res.data);
        return res.data;
    } catch (error) {
        console.error("의사 등록 실패 : ", error);
        throw error;
    }
}
    

// QR 코드 조회
export const fetchDoctorQR = async (doctorId: number) => {
    try {
        const res = await instance.get(`/api/doctors/${doctorId}/qr`);
        console.log("QR 코드 조회 성공 : ", res.data);
        return res.data;
    } catch (error) {
        console.error("QR 코드 조회 실패 : ", error);
        throw error;
    }
}