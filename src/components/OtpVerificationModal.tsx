import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Lock,
  MessageSquare,
  Bell,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

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
  useLockBodyScroll(isOpen);
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [timer, setTimer] = useState<number>(60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<{
    code: string;
    message: string;
    visible: boolean;
  } | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  // Generate dynamic 4-digit random OTP and send top toast notification
  const generateAndSendOtp = () => {
    // Generate fresh random 4-digit number (1000 - 9999)
    const newCode = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(newCode);
    setOtp(['', '', '', '']);
    setTimer(60);
    setIsTimerActive(true);
    setError('');
    setIsVerifying(false);

    const smsText =
      language === 'hi'
        ? `सत्यापन कोड (Verification Code): ${newCode} (डा० बिंदसुख क्लीनिक)`
        : language === 'hinglish'
        ? `Verification Code: ${newCode} (Dr. Bindsukh Clinic)`
        : `Verification Code Sent: ${newCode} for Dr. Bindsukh Clinic`;

    setNotificationToast({
      code: newCode,
      message: smsText,
      visible: true
    });
  };

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      generateAndSendOtp();

      // Focus first input box after animation
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 150);
    } else {
      setNotificationToast(null);
    }
  }, [isOpen]);

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

  const handleResendOtp = () => {
    generateAndSendOtp();
    setTimeout(() => {
      inputRefs[0].current?.focus();
    }, 100);
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredCode = otp.join('');

    if (enteredCode.length < 4) {
      setError(
        language === 'hi'
          ? 'कृपया पूरा 4-अंकीय OTP कोड दर्ज करें।'
          : language === 'hinglish'
          ? 'Kripya pura 4-digit OTP code enter karein.'
          : 'Please enter the complete 4-digit OTP code.'
      );
      return;
    }

    setIsVerifying(true);
    setError('');

    // Validate against stored dynamic OTP code
    setTimeout(() => {
      if (enteredCode === generatedOtp) {
        setIsVerifying(false);
        setNotificationToast(null);
        onVerified();
      } else {
        setIsVerifying(false);
        setError(
          language === 'hi'
            ? 'गलत OTP! कृपया प्राप्त 4-अंकीय कोड पुनः दर्ज करें।'
            : language === 'hinglish'
            ? 'Galat OTP! Kripya prapt 4-digit code enter karein.'
            : 'Invalid OTP! Please enter the correct 4-digit code sent.'
        );
      }
    }, 350);
  };

  return (
    <>
      {/* Floating Top Incoming SMS Notification Banner */}
      {notificationToast && notificationToast.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9995] max-w-md w-[92%] sm:w-[420px] bg-slate-900/95 text-white rounded-2xl p-3.5 shadow-2xl border border-emerald-500/40 backdrop-blur-xl flex items-start gap-3 animate-in slide-in-from-top-6 duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-[11px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Bell className="w-3 h-3 text-emerald-400" />
                <span>SMS Notification • +91 {cleanPhone}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Now</span>
            </div>
            <p className="mt-1 font-medium text-slate-200 text-xs leading-snug">
              {notificationToast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotificationToast((prev) => (prev ? { ...prev, visible: false } : null))}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Verification Modal Container */}
      <div
        id="otp-verification-modal"
        className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
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
    </>
  );
};
