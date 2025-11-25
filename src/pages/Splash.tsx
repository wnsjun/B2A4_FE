import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TypoLogo from '../assets/typologo.svg';

const SplashPageWeb = () => {
  const navigate = useNavigate();
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    const navigateTimer = setTimeout(() => {
      navigate('/logointro', { replace: true });
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(navigateTimer);
    };
  }, [navigate]);

  return (
    <div
      className={`flex h-screen flex-col justify-center items-center p-[16px] transition-opacity duration-500 ease-out 
                  ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <img src={'/sonbit.svg'} alt="손빛 로고" className="splash-logo" />
      <img src={TypoLogo} className="w-[64px] mt-[13px]" />
    </div>
  );
};

export default SplashPageWeb;
