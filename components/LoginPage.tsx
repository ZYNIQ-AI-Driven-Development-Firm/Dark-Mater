import React, { useState, useMemo } from 'react';
import OtpInput from './OtpInput';
import GearsBackground from './GearsBackground';
import Footer from './Footer';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onGoToLanding: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToLanding }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const isEmailValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  const handleGetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmailValid) {
      console.log('Requesting OTP for:', email);
      setStep('otp');
    }
  };

  const handleOtpChange = (newOtp: string) => {
    setOtp(newOtp);
    if (newOtp.length === 6) {
      console.log('Verifying OTP:', newOtp);
      setTimeout(() => {
        onLoginSuccess();
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-4 bg-black">
      <div /> {/* Spacer for flexbox justify-between */}

      <main className="flex flex-col items-center justify-center w-full">
        <div className="relative w-full max-w-lg mx-auto">
          {/* Decorative Corners */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#63bb33]/50"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#63bb33]/50"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#63bb33]/50"></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#63bb33]/50"></div>

          <div className="relative bg-gray-900/50 border border-[#63bb33]/30 px-8 pt-6 pb-8 shadow-2xl shadow-black/50 overflow-hidden">
            <GearsBackground />
            
            <button onClick={onGoToLanding} className="w-56 mx-auto mb-4 block transition-opacity hover:opacity-80" aria-label="Go to landing page">
              <img 
                src="https://raw.githubusercontent.com/khalilpreview/M7yapp9sColl3c1oncdn/refs/heads/main/dark_mater_white_inline_logo.png" 
                alt="Dark Matter Logo" 
                className="w-full h-auto logo-fade-pulse" 
              />
            </button>
            
            <div className="relative z-10">
              <h1 className="text-center text-lg text-[#63bb33] mb-6">[ CLIENT AUTHENTICATION ]</h1>
              {step === 'email' && (
                <form onSubmit={handleGetOtp}>
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm text-[#63bb33] mb-2">
                      EMAIL_ADDRESS:
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-2 py-2 bg-transparent border-0 border-b-2 border-gray-600 focus:border-[#63bb33] focus:outline-none caret-[#63bb33] transition-colors duration-300"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!isEmailValid}
                    className="w-full py-3 px-4 bg-[#63bb33] hover:bg-[#529f27] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold transition-all duration-300 ease-in-out border-2 border-[#417f1f] hover:border-[#529f27]"
                  >
                    [ GET OTP ]
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <div className="text-center">
                  <p className="text-gray-400 mb-2 text-sm">
                    VERIFICATION_CODE
                  </p>
                  <p className="text-gray-400 mb-8 text-xs">
                    SENT TO: <span className="font-medium text-[#63bb33]">{email}</span>
                  </p>
                  <OtpInput length={6} onChange={handleOtpChange} />
                  <button
                    onClick={() => setStep('email')}
                    className="w-full mt-8 text-xs text-[#63bb33] hover:text-[#74d73f] transition-colors"
                  >
                    &lt; USE DIFFERENT EMAIL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LoginPage;