import { useEffect, useState } from "react";
import dotsImg from "../../assets/calendar/dots.svg";
import vectorImg from "../../assets/calendar/right_vector.svg";
import checkImg from "../../assets/calendar/check.svg";
import defaultImg from "../../assets/calendar/check_default.svg";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal";
//const accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzIiwidXNlclR5cGUiOiJwYXRpZW50IiwiaWF0IjoxNzYzNjE0NjgzLCJleHAiOjE3NjM2MjU0ODN9.1kMfm-jJKZvEnx8lJ4r3Ikt2VM_kZsJefj7zBDoNz4g";

export interface MedicalTreatment {
  year: number;
  month: number;
  dates: string[];
}


const mapPeriod = (period: string) : string => {
    switch (period.toLowerCase()) {
        case 'morning': return '아침';
        case 'lunch' : return '점심';
        case 'dinner' : return '저녁';
        case 'bedtime' : return '취침 전';
        default : return period;
    }
}

const MedicationSelectionModalContent = ({medicationRecords, handleModalMedicationClick, modalCheckedStatus}: any) => {
    return (
        <>
            {medicationRecords.map((medication: any) => (
                <div key={medication.recordId} className="py-4"
                    onClick={handleModalMedicationClick(medication.recordId)}
                >
                    <div className="flex flex-row gap-4 items-center">
                        <div>
                            {modalCheckedStatus[medication.recordId] ? (
                                <img src={checkImg} alt="checked" />
                            ) : (
                                <img src={defaultImg} alt="not_checked" />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <div>
                                {medication.name}
                            </div>
                            <div className="font-medium text-[12px] text-[#666B76]">
                                {medication.schedules.map((s: any) => mapPeriod(s.period)).join('. ')}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}

interface Props {
    selectedMonth : String,
    selectedDay : String,
    onDateClick : (day: Date) => void,
    isClicked : boolean,
    recordData: any[],
    calendarMedTreat?: MedicalTreatment | null;
}

const DailyRecord = ({selectedMonth, selectedDay, isClicked, recordData, calendarMedTreat} : Props) => {
    const nav = useNavigate();

    const medicationRecords = recordData || [];
    const hasMed = medicationRecords.length > 0;

    const [checkedStatus, setCheckedStatus] = useState<Record<number, boolean>>({});
    const [isOpen, setIsOpen] = useState(false);
    const [hasMedicalRecord, setHasMedicalRecord] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDelModal, setOpenDelModal] = useState(false);
    const [openSubModal, setSubModal] = useState(false);

    const [selectedMedicationId, setSelectedMedicationId] = useState<number | null>(null);
    const [modalCheckedStatus, setModalCheckedStatus] = useState<Record<number, boolean>>({});

    const handleConfirm = () => {
        setOpenEditModal(false);
        if (selectedMedicationId !== null) {
            nav(`/edit-schedule?recordId=${selectedMedicationId}`);
        } else {
            alert("수정할 복약 일정을 선택해주세요.");
        }
    }

    const handleDelete = () => {
        setOpenDelModal(false);
        setSubModal(true);
    }

    const handleDeleteAll = () => {
        setSubModal(false);
    }

    const handleDeleteOnly = () => {
        setSubModal(false);
    }

    const handleModalMedicationClick = (recordId: number) => () => {
        setSelectedMedicationId(prevId => prevId === recordId ? null : recordId);
        setModalCheckedStatus({ [recordId]: !(selectedMedicationId === recordId) });
    };
   
    const doubleButton = [
        { label: '취소', onClick: () => setOpenEditModal(false), variant: 'default' as const,},
        { label: '수정', onClick: handleConfirm, variant: 'colored' as const,}
    ]

    const double1Button = [
        { label: '취소', onClick: () => setOpenDelModal(false), variant: 'default' as const,},
        { label: '삭제', onClick: handleDelete, variant: 'colored' as const,}
    ]

    const double2Button = [
        { label: '모든 일정 삭제', onClick: handleDeleteAll, variant: 'default' as const,},
        { label: '이 일정만 삭제', onClick: handleDeleteOnly, variant: 'colored' as const,}
    ]

    
    // recordData 변경될 때마다 체크 상태 초기화
    useEffect(() => {
        const initialStatus: Record<number, boolean> = {};
        medicationRecords.forEach((med: any) => {
            med.schedules.forEach((schdule: any) => {
                initialStatus[schdule.scheduleId] = false;
            });
        });
        setCheckedStatus(initialStatus);
        setModalCheckedStatus({});

    }, [recordData]);

    useEffect(() => {
        let recordExists = false;

        if (calendarMedTreat && selectedMonth && selectedDay) {
            const currentYear = calendarMedTreat.year;
            const formatMonth = String(selectedMonth).padStart(2, '0');
            const formatDay = String(selectedDay).padStart(2, '0');

            const selectedDate = `${currentYear}-${formatMonth}-${formatDay}`;

            recordExists = calendarMedTreat.dates.includes(selectedDate);
        }
        setHasMedicalRecord(recordExists);
    }, [calendarMedTreat, selectedMonth, selectedDay]);


    const onToggle = () => setIsOpen(!isOpen);
    const onOptionClick = (value: string, index: number) => () => {
        console.log(value);
        setIsOpen(false);
        
        if (index === 1) setOpenEditModal(true);
        else setOpenDelModal(true);
    }


    // 복약 체크 클릭 핸들러: 해당 스케줄 ID의 상태를 토글
    const onClickCheck = (scheduleId: number) => () => {
        setCheckedStatus(prevStatus => ({
            ...prevStatus,
            [scheduleId]: !prevStatus[scheduleId]
        }));
    }
    //console.log(checkedStatus);

    return (
        <div className="h-[190px] flex justify-center">
        {isClicked && recordData ? (
            <div className="w-full flex flex-col gap-2">
                <div className="w-full h-6 flex flex-row justify-between text-[#666B76] font-bold">
                    <div>{selectedMonth}월 {selectedDay}일</div>
                    <div className="cursor-pointer" onClick={onToggle}>
                        <img src={dotsImg} alt="edit" />
                    </div>
                </div>
                <div className="flex justify-end">
                {isOpen && (
                    <div className="px-4 flex flex-col items-center justify-center absolute bg-[#ffffff] rounded-lg">
                        <div 
                            onClick={onOptionClick("수정", 1)}
                            className="h-10 rounded-lg flex justify-center items-center cursor-pointer"
                        >
                            복약 일정 수정
                        </div>
                        <div 
                            onClick={onOptionClick("삭제", 2)}
                            className="h-10 rounded-lg flex justify-center items-center cursor-pointer"
                        >
                            복약 일정 삭제
                        </div>
                    </div>
                )}
                </div>

                <div className="w-full overflow-y-scroll">
                    <div className="bg-[#F4F6F8] rounded-xl px-5 flex flex-row justify-between items-end">
                        {hasMedicalRecord ? (
                            <>
                            <div className="flex flex-col my-4 gap-1">
                                <div>
                                    복통 및 어지러움 호소
                                </div>
                                <div className="text-[#666B76] text-[12px]">
                                    09:00
                                </div>
                            </div>

                            <div className="my-4">
                                <div className="flex flex-row gap-[9px] cursor-pointer text-[#0C58FF]">
                                    <div>상세보기</div>
                                    <img src={vectorImg} alt="more_info"  />
                                </div> 
                            </div>
                            </>
                        ) : (
                            <div className="my-6 w-full flex justify-center items-center text-[#666B76] text-[12px]">
                                진료 기록은 진료 시 자동으로 추가돼요.
                            </div>
                        )}
                    </div>
                    <div className="px-5 flex flex-col justify-between">
                        {hasMed ? (
                            <>
                            {medicationRecords.map((medication: any) => (
                                <div key={medication.recordId} className="flex flex-row justify-between">
                                    <div className="flex flex-col my-4 gap-1">
                                        <div>
                                            {medication.name} 
                                        </div>
                                        <div>
                                            {medication.schedules.map((s: any) => mapPeriod(s.period)).join('. ')} 
                                        </div>
                                    </div>

                                    <div className="my-4 flex flex-row items-end">
                                        {medication.schedules.map((schedule: any) => (
                                            <div 
                                                key={schedule.scheduleId} 
                                                className="w-8 h-8 items-center flex cursor-pointer"
                                                onClick={onClickCheck(schedule.scheduleId)}
                                            >
                                                {checkedStatus[schedule.scheduleId] ? (
                                                    <img src={checkImg} alt="Checked" />
                                                ) : (
                                                    <img src={defaultImg} alt="Unchecked" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            </>
                        ) : (
                            <div className="w-full flex justify-center items-center my-[30px]">
                                <button 
                                    className="font-semibold text-[12px] text-[#666B76] cursor-pointer"
                                    onClick={() => nav("/add-schedule")}    
                                >
                                    복약 일정 추가 +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex items-center text-[#666B76]">
                <div>날짜를 선택하세요.</div>
            </div>
        )}
        
        {<Modal 
            isOpen={openEditModal}
            title="복약 일정 수정"
            onCancel={() => {
                setOpenEditModal(false); 
                setSelectedMedicationId(null);
                setModalCheckedStatus({});
            }}
            description={
                <p>수정할 일정을 선택해주세요</p>
            }
            children={
                <MedicationSelectionModalContent
                    medicationRecords={medicationRecords}
                    handleModalMedicationClick={handleModalMedicationClick}
                    modalCheckedStatus={modalCheckedStatus}
                />
            }
            buttons={doubleButton}
        />}

        {<Modal 
            isOpen={openDelModal}
            title="복약 일정 삭제"
            onCancel={() => {
                setOpenDelModal(false); 
                setSelectedMedicationId(null);
                setModalCheckedStatus({});
            }}
            description={
                <p>삭제할 일정을 선택해주세요</p>
            }
            children={
                <MedicationSelectionModalContent
                    medicationRecords={medicationRecords}
                    handleModalMedicationClick={handleModalMedicationClick}
                    modalCheckedStatus={modalCheckedStatus}
                />
            }
            buttons={double1Button}
        />}

        {<Modal 
            isOpen={openSubModal}
            title="복약 일정 삭제"
            onCancel={() => {
                setSubModal(false); 
                setSelectedMedicationId(null);
            }}
            description={
                <>
                    <p>이 일정만 삭제할까요,</p>
                    <p>앞으로 반복되는 모든 일정을 삭제할까요?</p>
                </>
            }
            buttons={double2Button}
        />}

        </div>

        
    )
}

export default DailyRecord;