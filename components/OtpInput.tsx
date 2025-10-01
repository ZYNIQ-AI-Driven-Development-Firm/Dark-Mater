import React, { useState, useRef, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  length: number;
  onChange: (otp: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ length, onChange }) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (/[^0-9]/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    onChange(newOtp.join(""));

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length).replace(/[^0-g]/g, '');
    if (pastedData) {
        const newOtp = [...otp];
        for (let i = 0; i < length; i++) {
            if (i < pastedData.length) {
                newOtp[i] = pastedData[i];
            }
        }
        setOtp(newOtp);
        onChange(newOtp.join(""));
        const lastFullIndex = Math.min(pastedData.length, length) - 1;
        inputRefs.current[lastFullIndex]?.focus();
    }
  };


  return (
    <div className="flex justify-center space-x-2" onPaste={handlePaste}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={data}
          ref={(el) => { inputRefs.current[index] = el; }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target, index)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, index)}
          onFocus={(e) => e.target.select()}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-semibold bg-black/50 border-0 border-b-2 border-gray-600 rounded-none text-gray-200 focus:outline-none focus:border-[#63bb33] caret-[#63bb33] transition-colors"
        />
      ))}
    </div>
  );
};

export default OtpInput;