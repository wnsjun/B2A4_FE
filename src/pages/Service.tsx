import React from 'react';
import { useState } from 'react';
import Button from '../components/Button';
import { expereinceText, headerText } from '../styles/typography';
import { useLocation, useNavigate } from 'react-router-dom';
import Topbar from '../layouts/Topbar';

const FirstPage = ({ first = false, name = '' }) => {
  return (
    <>
      {first ? (
        <div className="flex h-full w-screen flex-col justify-end items-center content-center">
          <img className="w-[96px] h-[96px]" src="/bit_1.svg" />
          <div className="flex flex-col gap-y-[16px]">
            <div style={headerText} className="text-center mt-[74px] flex flex-row">
              <div className="text-transparent font-alice bg-clip-text bg-gradient-to-br from-[#0F58FF] to-[#3FB6FF]">
                {name}
              </div>
              <div>님, 환영합니다.</div>
            </div>

            <div className="flex justify-center items-center text-center">
              <div style={expereinceText}>
                여러분의 빛이 꺼지지 않도록
                <br />
                손빛이 최선을 다해 진료를 도울게요
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full w-screen flex-col justify-end items-center content-center">
          <div>
            <img className="w-[96px] h-[96px] mx-auto " src="/bit_1.svg" />
            <div className="flex flex-col gap-y-[16px]">
              <div style={headerText} className="text-center mt-[65px]">
                농인 진료 도움 서비스 <br />
                <div className="flex flex-row text-center justify-center">
                  <div className="text-transparent font-alice bg-clip-text bg-gradient-to-br from-[#0F58FF] to-[#3FB6FF]">
                    손빛
                  </div>
                  입니다
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SecondPage = () => {
  return (
    <div className="flex h-full w-screen flex-col justify-end mb-[24px] gap-y-[54px] items-center content-center">
      <div>
        <img src="serv_map.svg" className="mb-[28px]" />
        <div className="flex flex-col justify-center items-center text-center gap-y-[28px]">
          <div style={headerText}>
            <div>지도를 통해</div>
            <div className="flex flex-row">
              <div className="text-transparent font-alice bg-clip-text bg-gradient-to-br from-[#0F58FF] to-[#3FB6FF]">
                손빛
              </div>
              이 닿는 병원을 찾아요
            </div>
          </div>
          <div style={expereinceText}>현재 위치 근처를 탐색할 수 있어요</div>
        </div>
      </div>
    </div>
  );
};

const ThirdPage = () => {
  return (
    <div className="flex flex-1 h-full w-screen flex-col gap-y-[54px] justify-end mb-[45px] items-center content-center">
      <img src="serv_qr.svg" />
      <div>
        <div className="flex flex-col gap-y-[16px] justify-center items-center text-center">
          <div style={headerText}>
            QR코드를 스캔해서<br></br>진료를 시작해요
          </div>
          <div style={expereinceText}>
            진료 중 의사와 내 대화를<br></br>화면을 통해 확인할 수 있어요
          </div>
        </div>
      </div>
    </div>
  );
};

const FourthPage = () => {
  return (
    <div className="flex h-full w-screen flex-col justify-end mb-[45px] gap-y-[54px] items-center content-center">
      <img src="serv_calendar.svg" />
      <div>
        <div className="flex flex-col gap-y-[16px] justify-center items-center text-center">
          <div style={headerText}>지난 진료 기록을 확인해요</div>
          <div style={expereinceText}>
            캘린더에서 진료 기록을 확인하고<br></br>복약 일정을 추가할 수 있어요
          </div>
        </div>
      </div>
    </div>
  );
};

const Service = () => {
  const nav = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(0);
  const receivedName = (location.state as { fromSignup?: boolean; userName?: string })?.userName;
  const isFirstVisit = (location.state as { fromSignup?: boolean })?.fromSignup === true;
  const pages = [
    <FirstPage first={isFirstVisit} name={receivedName} />,
    <SecondPage />,
    <ThirdPage />,
    <FourthPage />,
  ];
  const totalPages = 3;

  const nextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const midPoint = e.currentTarget.offsetWidth / 2;
    if (clickX > midPoint) {
      nextPage();
    } else {
      prevPage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {isFirstVisit ? <></> : <Topbar title="서비스 안내" type="header" />}
      <div className={'flex-1 overflow-hidden'} onClick={handleContainerClick}>
        <div
          className={'flex h-full transition-transform duration-500 ease-in-out'}
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((page, index) => (
            <div key={index} className={'w-full h-full flex-shrink-0'}>
              {page}
            </div>
          ))}
        </div>
      </div>
      <div
        id="하단 바"
        className={'static mb-[24px]' + (isFirstVisit ? ' mt-[48px]' : ' mt-[150px]')}
      >
        <div className="flex flex-row gap-[12px] my-[32px] justify-center">
          {/* 슬라이더 용 버튼 */}
          <div
            className={
              `w-[8px] h-[8px] rounded-full outline-0 ` +
              (currentPage === 0 ? 'bg-[#3D84FF]' : 'bg-[#E2E4E8]')
            }
            onClick={() => setCurrentPage(0)}
          />
          <div
            className={
              `w-[8px] h-[8px] rounded-full outline-0 ` +
              (currentPage === 1 ? 'bg-[#3D84FF]' : 'bg-[#E2E4E8]')
            }
            onClick={() => setCurrentPage(1)}
          />
          <div
            className={
              `w-[8px] h-[8px] rounded-full outline-0 ` +
              (currentPage === 2 ? 'bg-[#3D84FF]' : 'bg-[#E2E4E8]')
            }
            onClick={() => setCurrentPage(2)}
          />
          <div
            className={
              `w-[8px] h-[8px] rounded-full outline-0 ` +
              (currentPage === 3 ? 'bg-[#3D84FF]' : 'bg-[#E2E4E8]')
            }
            onClick={() => setCurrentPage(3)}
          />
        </div>
        {isFirstVisit ? (
          <div className="flex justify-center items-center">
            <Button
              variant={currentPage === 3 ? 'colored' : 'default'}
              onClick={() => nav('/hospitalmap')}
            >
              확인
            </Button>
          </div>
        ) : (
          <></>
        )}
      </div>

      <div></div>
    </div>
  );
};

export default Service;
