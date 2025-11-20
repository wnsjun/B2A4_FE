import searchImg from "../../assets/doctor/search.svg";
import addImg from "../../assets/doctor/add_doctor.svg";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal";
import axios from "axios";
const base_URL = import.meta.env.VITE_API_URL;
const accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxNiIsInVzZXJUeXBlIjoiaG9zcGl0YWwiLCJpYXQiOjE3NjM2NDUzNTYsImV4cCI6MTc2MzY1NjE1Nn0.0lwXKnv2VpT0kCCObtDVG7RZIxchMkh6hxpP38nMPGI";


export interface Doctor {
    doctorId: number;
    name: string;
    specialty: string;
    imageURL: string | null;
    lastTreatment: string | null;
}

interface DoctorListProps {
    onAddDoctor: () => void;
}

const DoctorList: React.FC<DoctorListProps> = ({onAddDoctor}) => {
    const nav = useNavigate();
    const [doctorListData, setDoctorListData] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    
    const [name, setName] = useState("");
    const [isButtonClicked, setIsButtonClicked] = useState(false);
    const [selectDocId, setSelectDocId] = useState<number | null>(null);
    const [pw, setPw] = useState("");
    const [isValid, setIsValid] = useState(true);

    const postDocPincode = async () => {
        try {
            const res = await axios.post(`${base_URL}/api/hospitals/doctors/select-doctor`,
                {
                    doctorId : selectDocId,
                    pinCode: pw,
                }, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                    }
                }
            )
            console.log("의사 암호 전송 성공", res.data);
            setIsButtonClicked(false);
            setIsValid(true);
            setPw(""); 

            nav("/qr-checkin", {state: {DoctorData: selectedDoctor}});
            console.log(selectedDoctor);
        } catch (error) {
            console.error("암호 전송 실패 : ", error);
            setIsValid(false);
        }
    }

    useEffect(() => {
        const fetchDoctorList = async () => {
            try {
                const res = await axios.get(`${base_URL}/api/hospitals/doctors`, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                })

                console.log("의사 목록 조회 성공 : ", res.data.data);
                setDoctorListData(res.data.data);
            } catch (error) {
                console.error(error);

            }
        }
        fetchDoctorList();
    }, []);
    

    const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)

        //console.log(name);
    }

    const onChangePw = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPw(e.target.value);
        //setIsValid(false);
    }

    const searchDoctor = useMemo(() => {
        if (name.trim() === "") {
            return doctorListData;
        }
        const lowerCaseName = name.toLowerCase().trim();

        return doctorListData.filter(doctor => {
            const lowerCaseDocName = doctor.name.toLowerCase();
            const lowerCaseSpecialty = doctor.specialty.toLowerCase();

            return lowerCaseDocName.includes(lowerCaseName) ||
                lowerCaseSpecialty.includes(lowerCaseName);
            
        })
    }, [doctorListData, name])

    const handleInput = () => {
        console.log(name, "클릭")
    }

    const onClickList = (id: number) => {
        setSelectDocId(id);
        const docInfo = doctorListData.find(doctor => doctor.doctorId === id);
        setSelectedDoctor(docInfo || null);
    }

    const onClickButton = () => {
        setIsButtonClicked(true);
    }

    const isButtonActive = selectDocId !== null;

    const handleConfirm = () => {
        console.log("암호 확인", pw);
        postDocPincode();
    }

    const singleButton = [
        {
            label: '확인',
            onClick: handleConfirm,
            variant: 'colored' as const,
        }
    ]
    
    return (
        <div className="w-[400px] mx-auto flex flex-col gap-8 justify-center items-center">
            <div className="text-[24px] font-semibold text-[#343841] tracking-tighter">
                의사를 선택해 진료를 시작하세요
            </div>

            <div className="flex flex-col w-full gap-4">
                <div className="flex flex-row justify-between items-center gap-4">
                    <div className="flex flex-row items-center relative">
                        <input 
                            type="text" 
                            placeholder="검색어를 입력하세요"
                            onChange={onChangeInput}
                            value={name}
                            className="w-[360px] h-12 pl-2 border border-b-[#A9ACB2] border-x-0 border-t-0"
                        />
                        <img 
                            src={searchImg} 
                            alt="search" 
                            onClick={handleInput}
                            className="w-6 h-6 absolute right-4 cursor-pointer"/>
                    </div>
                    <div className="flex justify-center items-center w-6 h-6">
                        <img src={addImg} alt="add_doctor" className="cursor-pointer w-6 h-6" onClick={onAddDoctor}/>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {searchDoctor.length === 0 ? (
                        <div className="flex flex-col h-[350px] justify-center items-center">
                            <p className="text-[16px] text-[#666B76]">의사를 추가해주세요.</p>
                        </div>
                    ) : (
                    <div className="flex flex-col h-[350px] overflow-y-scroll">
                        {searchDoctor.map((doctor) => {
                            const isCurrentDoctorSelected = doctor.doctorId === selectDocId;
                            return (
                            <div key={doctor.doctorId} onClick={() => onClickList(doctor.doctorId)} className={`w-full h-[120px] p-4 hover:bg-[#F4F6F8] ${isCurrentDoctorSelected ? 'bg-[#F4F6F8]' : ''}`}>
                                <div className="flex flex-row gap-[23px] items-center">
                                    <div className="w-22 h-22 rounded-full bg-[#F4F6F8] flex flex-col items-center content-center justify-center">
                                        {doctor.imageURL ? (
                                            <img src={doctor.imageURL} alt={`${doctor.name} 프로필`} className="object-cover w-full h-full rounded-full" />
                                        ) : (
                                            <img src="/camera.svg" alt="카메라 아이콘" className="w-6" />
                                        )}
                                    </div>

                                    <div className="flex flex-col justify-center h-fit gap-1">
                                        <div className="flex flex-row items-end gap-2">
                                            <div className="text-[#343841] font-semibold text-[20px]">{doctor.name}</div>
                                            <div className="text-[#666B76] text-[12px] font-medium ">{doctor.specialty}</div>
                                        </div>

                                        <div className="flex flex-row gap-1 text-[#666B76] text-[12px] font-medium">
                                            <p>최근 진료</p>
                                            <p>{doctor.lastTreatment ? doctor.lastTreatment : '기록 없음'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )
                        })}
                    </div>
                    )}

                    <div>
                        <button 
                            className={`w-full h-14 rounded-xl text-[20px] font-semibold 
                            ${isButtonActive ? 'bg-[#3D84FF] text-white' : 'bg-[#F4F6F8] text-[#A9ACB2]'}`}
                            onClick={onClickButton}
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
            {selectedDoctor && (
            <Modal 
                isOpen={isButtonClicked}
                title="의사 암호를 입력해주세요"
                children = {
                    <>
                        <div className="w-[344px] flex flex-col gap-4">
                            <div className="h-22 flex flex-row gap-4 items-center">
                                <div className="w-22 h-22 rounded-full bg-[#F4F6F8] flex flex-col items-center content-center justify-center">
                                    {selectedDoctor.imageURL ? (
                                        <img src={selectedDoctor.imageURL} alt="프로필"  className="object-cover w-full h-full rounded-full"/>
                                    ) : (
                                        <img src="/camera.svg" alt="카메라 아이콘" className="w-6" />
                                    )}
                                    
                                </div>

                                <div className="flex flex-col justify-center h-fit gap-1">
                                    <div className="flex flex-row items-end gap-2">
                                        <div className="text-[#343841] font-semibold text-[20px]">{selectedDoctor.name}</div>
                                        <div className="text-[#666B76] text-[12px] font-medium ">{selectedDoctor.specialty}</div>
                                    </div>

                                    <div className="flex flex-row gap-1 text-[#666B76] text-[12px] font-medium">
                                        <p>최근 진료</p>
                                        <p>{selectedDoctor.lastTreatment || '기록 없음'}</p>
                                    </div>
                                </div>
                            </div>
                            {isValid ? (
                                <div className="flex flex-col w-full justify-center gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="의사 암호를 입력하세요"  
                                        onChange={onChangePw}
                                        value={pw}
                                        className="h-12 pl-2 placeholder-[#A9ACB2] border border-b-[#A9ACB2] border-t-0 border-x-0"  
                                    />
                                    <p className="font-medium text-[12px] text-[#A9ACB2] pl-2">영문, 숫자 포함 8자 이상</p>
                            </div>
                            ) : (
                                <div className="flex flex-col w-full justify-center gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="의사 암호를 입력하세요"  
                                        onChange={onChangePw}
                                        value={pw}
                                        className="h-12 pl-2 placeholder-[#A9ACB2] border border-b-[#F8645D] border-t-0 border-x-0"  
                                    />
                                    <p className="font-medium text-[12px] text-[#F8645D] pl-2">암호가 잘못되었어요</p>
                            </div>
                            )}
                                
                        </div>
                    </>
                }
                onCancel={() => {
                    setIsButtonClicked(false); 
                    setIsValid(true);
                    setPw("")
                }}
                isMobile={false}
                buttons={singleButton}
            />
            )}
        </div>
    )
}

export default DoctorList;