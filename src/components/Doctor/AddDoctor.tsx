import Modal from "../Modal";
import SelectBox from "./SelectBox"
import { useMemo, useRef, useState } from "react"
import axios from "axios";
const base_URL = import.meta.env.VITE_API_URL;
const accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxNiIsInVzZXJUeXBlIjoiaG9zcGl0YWwiLCJpYXQiOjE3NjM2NDUzNTYsImV4cCI6MTc2MzY1NjE1Nn0.0lwXKnv2VpT0kCCObtDVG7RZIxchMkh6hxpP38nMPGI";

interface AddDoctorProps {
    onComplete: () => void;
}

const AddDoctor: React.FC<AddDoctorProps> = ({onComplete}) => {
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [pw, setPw] = useState("");
    const [selectImg, setSelectImg] = useState<string | null>(null);
    const [selectFile, setSelectFile] = useState<File | null>(null);

    const [modal, setModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const postDoctorInfo = async (data: FormData) => {
        for (const [key, value] of data.entries()) {
            console.log(key, value);
        };

        try {
            const res = await axios.post(
                `${base_URL}/api/hospitals/doctors`, data, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": 'multipart/form-data',
                    }
                }
            )
            console.log("의사 정보 등록 성공", res.data);
            setModal(true);
        } catch (error) {
            console.error("의사 등록 실패 : ", error);
            alert("의사 등록에 실패했습니다. 다시 시도해주세요.");
        }
    }

    const handleNameChange = (e : React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);
    const handlePwChange = (e : React.ChangeEvent<HTMLInputElement>) => setPw(e.target.value);
    const handleImageClick = () => {
        fileInputRef.current?.click();
    }

    const handleImageChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setSelectImg(null);
            setSelectFile(null);
            return;
        }

        const imageURL = URL.createObjectURL(file);
        setSelectImg(imageURL);
        setSelectFile(file);
    }

    //console.log(name, subject, pw);
    const isPwValid = pw.length >= 8;
    const isSubmit = name.trim() !== "" && subject !== "" && pw.trim() !== "";
    const isFormValid = isPwValid && isSubmit;

    const pwValidation = useMemo(() => {
        const errors = {
            minLength: true,
            hasValidPw: true,
            message: "",
        };

        if (pw.length < 8) {
            errors.minLength = false;
            errors.message = "최소 8자 이상으로 입력해주세요";
        }

        const pattern = /^(?=.*[a-zA-Z])(?=.*[0-9]).*$/;
        if (!pattern.test(pw) && pw.length > 0) {
            errors.hasValidPw = false;
            errors.message = "영문과 숫자를 모두 포함해주세요";
        }

        return {
            ...errors,
            isValid: errors.minLength && errors.hasValidPw && pw.length > 0,
        }
    }, [pw])

    const handleSubmit = (e : React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formData = new FormData();

        if (selectFile) {
            formData.append('image', selectFile);
        }

        const doctorData = {
            name: name.trim(),
            specialty: subject,
            pinCode: pw,
        }

        const jsonData = new Blob([JSON.stringify(doctorData)], {type: 'application/json'});

        formData.append('request', jsonData);
        
        postDoctorInfo(formData);
    }

    const handleConfirm = () => {
        setModal(false);
        onComplete();
    }

    const singleButton = [
        {
            label: '확인',
            onClick: handleConfirm,
            variant: 'colored' as const,
        }
    ]
    
    return (
        <div className="flex flex-col gap-[137px] mx-auto">
            <div className="flex justify-center items-center">
                <p className="font-semibold text-[24px] text-[#343841] tracking-tighter">등록할 의사 정보를 입력해주세요</p>
            </div>

            <form className="flex flex-col gap-[120px]" onSubmit={handleSubmit}>
                <div className="flex flex-row gap-20">

                    <div
                        className="w-52 h-52 bg-[#F4F6F8] rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
                        onClick={handleImageClick}
                    >
                        {!selectImg ? (
                            <div className="flex flex-col items-center gap-2">
                                <img src="/camera.svg" alt="add_image" className="w-8 h-8" />
                                <p className="font-medium text-[14px] text-[#A9ACB2]">사진을 선택해주세요</p>
                            </div>
                        ) : (
                            <img src={selectImg} alt="profile" className="object-cover w-full h-full" />
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </div>


                    <div className="flex flex-col gap-6">
                        <div className="flex flex-row gap-4">
                            <div className="">
                                <p>이름</p>
                                <input 
                                    type="text" 
                                    placeholder="이름을 입력하세요"
                                    value={name}
                                    onChange={handleNameChange}
                                    className="w-48 h-12 border border-b-[#A9ACB2] border-t-0 border-x-0 pl-2 py-3 tracking-[-0.02em] placeholder:color-[#A9ACB2]"
                                />
                            </div>
                            
                            <div className="">
                                <SelectBox 
                                    label="진료 과목"
                                    options={["내과.가정의학과", "외과.정형외과", "이비인후과", "안과", "피부과", 
                                        "산부인과", "소아청소년과", "정신 건강의학과", "치과", "한의원", "기타"
                                    ]}
                                    placeholder="진료 과목을 선택하세요"
                                    selectedValue={subject}
                                    handleChange={(value) => setSubject(value)}
                                    disabled={false}
                                />
                            </div>
                        </div>

                        <div className="w-full">
                            <p>의사 암호</p>
                            <input 
                                type="password" 
                                placeholder="의사 암호를 입력하세요"
                                value={pw}
                                onChange={handlePwChange}
                                required
                                minLength={8}
                                className="w-100 h-12 border border-b-[#A9ACB2] border-t-0 border-x-0 pl-2 py-3 tracking-[-0.02em] placeholder:color-[#A9ACB2]"
                            />
                            
                            <p className={`pl-2 mt-2 text-[12px] font-medium transition duration-150 ${
                                pw.length > 0 && !pwValidation.isValid ? 'text-red-500' : 'text-[#A9ACB2]'
                            }`}>
                                {pw.length > 0 && !pwValidation.isValid 
                                    ? pwValidation.message 
                                    : "영문, 숫자 포함 8자 이상"
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center items-center">
                    <button
                        type="submit"
                        className={`w-100 h-14 rounded-xl flex justify-center items-center font-semibold text-[16px] transition duration-200
                            ${isFormValid ? 'bg-[#3D84FF] text-white cursor-pointer' 
                                : 'bg-[#F4F6F8] text-[#A9ACB2] cursor-not-allowed'}`}
                    >
                        등록
                    </button>
                </div>
            </form>
            {<Modal 
                title="의사 정보를 등록했어요."
                isOpen={modal}
                onCancel={() => setModal(false)}
                isMobile={false}
                description={
                    <>
                        <p>의사 목록에서 선택 후 암호를 입력하면</p>
                        <p>진료를 시작할 수 있어요.</p>
                    </>
                }
                buttons={singleButton}
            />}
        </div>
    )
}

export default AddDoctor;