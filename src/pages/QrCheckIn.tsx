import WebTopbar from '../layouts/WebTopbar';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { fetchDoctorQR } from '../apis/DoctorAPI';
import { useAuthStore } from '../hooks/useAuthStore';

interface DoctorData {
  qr: string;
  doctorName: string;
  hospitalName: string | null;
  specialty: string;
  qrGeneratedAt: string;
  imageUrl?: string;
  profileImage?: string;
}

interface LocationState {
  DoctorData: {
    doctorId: number;
    name: string;
    specialty: string;
    imageURL: string | null;
    lastTreatment: string | null;
  };
}

const QrCheckIn = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const { doctorId: authDoctorId } = useAuthStore();
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQRData = async () => {
      try {
        setIsLoading(true);

        // location.state에서 doctorId를 가져오고, 없으면 localStorage 또는 useAuthStore에서 가져옴
        let doctorId = state?.DoctorData?.doctorId;
        if (!doctorId) {
          const localDoctorId = localStorage.getItem('doctorId');
          doctorId = localDoctorId ? parseInt(localDoctorId) : (authDoctorId ? parseInt(authDoctorId) : null);
        }

        if (!doctorId) {
          setError('의사 정보가 없습니다');
          return;
        }

        const response = await fetchDoctorQR(doctorId);

        if (response.success && response.data) {
          setDoctorData({
            qr: response.data.qr,
            doctorName: response.data.doctorName,
            hospitalName: response.data.hospitalName,
            specialty: response.data.specialty,
            qrGeneratedAt: response.data.qrGeneratedAt,
          });
        } else {
          setError('QR 코드를 불러올 수 없습니다');
        }
      } catch (err) {
        console.error('QR 코드 조회 실패:', err);
        setError('QR 코드를 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadQRData();
  }, [state, authDoctorId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center h-screen bg-white">
        <WebTopbar showDoctorReselect={true} showConsultationList={true} />
        <div className="flex-1 flex items-center justify-center">
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center h-screen bg-white">
        <WebTopbar showDoctorReselect={true} showConsultationList={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!doctorData) {
    return <div>데이터를 불러올 수 없습니다</div>;
  }

  return (
    <div className="flex flex-col items-center h-screen bg-white overflow-hidden">
      <WebTopbar showDoctorReselect={true} showConsultationList={true} />

      <div className="flex-1 pt-[91px] flex flex-col items-center gap-[49px] w-full overflow-y-auto">
        {/* 의사 정보 영역 */}
        <div className="flex flex-col gap-4 items-center">
          {/* 의사 프로필 이미지 */}
          <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gray-100">
            <img
              src={doctorData.profileImage}
              alt="doctor"
              className="w-full h-full object-cover"
            />
          </div>

          {/* 의사 이름 및 정보 */}
          <div className="flex flex-col gap-1 items-center">
            <div className="text-[24px] font-semibold text-[#343841] text-center">
              <span>{doctorData.doctorName}</span>
              <span>의사</span>
            </div>
            <div className="text-base font-normal text-[#666B76] text-center">
              {doctorData.hospitalName && (
                <>
                  <span>{doctorData.hospitalName}</span>
                  <span> · </span>
                </>
              )}
              <span>{doctorData.specialty}</span>
            </div>
          </div>
        </div>

        {/* QR코드 */}
        <div className="flex flex-col gap-8 items-center w-full px-10">
            <QRCodeSVG
              value={doctorData.qr}
              size={280}
              level="H"
            />
          <p className="text-[40px] font-semibold text-[#1a1a1a] text-center m-0">
            QR코드를 스캔하세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default QrCheckIn;
