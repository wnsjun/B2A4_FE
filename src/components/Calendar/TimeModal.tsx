import { useEffect,  useState } from "react";

const hours = Array.from({length: 12}, (_, i) => String(i+1).padStart(2, '0'));
const minutes = Array.from({length: 60}, (_, i) => String(i).padStart(2, '0'));
const daynight = ['AM', 'PM'];
const ITEM_HEIGHT = 56;

interface WheelItemProps {
  label: string;
  isSelected: boolean;
}

const WheelItem: React.FC<WheelItemProps> = ({label, isSelected}) => (
  <div 
    className={`scroll-snap-align-center h-14 text-[32px] justify-center items-center flex transition-colors duration-200
      ${isSelected ? "text-black" : "text-[#A9ACB2]"}`}
  >
      {label}
  </div>
)

interface TimeModalProps {
  onChangeTime?: (time : {
    hour: string;
    minute: string;
    period: string;
  }) => void;
}


const TimeModal: React.FC<TimeModalProps> = ({onChangeTime}) => {
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);
  const [selectedMinIndex, setSelectedMinIndex] = useState(0);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);

  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    listLength: number
  ) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop/ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, listLength - 1));
    setIndex(clampedIndex);
  }

  useEffect(() => {
    onChangeTime?.({
      hour: hours[selectedHourIndex],
      minute: minutes[selectedMinIndex],
      period: daynight[selectedPeriodIndex],
    });
  }, [selectedHourIndex, selectedMinIndex, selectedPeriodIndex]);

    return (
        <div className="flex justify-center items-center">
          <div className="w-[239px] h-40 overflow-hidden flex flex-row justify-center items-center">
            <div className="relative h-full w-14">
                <div className="absolute w-full top-1/2 h-14 -translate-y-1/2 border-y-2 border-[#E2E4E8] pointer-events-none z-10"></div>
                
                <div 
                    className="w-full h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
                    onScroll={(e) => handleScroll(e, setSelectedHourIndex, hours.length)}
                >
                    <div className="h-[calc(50%-28px)]"></div> 
                    {hours.map((h, idx) => <WheelItem key={h} label={h} isSelected={idx === selectedHourIndex} />)}
                    <div className="h-[calc(50%-28px)]"></div>
                </div>
            </div>


            <div className="text-black flex mx-2 items-center text-[32px] font-medium">:</div>

            <div className="relative h-full w-[58px]">
                <div className="absolute w-full top-1/2 h-14 -translate-y-1/2 border-y-2 border-[#E2E4E8] pointer-events-none z-10"></div>
                
                <div
                    className="w-full h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
                    onScroll={(e) => handleScroll(e, setSelectedMinIndex, minutes.length)}
                >
                    <div className={`h-[calc(50%-${ITEM_HEIGHT/2}px)]`}></div> 
                    {minutes.map((m, idx) => <WheelItem key={m} label={m} isSelected={idx === selectedMinIndex} />)}
                    <div className={`h-[calc(50%-${ITEM_HEIGHT/2}px)]`}></div>
                </div>
            </div>
                
            <div className="relative h-full w-[68px] ml-4">
                <div className="absolute w-full top-1/2 h-14 -translate-y-1/2 border-y-2 border-[#E2E4E8] pointer-events-none z-10"></div>
                
                <div
                    className="w-full h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
                    onScroll={(e) => handleScroll(e, setSelectedPeriodIndex, daynight.length)}
                >
                    <div className={`h-[calc(50%-${ITEM_HEIGHT/2}px)]`}></div> 
                    {daynight.map((p, idx) => <WheelItem key={p} label={p} isSelected={idx === selectedPeriodIndex} />)}
                    <div className={`h-[calc(50%-${ITEM_HEIGHT/2}px)]`}></div>
                </div>
            </div>
            
          </div>
        </div>
    )
}

export default TimeModal;


