import WebTopbar from "../layouts/WebTopbar";
import hospitalImg from "../assets/webTopbar/hospital-plus.svg";
import DoctorList from "../components/Doctor/DoctorList";
import AddDoctor from "../components/Doctor/AddDoctor";
import { useState } from "react";

const SelectDoctor = () => {
    const [currentState, setCurrentState] = useState(false);

    const handleChangePage = (isAdding: boolean) => {
        setCurrentState(isAdding);
    }
    return (
        <div className="flex flex-col items-center">
            <WebTopbar text="농민사랑병원" text_img={hospitalImg}/>
            <div className="flex justify-center items-center mt-[122px]">
                {currentState ? (
                    <AddDoctor onComplete={() => handleChangePage(false)} />
                ) : (
                    <DoctorList onAddDoctor={() => handleChangePage(true)} />
                )}
            </div>
        </div>
    )
}

export default SelectDoctor;
