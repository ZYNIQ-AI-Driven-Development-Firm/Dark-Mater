import React, { useState, useMemo } from 'react';
import OtpInput from './OtpInput';
import GearsBackground from './GearsBackground';
import Footer from './Footer';
import { authApi, handleApiError } from '../src/lib/api';
import { storage } from '../src/lib/config';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onGoToLanding: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToLanding }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const isEmailValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleGetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.requestOtp(email);
      console.log('OTP requested successfully:', response);
      setStep('otp');
      setCooldownSeconds(response.cooldown_sec || 30);
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to request OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = async (newOtp: string) => {
    setOtp(newOtp);
    
    if (newOtp.length === 6) {
      setLoading(true);
      setError(null);
      
      try {
        // Get device fingerprint (basic implementation)
        const deviceFingerprint = navigator.userAgent + window.screen.width + window.screen.height;
        
        const response = await authApi.verifyOtp(email, newOtp, deviceFingerprint);
        console.log('OTP verified successfully:', response);
        
        // Store tokens
        storage.setTokens(response.access_token, response.refresh_token);
        
        // Store user info in localStorage for now
        localStorage.setItem('user', JSON.stringify(response.user));
        
        onLoginSuccess();
      } catch (err: any) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        console.error('Failed to verify OTP:', err);
        
        // Clear OTP input on error
        setOtp('');
        // Reset OTP input component by re-rendering
        setStep('email');
        setTimeout(() => setStep('otp'), 100);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.requestOtp(email);
      console.log('OTP resent successfully:', response);
      setCooldownSeconds(response.cooldown_sec || 30);
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
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
              
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
              
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
                      disabled={loading}
                      className="w-full px-2 py-2 bg-transparent border-0 border-b-2 border-gray-600 focus:border-[#63bb33] focus:outline-none caret-[#63bb33] transition-colors duration-300 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!isEmailValid || loading}
                    className="w-full py-3 px-4 bg-[#63bb33] hover:bg-[#529f27] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold transition-all duration-300 ease-in-out border-2 border-[#417f1f] hover:border-[#529f27]"
                  >
                    {loading ? '[ SENDING... ]' : '[ GET OTP ]'}
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
                  <OtpInput 
                    length={6} 
                    onChange={handleOtpChange}
                    disabled={loading}
                    key={step} // Force re-render when step changes
                  />
                  
                  <div className="mt-6 space-y-2">
                    {cooldownSeconds > 0 ? (
                      <p className="text-xs text-gray-500">
                        Resend available in {cooldownSeconds}s
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-xs text-[#63bb33] hover:text-[#74d73f] transition-colors disabled:opacity-50"
                      >
                        [ RESEND CODE ]
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError(null);
                    }}
                    className="w-full mt-4 text-xs text-[#63bb33] hover:text-[#74d73f] transition-colors"
                    disabled={loading}
                  >
                    &lt; USE DIFFERENT EMAIL
                  </button>
                  
                  {loading && (
                    <div className="mt-4 text-xs text-gray-500">
                      [ VERIFYING... ]
                    </div>
                  )}
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