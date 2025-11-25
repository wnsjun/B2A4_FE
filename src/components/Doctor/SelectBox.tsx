import { useState } from "react";

interface SelectBoxProps {
   label?: string;
   options: string[];
   selectedValue: string;
   placeholder?: string;
   disabled: boolean;
   handleChange: (value: string) => void;
}

const SelectBox = ({label, options, selectedValue, 
    placeholder, disabled, handleChange} : SelectBoxProps) => {

    const [isOpen, setIsOpen] = useState(false);
 
    const handleOptionClick = (value: string) => {
        handleChange(value);
        setIsOpen(false);
    }

    const displayValue = selectedValue || placeholder;
    const textColor = selectedValue ? 'text-black' : 'text-[#A9ACB2]';

    return (
        <div className="relative">
            {label && <p>{label}</p>}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                disabled={disabled}
                className="border w-48 h-12 border-b-[#A9ACB2] border-t-0 border-x-0 py-3 text-left tracking-tighter"
            >
                <span className={`pl-2 ${textColor}`}>
                    {displayValue}
                </span>
            </button>
            
            {isOpen && (
                <div
                    className="absolute z-10 top-full mt-1 shadow-lg bg-white flex flex-col overflow-y-auto max-h-60"
                    style={{right: 0}}
                >
                    {options.map((option, i) => (
                        <div
                            key={i}
                            className="pl-4 py-2 h-10 flex items-center cursor-pointer"
                            onClick={() => handleOptionClick(option)}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SelectBox;

