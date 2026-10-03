import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  Lock,
  MessageSquare,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  patientName: string;
  onVerified: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  phone,
  patientName,
  onVerified
}) => {
  const { language } = useLanguage();
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [timer, setTimer] = useState<number>(60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '']);
      setTimer(60);
      setIsTimerActive(true);
      setError('');
      setIsVerifying(false);
      setToastMessage(
        language === 'hi'
          ? `मोबाइल +91 ${cleanPhone} पर परीक्षण OTP (1234) भेजा गया है।`
          : language === 'hinglish'
          ? `Mobile +91 ${cleanPhone} par test OTP (1234) bhej diya gaya hai.`
          : `Simulated SMS sent to +91 ${cleanPhone}. Test OTP: 1234`
      );

      // Focus first input box after animation
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 150);
    }
  }, [isOpen, cleanPhone]);

  // Countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (isOpen && isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isTimerActive, timer]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input if digit entered
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData) {
      const digits = pastedData.split('');
      const newOtp = ['', '', '', ''];
      for (let i = 0; i < 4; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      setError('');
      if (digits.length >= 4) {
        inputRefs[3].current?.focus();
      } else {
        inputRefs[Math.min(3, digits.length)].current?.focus();
      }
    }
  };

  const handleQuickFill = () => {
    setOtp(['1', '2', '3', '4']);
    setError('');
    setTimeout(() => {
      inputRefs[3].current?.focus();
    }, 50);
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '']);
    setTimer(60);
    setIsTimerActive(true);
    setError('');
    setToastMessage(
      language === 'hi'
        ? `नया OTP दोबारा भेजा गया! टेस्ट कोड: 1234`
        : language === 'hinglish'
        ? `Naya OTP dobara bhej diya! Test OTP: 1234`
        : `New OTP resent via SMS! Test code: 1234`
    );
    inputRefs[0].current?.focus();
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredCode = otp.join('');

    if (enteredCode.length < 4) {
      setError(
        language === 'hi'
          ? 'कृपया पूरा 4-अंकीय OTP कोड दर्ज करें (उदा. 1234)'
          : language === 'hinglish'
          ? 'Kripya pura 4-digit OTP code enter karein (e.g. 1234)'
          : 'Please enter the complete 4-digit OTP code (e.g. 1234)'
      );
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simulate OTP verification check
    setTimeout(() => {
      if (enteredCode === '1234' || enteredCode.length === 4) {
        setIsVerifying(false);
        onVerified();
      } else {
        setIsVerifying(false);
        setError(
          language === 'hi'
            ? 'गलत OTP! कृपया 1234 या सही कोड दर्ज करें।'
            : 'Invalid OTP! Please enter 1234 or the test code.'
        );
      }
    }, 400);
  };

  return (
    <div
      id="otp-verification-modal"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-emerald-100 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Subtle Top Accent bar */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-900" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center border border-emerald-300 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-800 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                1-Step Security
              </span>
              <h3 className="text-base sm:text-lg font-black font-serif text-slate-900 leading-tight mt-0.5">
                {language === 'hi'
                  ? 'मोबाइल नंबर सत्यापन (OTP)'
                  : language === 'hinglish'
                  ? 'Mobile OTP Verification'
                  : 'Mobile OTP Verification'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient & Phone Info Badge */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">
                {patientName ? `${patientName} • ` : ''}
                {language === 'hi' ? 'ओटीपी नंबर:' : 'OTP sent to:'}
              </span>
              <span className="font-extrabold text-slate-900 font-mono text-sm">
                +91 {cleanPhone}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            title="Edit Phone Number"
          >
            {language === 'hi' ? 'बदलें' : 'Change'}
          </button>
        </div>

        {/* Simulated SMS Alert Banner for Easy Testing */}
        {toastMessage && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-xs text-amber-950 flex items-start gap-2 animate-in fade-in duration-200">
            <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-[11px] text-amber-900 uppercase tracking-wide">
                📱 Simulated SMS Delivered
              </span>
              <p className="mt-0.5 font-medium leading-tight">
                {toastMessage}
              </p>
              <button
                type="button"
                onClick={handleQuickFill}
                className="mt-2 px-3 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-[11px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer border border-amber-500"
              >
                <Zap className="w-3 h-3 fill-amber-950 text-amber-950" />
                <span>{language === 'hi' ? 'ऑटो-फिल टेस्ट OTP (1234)' : 'Auto-fill Test OTP (1234)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-800 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4-Digit Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
              {language === 'hi'
                ? '4-अंकीय सुरक्षा कोड (OTP) दर्ज करें:'
                : language === 'hinglish'
                ? 'Enter 4-digit OTP Code:'
                : 'Enter 4-digit Verification Code:'}
            </label>

            <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-12 h-14 text-center text-2xl font-black font-mono rounded-2xl border-2 transition-all focus:outline-none ${
                    digit
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm ring-2 ring-emerald-200'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Resend & Timer Info */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {isTimerActive ? (
                  <span>
                    {language === 'hi' ? 'पुनः कोड भेजें:' : 'Resend OTP in:'}{' '}
                    <strong className="text-amber-700 font-mono font-bold">
                      00:{timer < 10 ? `0${timer}` : timer}
                    </strong>
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold">
                    {language === 'hi' ? 'समय समाप्त' : 'Timer expired'}
                  </span>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isTimerActive}
              className={`flex items-center gap-1 font-extrabold text-xs transition-colors cursor-pointer ${
                isTimerActive
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-emerald-800 hover:text-emerald-950 underline'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isTimerActive ? '' : 'animate-spin'}`} />
              <span>{language === 'hi' ? 'OTP दोबारा भेजें' : 'Resend OTP'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isVerifying || otp.join('').length < 4}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <span>{language === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying Code...'}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-300 stroke-[2.5]" />
                  <span>
                    {language === 'hi'
                      ? 'सत्यापित करें व बुकिंग कन्फर्म करें'
                      : language === 'hinglish'
                      ? 'Verify OTP & Confirm Booking'
                      : 'Verify OTP & Confirm Booking'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
