import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner'; // QrScanner 라이브러리 임포트
import WaitTreat from '../components/WaitTreat';

const CamQR: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);

    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

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
    console.log(scanResult);

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