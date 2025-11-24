import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { useChatStore } from '../hooks/useChatStore';
import { scanQRAndCreateChat } from '../apis/chatApi';
import WaitTreat from '../components/WaitTreat';

const CamQR: React.FC = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const { setChatRoom } = useChatStore();

    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);

    // QR 스캔 결과 처리 - 채팅방 생성 및 네비게이션
    useEffect(() => {
        if (!scanResult || isCreatingChat) return;

        const createChatRoom = async () => {
            setIsCreatingChat(true);
            try {
                // 채팅방 생성 API 호출
                const response = await scanQRAndCreateChat(scanResult);
                console.log('[CamQR] API Response:', response);
                const chatRoomId = response?.data?.chatRoomId;
                const token = localStorage.getItem('accessToken');
                console.log('[CamQR] chatRoomId:', chatRoomId, 'accessToken:', token);

                if (chatRoomId && token) {
                    // localStorage에 저장
                    localStorage.setItem('chatRoomId', chatRoomId.toString());
                    localStorage.setItem('userId', '1'); // 환자 ID는 실제 사용자 정보에서 가져오기
                    localStorage.setItem('accessToken', token);

                    // 채팅 상태 저장 (WebSocket 구독은 PatientChat에서 처리)
                    setChatRoom(chatRoomId.toString(), 'patient', '1');

                    console.log('[CamQR] 채팅방 생성 완료:', chatRoomId);

                    // 사전질문 페이지로 이동
                    navigate('/pre-question1');
                } else {
                    throw new Error('채팅방 생성 실패');
                }
            } catch (err) {
                console.error('[CamQR] Failed to create chat:', err);
                setError('채팅방 생성 실패');
                setIsSuccess(false);
                setScanResult(null);
                setIsCreatingChat(false);
                // 다시 스캔 시작
                if (qrScannerRef.current) {
                    qrScannerRef.current.start();
                }
            }
        };

        createChatRoom();
    }, [scanResult, isCreatingChat, navigate, setChatRoom]);

    useEffect(() => {
        if (!videoRef.current) return;

        const videoElement = videoRef.current;

        try {
            qrScannerRef.current = new QrScanner(
                videoElement,
                result => {
                    setScanResult(result.data);
                    qrScannerRef.current?.stop();
                    setIsScanning(false);
                    setIsSuccess(true);
                },
                {
                    maxScansPerSecond: 2,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    preferredCamera: 'environment',
                    onDecodeError: (error) => {
                        console.log(error);
                    }
                }
            )
            // 스캔 시작
            qrScannerRef.current.start()
                .then(() => {
                    setIsScanning(true);
                    setError(null);
                })
                .catch(error => {
                    console.error(error);
                    setError('오류');
                    setIsScanning(false);
                })
        } catch (error) {
            console.error('QrScanner 초기화 실패: ', error);
            setError('스캐너 초기호 중 문제 발생');
        }

        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
            }
        }
    }, []);

    if (isSuccess) {
        return (
            <div className='w-screen h-screen'>
                <WaitTreat />
            </div>
        )
    }

    return (
    <div className="relative min-h-screen overflow-hidden">
    
        <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline autoPlay muted
        />

        {/* 오버레이 - 바깥만 어둡게 */}
        <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[calc(50%-120px)] bg-black/50" />
        <div className="absolute bottom-0 left-0 w-full h-[calc(50%-120px)] bg-black/50" />
        <div className="absolute top-[calc(50%-120px)] left-0 w-[calc(50%-120px)] h-60 bg-black/50" />
        <div className="absolute top-[calc(50%-120px)] right-0 w-[calc(50%-120px)] h-60 bg-black/50" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-60 h-60">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                {(!isScanning && !scanResult && !error) && ( 
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-lg font-semibold"> 
                        카메라 로드 중... 
                    </div> 
                )} 
                {error && ( 
                    <div className="absolute inset-0 flex items-center justify-center bg-red-800/80 text-white p-4 text-sm"> 
                        {error} 
                    </div> 
                )}
            </div>
        </div>
    </div>

    )
};


export default CamQR;