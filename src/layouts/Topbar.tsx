import React from 'react';
import TypoLogo from '../components/TypoLogo';
import { topHeader } from '../styles/typography';
import { useNavigate } from 'react-router-dom';
import StarOffIcon from '../assets/hospitalmap/star-off.svg';
import SettingIcon from '../assets/topbar/setting.svg';

interface TopbarProps {
  title?: string;
  showLogo?: boolean;
  type?: string;
  setting?: boolean;
  onStarClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({
  title,
  showLogo = false,
  type = '',
  onStarClick,
  setting,
}) => {
  const nav = useNavigate();

  return type === 'header' ? (
    <div
      style={{
        width: '360px',
        margin: '0 auto',
        padding: '14px 20px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <img
          src="/goback.svg"
          onClick={() => nav(-1)}
          style={{
            position: 'absolute',
            left: '0',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
          }}
        />
        <div style={topHeader}>{title}</div>
      </div>
    </div>
  ) : (
    <div
      className="topbar-container"
      style={{
        width: '360px',
        height: '52px',
        background: 'var(--Greyscale-White, #FFF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {showLogo ? (
        <>
          <TypoLogo width={48} height={27} />
          <img
            src={StarOffIcon}
            alt="star"
            onClick={onStarClick}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
            }}
          />
        </>
      ) : (
        <span
          style={{
            fontFamily: 'Pretendard',
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '150%',
            letterSpacing: '-0.32px',
          }}
        >
          {title}
        </span>
      )}
      {setting && (
        <div
          className="flex justify-between w-[24px] h-[24px]"
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer', // 클릭 가능하도록 커서 추가
          }}
        >
          <img src={SettingIcon} onClick={() => nav('/setting')} />
        </div>
      )}
    </div>
  );
};

export default Topbar;
