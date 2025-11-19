import { useEffect, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

export const useKakaoMaps = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      setIsReady(true);
      return;
    }

    // 스크립트가 이미 로딩 중인지 확인
    const existingScript = document.querySelector(
      'script[src*="dapi.kakao.com"]'
    );

    if (existingScript) {
      // 기존 스크립트가 있으면 로드 완료 대기
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
          setIsReady(true);
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    // 스크립트 동적 로드
    const script = document.createElement('script');
    script.src =
      '//dapi.kakao.com/v2/maps/sdk.js?appkey=c35c8c52f9e6328f8b69943513666691&autoload=false';
    script.async = true;

    script.onload = () => {
      // Kakao Maps SDK의 load 메서드가 있으면 호출
      if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
        window.kakao.maps.load(() => {
          setIsReady(true);
        });
      } else {
        // Fallback
        setIsReady(true);
      }
    };

    script.onerror = () => {
      setError('Kakao Maps SDK failed to load');
    };

    document.head.appendChild(script);

    return () => {
      // 정리 로직 (필요시)
    };
  }, []);

  return { isReady, error };
};
