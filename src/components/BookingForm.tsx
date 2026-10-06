import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { CLINIC_INFO, SERVICES_OFFERED, CONDITIONS_TREATED, getSlotsForDate, WEEKDAY_SLOTS, SUNDAY_SLOTS } from '../data/clinicData';
import { PatientAppointment, SlotAvailability, PatientHistoryCheck, PatientProfile } from '../types';
import { UpiPaymentModal } from './UpiPaymentModal';
import { saveAppointmentToFirestore } from '../utils/firebase';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useLanguage } from '../context/LanguageContext';
import { copyToClipboard } from '../utils/clipboard';
import { getAbsoluteApiUrl, safeParseJsonResponse } from '../utils/appUrlHelper';
import { compressImageToBase64 } from '../utils/imageHelper';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Banknote,
  Users,
  ShieldCheck,
  Check,
  Info,
  Bell,
  Mic,
  MicOff,
  CreditCard,
  ArrowRight,
  Copy,
  Smartphone,
  ExternalLink,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';

interface BookingFormProps {
  onAppointmentCreated: (appointment: PatientAppointment) => void;
}

const generateFallbackSlots = (dateStr?: string): SlotAvailability[] => {
  const slotList = getSlotsForDate(dateStr);
  return slotList.map((s) => ({
    slot: s,
    maxCapacity: 5,
    bookedCount: 0,
    availableCount: 5,
    isFull: false,
    patientsInSlot: []
  }));
};

const isSlotExpired = (slotStr: string, isTodaySelected: boolean): boolean => {
  if (!isTodaySelected) return false;
  
  // Extract END time of slot, e.g. "09:00 AM" from "08:00 AM - 09:00 AM", or "04:00 PM" from "03:00 PM - 04:00 PM"
  const parts = slotStr.split(' - ');
  const endPart = (parts[1] || parts[0]).trim();
  const timeMatch = endPart.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!timeMatch) return false;
  
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const meridian = timeMatch[3].toUpperCase();
  
  if (meridian === 'PM' && hours !== 12) {
    hours += 12;
  } else if (meridian === 'AM' && hours === 12) {
    hours = 0;
  }
  
  // Get current system time
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Compare current time with slot END time
  // Slot is disabled/expired ONLY AFTER its END time has passed
  if (currentHours > hours) {
    return true;
  } else if (currentHours === hours) {
    return currentMinutes >= minutes;
  }
  return false;
};

export const BookingForm: React.FC<BookingFormProps> = memo(({ onAppointmentCreated }) => {
  const { t, language } = useLanguage();
  const todayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const tomorrowStr = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [patientPhoto, setPatientPhoto] = useState<string>('');
  const [date, setDate] = useState(todayStr());
  const [selectedSlot, setSelectedSlot] = useState<string>(() => {
    const fallback = generateFallbackSlots();
    const firstValid = fallback.find((s) => !isSlotExpired(s.slot, true));
    return firstValid ? firstValid.slot : '';
  });
  const [selectedTherapy, setSelectedTherapy] = useState(SERVICES_OFFERED[0].name);
  const [selectedCondition, setSelectedCondition] = useState(CONDITIONS_TREATED[0].name);
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_clinic' | 'upi_qr'>('upi_qr');
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'sms' | 'both'>('both');
  const [notes, setNotes] = useState('');

  // Dynamic fee calculation & visit type state
  const [visitType, setVisitType] = useState<'first_visit' | 'returning_patient'>('first_visit');
  const [fee, setFee] = useState<number>(500);

  const handleVisitTypeChange = (type: 'first_visit' | 'returning_patient') => {
    setVisitType(type);
    setFee(type === 'first_visit' ? 500 : 200);
  };

  // Slot Availability state from backend
  const [slots, setSlots] = useState<SlotAvailability[]>(() => generateFallbackSlots());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Dynamic fee calculation based on phone lookup
  const [patientHistory, setPatientHistory] = useState<PatientHistoryCheck | null>(null);
  const [checkingHistory, setCheckingHistory] = useState(false);

  // Voice input state for hands-free patient entry
  const [activeVoiceField, setActiveVoiceField] = useState<'name' | 'phone' | 'notes' | null>(null);

  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening
  } = useVoiceRecognition({
    onResult: (text) => {
      if (activeVoiceField === 'name') {
        setName(text);
      } else if (activeVoiceField === 'phone') {
        const digits = text.replace(/\D/g, '').slice(-10);
        if (digits) setPhone(digits);
      } else if (activeVoiceField === 'notes') {
        setNotes(text);
      }
    }
  });

  const handleToggleVoice = (field: 'name' | 'phone' | 'notes') => {
    if (isListening && activeVoiceField === field) {
      stopListening();
      setActiveVoiceField(null);
    } else {
      setActiveVoiceField(field);
      startListening('hi-IN');
    }
  };

  // UPI Modal state
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'warning' } | null>(null);

  const [profileAutoFilled, setProfileAutoFilled] = useState(false);

  // Auto-prefill Name & Phone from localStorage (bindsukh_patient_profile)
  useEffect(() => {
    const autoPrefillFromProfile = () => {
      try {
        const stored = localStorage.getItem('bindsukh_patient_profile');
        if (stored) {
          const profile: PatientProfile = JSON.parse(stored);
          let prefilled = false;
          if (profile && profile.name) {
            setName((prev) => {
              if (!prev || prev.trim() === '') {
                prefilled = true;
                return profile.name;
              }
              return prev;
            });
          }
          if (profile && profile.phone) {
            setPhone((prev) => {
              if (!prev || prev.trim() === '') {
                prefilled = true;
                return profile.phone;
              }
              return prev;
            });
          }
          if (profile && (profile.patientPhoto || profile.photoUrl)) {
            setPatientPhoto((prev) => prev || profile.patientPhoto || profile.photoUrl || '');
          }
          if (profile && profile.defaultCondition) {
            setSelectedCondition((prev) => {
              if (!prev || prev === CONDITIONS_TREATED[0].name) {
                return profile.defaultCondition || prev;
              }
              return prev;
            });
          }
          if (profile && profile.notes) {
            setNotes((prev) => {
              if (!prev || prev.trim() === '') {
                return profile.notes || prev;
              }
              return prev;
            });
          }
          if (prefilled) {
            setProfileAutoFilled(true);
          }
        }
      } catch (err) {
        console.warn('Error reading patient profile for pre-fill:', err);
      }
    };

    autoPrefillFromProfile();

    const handleProfileUpdate = () => {
      autoPrefillFromProfile();
    };

    window.addEventListener('bindsukh_patient_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('bindsukh_patient_profile_updated', handleProfileUpdate);
    };
  }, []);

  const handleBookingPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImageToBase64(file, 400, 400, 0.85);
      setPatientPhoto(compressedBase64);
      showToast(
        language === 'hi'
          ? 'मरीज़ की फोटो सफलतापूर्वक जोड़ दी गई!'
          : 'Patient photo attached successfully!',
        'success'
      );
    } catch (err) {
      console.error('Error attaching photo:', err);
      showToast('Failed to process image file.', 'error');
    }
  };

  const showToast = (text: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live Inline UPI QR & Copy Toast state for Android WebViews / APKs
  const [inlineQrUrl, setInlineQrUrl] = useState<string>('');
  const [upiCopiedToast, setUpiCopiedToast] = useState(false);

  // Payment / Consultation fee section ref for automatic smooth scrolling
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  const scrollToPaymentSection = () => {
    setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Helper to merge local appointments into slot availability for guaranteed offline & instant sync
  const mergeSlotsWithLocalAppointments = (rawSlots: SlotAvailability[], targetDate: string): SlotAvailability[] => {
    try {
      const localStr = localStorage.getItem('bindsukh_local_appointments');
      if (!localStr) return rawSlots;
      const localList: PatientAppointment[] = JSON.parse(localStr);
      const activeLocalForDate = localList.filter(
        (a) => a.appointmentDate === targetDate && a.status !== 'cancelled'
      );
      if (activeLocalForDate.length === 0) return rawSlots;

      return rawSlots.map((s) => {
        const existingIds = new Set((s.patientsInSlot || []).map((p) => p.id));
        const missingLocal = activeLocalForDate.filter(
          (l) => l.timeSlot === s.slot && !existingIds.has(l.id)
        );
        if (missingLocal.length === 0) return s;

        const newBooked = Math.min(s.maxCapacity, s.bookedCount + missingLocal.length);
        const newAvailable = Math.max(0, s.maxCapacity - newBooked);
        return {
          ...s,
          bookedCount: newBooked,
          availableCount: newAvailable,
          isFull: newBooked >= s.maxCapacity,
          patientsInSlot: [
            ...(s.patientsInSlot || []),
            ...missingLocal.map((m) => ({
              id: m.id,
              tokenNumber: m.tokenNumber,
              patientName: m.patientName,
              status: m.status
            }))
          ]
        };
      });
    } catch (err) {
      return rawSlots;
    }
  };

  // Fetch slot availability whenever date changes
  const fetchSlots = async (targetDate: string) => {
    try {
      setLoadingSlots(true);
      const endpoint = getAbsoluteApiUrl(`/api/slots?date=${targetDate}`);
      let res: Response | null = null;
      try {
        res = await fetch(endpoint, { cache: 'no-store' });
      } catch (networkErr) {
        // Quick retry once in case server was starting
        await new Promise(r => setTimeout(r, 200));
        res = await fetch(endpoint, { cache: 'no-store' }).catch(() => null);
      }

      const isToday = targetDate === todayStr();
      
      if (res && res.ok) {
        const parsed = await safeParseJsonResponse<{ slots: SlotAvailability[] }>(res);
        if (parsed.ok && parsed.data) {
          const rawSlots = parsed.data.slots || [];
          const fetchedSlots = mergeSlotsWithLocalAppointments(
            rawSlots.length > 0 ? rawSlots : generateFallbackSlots(targetDate),
            targetDate
          );
          
          setSlots(fetchedSlots);
          // Auto-select the first available upcoming valid slot by default when date changes
          const currentSlotObj = fetchedSlots.find((s: SlotAvailability) => s.slot === selectedSlot);
          const isCurrentExpired = selectedSlot ? isSlotExpired(selectedSlot, isToday) : true;
          
          if (!currentSlotObj || currentSlotObj.isFull || isCurrentExpired) {
            const firstAvailableUpcoming = fetchedSlots.find((s: SlotAvailability) => {
              const expired = isSlotExpired(s.slot, isToday);
              return !s.isFull && !expired;
            });
            if (firstAvailableUpcoming) {
              setSelectedSlot(firstAvailableUpcoming.slot);
            } else {
              setSelectedSlot('');
            }
          }
          return;
        }
      }

      // Fallback calculation
      const fallback = mergeSlotsWithLocalAppointments(generateFallbackSlots(targetDate), targetDate);
      setSlots(fallback);
      const firstValid = fallback.find(s => !isSlotExpired(s.slot, isToday));
      setSelectedSlot(firstValid ? firstValid.slot : '');
    } catch (err) {
      console.warn('[Slots] Using local slots computation:', err);
      const fallback = mergeSlotsWithLocalAppointments(generateFallbackSlots(targetDate), targetDate);
      setSlots(fallback);
      const isToday = targetDate === todayStr();
      const firstValid = fallback.find(s => !isSlotExpired(s.slot, isToday));
      setSelectedSlot(firstValid ? firstValid.slot : '');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots(date);
  }, [date]);

  // Listen to global appointment creation events to refresh seat availability in real time
  useEffect(() => {
    const handleAppointmentBooked = (event: Event) => {
      const customEvent = event as CustomEvent<PatientAppointment>;
      if (customEvent.detail && customEvent.detail.appointmentDate === date) {
        fetchSlots(date);
      }
    };
    window.addEventListener('clinic_appointment_booked', handleAppointmentBooked);
    return () => window.removeEventListener('clinic_appointment_booked', handleAppointmentBooked);
  }, [date]);

  // Check phone number dynamically for past visit history & dynamic fee
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length === 10) {
      setCheckingHistory(true);
      const endpoint = getAbsoluteApiUrl(`/api/check-patient/${cleanPhone}`);
      fetch(endpoint)
        .then((res) => safeParseJsonResponse<PatientHistoryCheck>(res))
        .then((parsed) => {
          if (parsed.ok && parsed.data) {
            const data = parsed.data;
            setPatientHistory(data);
            if (data.isReturning) {
              setVisitType('returning_patient');
              setFee(200);
            } else {
              setVisitType('first_visit');
              setFee(500);
            }
            if (data.isReturning && data.patientName && !name.trim()) {
              setName(data.patientName);
            }
          }
        })
        .catch((err) => console.error('Error checking patient history:', err))
        .finally(() => setCheckingHistory(false));
    } else {
      setPatientHistory(null);
    }
  }, [phone]);

  const calculatedFee = fee;

  // Generate real-time static/live UPI QR Code URI for inline fallback view
  useEffect(() => {
    const upiUri = `upi://pay?pa=${CLINIC_INFO.upiId}&pn=${encodeURIComponent(
      CLINIC_INFO.merchantName
    )}&am=${fee}&cu=INR&tn=${encodeURIComponent(`Acupressure Center - ${name.trim() || 'Patient'}`)}`;

    QRCode.toDataURL(upiUri, {
      width: 400,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setInlineQrUrl(url))
      .catch((err) => console.error('Inline UPI QR generation error:', err));
  }, [fee, name]);

  const handleCopyUpiId = async () => {
    const success = await copyToClipboard(CLINIC_INFO.upiId);
    if (success) {
      setUpiCopiedToast(true);
      setTimeout(() => setUpiCopiedToast(false), 2500);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      const msg = language === 'hi'
        ? 'कृपया मरीज का पूरा नाम दर्ज करें।'
        : language === 'hinglish'
        ? 'Kripya patient ka pura naam enter karein.'
        : 'Please enter the patient’s full name.';
      setFormError(msg);
      showToast(msg, 'warning');
      const nameEl = document.getElementById('patient-name-input');
      nameEl?.focus();
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      const msg = language === 'hi'
        ? 'कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।'
        : language === 'hinglish'
        ? 'Kripya sahi 10-digit mobile number enter karein.'
        : 'Please enter a valid 10-digit Indian phone number.';
      setFormError(msg);
      showToast(msg, 'warning');
      const phoneEl = document.getElementById('patient-phone-input');
      phoneEl?.focus();
      return;
    }

    if (!selectedSlot) {
      const msg = language === 'hi'
        ? 'कृपया पहले उपलब्ध 1-घंटे का समय स्लॉट चुनें!'
        : language === 'hinglish'
        ? 'Kripya pehle 1-hour ka time slot select karein!'
        : 'Please select an available 1-hour time slot first before proceeding to payment!';
      setFormError(msg);
      showToast(msg, 'warning');
      const slotEl = document.getElementById('time-slots-container');
      slotEl?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Check if slot is full
    const currentSlotObj = slots.find((s) => s.slot === selectedSlot);
    if (currentSlotObj && currentSlotObj.isFull) {
      const msg = language === 'hi'
        ? 'चयनित समय स्लॉट भर चुका है (अधिकतम 5/5)। कृपया कोई दूसरा स्लॉट चुनें।'
        : 'The selected slot has reached maximum capacity (5/5). Please choose another slot.';
      setFormError(msg);
      showToast(msg, 'warning');
      return;
    }

    // Check if slot is expired for today
    const isToday = date === todayStr();
    if (selectedSlot && isSlotExpired(selectedSlot, isToday)) {
      const msg = language === 'hi'
        ? 'यह समय स्लॉट समाप्त हो चुका है। कृपया दूसरा समय स्लॉट चुनें।'
        : 'The selected time slot has already passed for today. Please choose an upcoming slot.';
      setFormError(msg);
      showToast(msg, 'warning');
      return;
    }

    // Direct booking flow: if UPI QR selected, open UPI payment modal; if Pay at Clinic, submit directly
    if (paymentMethod === 'upi_qr') {
      setIsUpiModalOpen(true);
    } else {
      await submitAppointmentToServer();
    }
  };

  const submitAppointmentToServer = async (upiRef?: string) => {
    setIsSubmitting(true);
    setFormError('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const dateParts = date.replace(/-/g, '').slice(4);
    const localToken = `BK-${dateParts}-${Math.floor(100 + Math.random() * 900)}`;

    const fallbackAppointment: PatientAppointment = {
      id: `apt-local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber: localToken,
      patientName: name.trim(),
      patientPhone: cleanPhone,
      patientPhoto: patientPhoto || undefined,
      appointmentDate: date,
      timeSlot: selectedSlot,
      therapy: selectedTherapy,
      condition: selectedCondition?.trim() || 'General Acupressure Consultation',
      visitType: visitType,
      fee: fee,
      paymentMethod: paymentMethod === 'upi_qr' ? 'upi_qr' : 'pay_at_clinic',
      paymentStatus: paymentMethod === 'upi_qr' ? 'paid_online' : 'pending',
      upiReferenceNumber: upiRef?.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      reminderChannel,
      attendanceStatus: 'unconfirmed'
    };

    const saveLocallyAndComplete = async (apt: PatientAppointment, isFallback: boolean) => {
      try {
        localStorage.setItem('bindsukh_active_booking', JSON.stringify(apt));
        const existingLocalStr = localStorage.getItem('bindsukh_local_appointments');
        const localList: PatientAppointment[] = existingLocalStr ? JSON.parse(existingLocalStr) : [];
        if (!localList.some(item => item.id === apt.id || item.tokenNumber === apt.tokenNumber)) {
          localList.unshift(apt);
          localStorage.setItem('bindsukh_local_appointments', JSON.stringify(localList.slice(0, 50)));
        }
      } catch (storeErr) {
        console.warn('LocalStorage save warning:', storeErr);
      }

      try {
        await saveAppointmentToFirestore(apt);
      } catch (fErr) {
        console.warn('[Firestore] Sync notice:', fErr);
      }

      // 1. Immediate optimistic UI update: increment seat counter in React state right away
      setSlots((prevSlots) =>
        prevSlots.map((s) => {
          if (s.slot === apt.timeSlot && (!apt.appointmentDate || apt.appointmentDate === date)) {
            const newBooked = Math.min(s.maxCapacity, s.bookedCount + 1);
            const newAvailable = Math.max(0, s.maxCapacity - newBooked);
            return {
              ...s,
              bookedCount: newBooked,
              availableCount: newAvailable,
              isFull: newBooked >= s.maxCapacity,
              patientsInSlot: [
                ...(s.patientsInSlot || []),
                {
                  id: apt.id,
                  tokenNumber: apt.tokenNumber,
                  patientName: apt.patientName,
                  status: apt.status
                }
              ]
            };
          }
          return s;
        })
      );

      // 2. Broadcast booking event so all components/tabs refresh slot availability
      window.dispatchEvent(new CustomEvent('clinic_appointment_booked', { detail: apt }));

      setIsUpiModalOpen(false);
      
      // 3. Re-fetch from backend / merged local store
      await fetchSlots(apt.appointmentDate || date);

      onAppointmentCreated(apt);
      setSelectedSlot('');
      setNotes('');

      if (isFallback) {
        showToast(
          language === 'hi'
            ? 'अपॉइंटमेंट सफलतापूर्वक दर्ज हो गया और फोन में सुरक्षित हो गया!'
            : language === 'hinglish'
            ? 'Appointment confirm ho gaya aur aapke phone me save ho gaya!'
            : 'Appointment booked successfully & saved to your device!',
          'success'
        );
      }
    };

    // 10-second timeout controller for API fetch resilience in Android WebView/APK
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const endpointUrl = getAbsoluteApiUrl('/api/book-appointment');
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          patientName: name.trim(),
          patientPhone: cleanPhone,
          patientPhoto: patientPhoto || undefined,
          appointmentDate: date,
          timeSlot: selectedSlot,
          therapy: selectedTherapy,
          condition: selectedCondition,
          visitType: visitType,
          fee: fee,
          paymentMethod,
          reminderChannel,
          upiReferenceNumber: upiRef,
          notes: notes.trim(),
        }),
      });

      clearTimeout(timeoutId);

      // Verify response.ok and headers include 'application/json' before calling response.json()
      const parsed = await safeParseJsonResponse<PatientAppointment>(response);

      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.error || `Server responded with status ${response.status}`);
      }

      await saveLocallyAndComplete(parsed.data, false);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Booking network/server fetch notice, activating device persistence fallback:', err);

      const isTimeout = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('timeout'));
      if (isTimeout) {
        showToast(
          language === 'hi'
            ? 'नेटवर्क टाइमआउट। अपॉइंटमेंट टोकन सुरक्षित रूप से जनरेट हो गया।'
            : 'Network Timeout. Booking token generated and saved locally on device.',
          'warning'
        );
      }

      // Execute local storage & client-side persistence fallback so patient is NEVER blocked
      await saveLocallyAndComplete(fallbackAppointment, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      id="booking-form-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="liquid-glass-card rounded-3xl shadow-2xl border border-white/80 overflow-hidden relative smooth-gpu"
    >
      {/* Floating Instant Toast Notification for Feedback / Copy */}
      {(toastMessage || upiCopiedToast) && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-60 font-extrabold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 select-none max-w-[92vw] sm:max-w-md border-2 ${
            toastMessage?.type === 'success' || (!toastMessage && upiCopiedToast)
              ? 'bg-emerald-950 text-amber-300 border-amber-400'
              : toastMessage?.type === 'warning'
              ? 'bg-amber-950 text-amber-200 border-amber-400'
              : 'bg-rose-950 text-rose-200 border-rose-400'
          }`}
        >
          {toastMessage?.type === 'success' || (!toastMessage && upiCopiedToast) ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.5] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 stroke-[2.5] shrink-0" />
          )}
          <span className="text-xs sm:text-sm">{toastMessage?.text || 'UPI ID Copied!'}</span>
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
        </div>
      )}

      {/* Header Accent Bar with Liquid Glass Dark */}
      <div className="liquid-glass-dark text-white p-6 sm:p-8 border-b border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mb-2 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              {language === 'en' ? 'Easy Online Booking • No Login' : language === 'hinglish' ? 'Aasan Online Booking • Sirf 1 Minute' : 'आसान ऑनलाइन अपॉइंटमेंट'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">{t('bookingTitle')}</h2>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1">
              {t('bookingSubtitle')}
            </p>
          </div>

          <div className="liquid-glass-dark-pill rounded-2xl p-3.5 sm:p-4 text-right border border-emerald-400/30">
            <div className="text-[11px] text-emerald-200 font-bold">
              {language === 'en' ? 'Session Fee Structure' : language === 'hi' ? 'चिकित्सा शुल्क विवरण' : 'Session Fee Structure'}
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300">
              {language === 'en'
                ? '₹500 First Visit | ₹200 Returning'
                : language === 'hi'
                ? '₹500 पहला परामर्श | ₹200 पुनः आगमन'
                : '₹500 First Visit | ₹200 Returning'}
            </div>
            <div className="text-[10px] text-emerald-200 font-medium">
              {language === 'en'
                ? 'New Patient ₹500 | Returning ₹200'
                : language === 'hi'
                ? 'नया मरीज ₹500 | पुराना मरीज ₹200'
                : 'Naya Patient ₹500 | Purana Patient ₹200'}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Body */}
      <form onSubmit={handleBookingSubmit} className="p-6 sm:p-8 space-y-8 pb-28 sm:pb-8">
        {formError && (
          <div className="bg-rose-50/90 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Booking Notification</span>
              {formError}
            </div>
          </div>
        )}

        {/* Step 1: Patient Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
              <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs flex items-center justify-center font-bold">1</span>
              <h3>{t('step1Title')}</h3>
            </div>
            {profileAutoFilled && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'hi' ? 'प्रोफ़ाइल से स्वतः भरा गया' : 'Auto-filled from Profile'}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="patient-name-input" className="block text-xs font-semibold text-slate-800">
                  {t('patientNameLabel')} <span className="text-amber-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleVoice('name')}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                    isListening && activeVoiceField === 'name'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  }`}
                  title={language === 'hi' ? "बोलकर नाम दर्ज करें" : language === 'hinglish' ? "Bolkar naam likhein" : "Voice Input"}
                >
                  {isListening && activeVoiceField === 'name' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-emerald-700" />}
                  <span>
                    {isListening && activeVoiceField === 'name'
                      ? (language === 'hi' ? 'सुन रहे हैं...' : language === 'hinglish' ? 'Sun rahe hain...' : 'Listening...')
                      : (language === 'hi' ? 'बोलें' : language === 'hinglish' ? 'Bolein' : 'Voice')}
                  </span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="patient-name-input"
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Ramesh Chandra Tripathi' : language === 'hinglish' ? 'Jaise: Ramesh Chandra Tripathi' : 'उदा. रमेश चंद्र त्रिपाठी'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="patient-phone-input" className="block text-xs font-semibold text-slate-700">
                  {t('patientPhoneLabel')} <span className="text-amber-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleVoice('phone')}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                    isListening && activeVoiceField === 'phone'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  }`}
                  title={language === 'hi' ? "बोलकर फोन नंबर दर्ज करें" : language === 'hinglish' ? "Bolkar number likhein" : "Voice Input"}
                >
                  {isListening && activeVoiceField === 'phone' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-emerald-700" />}
                  <span>
                    {isListening && activeVoiceField === 'phone'
                      ? (language === 'hi' ? 'सुन रहे हैं...' : language === 'hinglish' ? 'Sun rahe hain...' : 'Listening...')
                      : (language === 'hi' ? 'बोलें' : language === 'hinglish' ? 'Bolein' : 'Voice')}
                  </span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="patient-phone-input"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm font-mono text-slate-800"
                />
              </div>

              {/* Live phone detection status & Interactive Visit Type Selector */}
              {checkingHistory && (
                <p className="text-[11px] text-emerald-700 mt-1">Verifying patient record...</p>
              )}

              {/* Visit Type Selector (1st Visit ₹500 vs Returning Visit ₹200) */}
              <div className="mt-3 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {language === 'hi' ? 'परामर्श प्रकार (Visit Type) चुनें:' : language === 'hinglish' ? 'Visit Type Select Karein:' : 'Select Patient Visit Type:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleVisitTypeChange('first_visit')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
                      visitType === 'first_visit'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="patient_visit_type"
                      checked={visitType === 'first_visit'}
                      onChange={() => handleVisitTypeChange('first_visit')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                        <span>{language === 'hi' ? 'पहला परामर्श (1st Visit)' : '1st Visit (New Patient)'}</span>
                        <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">₹500</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {language === 'hi' ? 'स्थायी पंजीकरण + संपूर्ण जांच + पहला उपचार' : 'Registration + Diagnosis + 1st Session'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVisitTypeChange('returning_patient')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
                      visitType === 'returning_patient'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="patient_visit_type"
                      checked={visitType === 'returning_patient'}
                      onChange={() => handleVisitTypeChange('returning_patient')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                        <span>{language === 'hi' ? 'पुनः आगमन (Returning)' : 'Returning / Follow-up'}</span>
                        <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">₹200</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {language === 'hi' ? 'पंजीकरण शुल्क माफ + डायरेक्ट थेरेपी सेशन' : 'Registration Waived + Direct Therapy'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {patientHistory && (
                <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  patientHistory.isReturning
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border border-amber-200 text-amber-900'
                }`}>
                  {patientHistory.isReturning ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        {language === 'en' ? (
                          <>
                            <strong>Returning Patient Identified!</strong> Discount applied: <span className="font-bold text-emerald-700">₹200</span> (Registration fee waived).
                            {patientHistory.previousAppointmentsCount > 0 && ` (${patientHistory.previousAppointmentsCount} prior visit${patientHistory.previousAppointmentsCount > 1 ? 's' : ''})`}
                          </>
                        ) : language === 'hi' ? (
                          <>
                            <strong>पुराने मरीज की पहचान हुई!</strong> कुल शुल्क: <span className="font-bold text-emerald-700">₹200</span> (पंजीकरण शुल्क माफ किया गया).
                            {patientHistory.previousAppointmentsCount > 0 && ` (${patientHistory.previousAppointmentsCount} पिछली विजिट)`}
                          </>
                        ) : (
                          <>
                            <strong>Returning Patient Identified!</strong> Discount mila: <span className="font-bold text-emerald-700">₹200</span> (Registration fee waived).
                            {patientHistory.previousAppointmentsCount > 0 && ` (${patientHistory.previousAppointmentsCount} prior visit${patientHistory.previousAppointmentsCount > 1 ? 's' : ''})`}
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        {language === 'en' ? (
                          <>
                            <strong>First Visit (New Patient):</strong> Fee is <span className="font-bold text-amber-800">₹500</span> (Includes permanent registration, clinical diagnosis + first treatment session).
                          </>
                        ) : language === 'hi' ? (
                          <>
                            <strong>प्रथम आगमन (नया मरीज):</strong> कुल शुल्क <span className="font-bold text-amber-800">₹500</span> है (इसमें स्थायी पंजीकरण, क्लिनिकल जांच एवं पहला उपचार शामिल है).
                          </>
                        ) : (
                          <>
                            <strong>First Visit (Naya Patient):</strong> Fee hai <span className="font-bold text-amber-800">₹500</span> (Isme registration, diagnosis aur pehla therapy session included hai).
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Patient Photo Attachment Card */}
          <div className="bg-gradient-to-r from-slate-50 via-emerald-50/50 to-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {patientPhoto ? (
                  <img
                    src={patientPhoto}
                    alt="Attached Patient Photo"
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-md ring-2 ring-emerald-950/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-900 text-amber-300 border border-emerald-700 flex items-center justify-center font-bold font-serif text-lg shadow-sm">
                    {name ? name.trim().charAt(0).toUpperCase() : <User className="w-6 h-6 text-amber-300" />}
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{language === 'hi' ? 'मरीज़ फोटो (Doctor Console Photo)' : 'Patient Photo for Doctor Console'}</span>
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {patientPhoto
                    ? (language === 'hi' ? '✓ फोटो सफलतापूर्वक संलग्न है' : '✓ Photo attached to booking')
                    : (language === 'hi' ? 'वैकल्पिक: पर्ची व डॉक्टर कंसोल के लिए फोटो लगाएं' : 'Optional: Attach photo for Doctor Console')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="booking-form-photo-input"
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-amber-300" />
                <span>{patientPhoto ? (language === 'hi' ? 'फोटो बदलें' : 'Change Photo') : (language === 'hi' ? 'फोटो लगाएं' : 'Attach Photo')}</span>
                <input
                  id="booking-form-photo-input"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleBookingPhotoUpload}
                  className="hidden"
                />
              </label>
              {patientPhoto && (
                <button
                  type="button"
                  onClick={() => setPatientPhoto('')}
                  className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Date and Multi-Patient 1-Hour Slot Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
              <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs flex items-center justify-center font-bold">2</span>
              <h3>{t('step2Title')}</h3>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Capacity: <span className="text-emerald-800 font-bold">Max 5 patients / slot</span>
            </div>
          </div>

          {/* Quick Date Selectors */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">{t('appointmentDateLabel')}</label>
            <div className="flex flex-wrap gap-2.5 items-center">
              <button
                type="button"
                onClick={() => {
                  setDate(todayStr());
                  scrollToPaymentSection();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  date === todayStr()
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Today ({todayStr()})
              </button>
              <button
                type="button"
                onClick={() => {
                  setDate(tomorrowStr());
                  scrollToPaymentSection();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  date === tomorrowStr()
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Tomorrow ({tomorrowStr()})
              </button>

              <div className="relative">
                <input
                  id="appointment-date-input"
                  type="date"
                  min={todayStr()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    scrollToPaymentSection();
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 1-Hour Slots Grid with Live Multi-Patient Capacity Counters */}
          <div id="time-slots-container" className="space-y-2 pt-2 scroll-mt-24">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                1-Hour Slots with Real-Time Seat Counters <span className="text-amber-600">*</span>
              </label>
              {loadingSlots && (
                <span className="text-xs text-emerald-700 animate-pulse">Updating availability...</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {slots.map((slotObj) => {
                const isSelected = selectedSlot === slotObj.slot;
                const isFull = slotObj.isFull;
                const isExpired = isSlotExpired(slotObj.slot, date === todayStr());
                const isDisabled = isFull || isExpired;
                const available = slotObj.availableCount;
                const booked = slotObj.bookedCount;

                return (
                  <button
                    key={slotObj.slot}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedSlot(slotObj.slot);
                        scrollToPaymentSection();
                      }
                    }}
                    className={`relative p-3.5 rounded-2xl text-left border transition-all ${
                      isExpired
                        ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed select-none'
                        : isFull
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-amber-400'
                        : 'bg-white border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isExpired
                            ? 'text-slate-400 line-through decoration-slate-400/60'
                            : isSelected
                            ? 'text-white'
                            : 'text-slate-900'
                        }`}
                      >
                        {slotObj.slot}
                      </span>
                      {isSelected && !isExpired && (
                        <div className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center text-[10px] font-black">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Capacity Indicator Pill */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Users
                          className={`w-3.5 h-3.5 ${
                            isExpired
                              ? 'text-slate-400'
                              : isSelected
                              ? 'text-amber-300'
                              : 'text-slate-500'
                          }`}
                        />
                        <span
                          className={
                            isExpired
                              ? 'text-slate-400'
                              : isSelected
                              ? 'text-emerald-100'
                              : 'text-slate-600'
                          }
                        >
                          {isExpired
                            ? language === 'hi'
                              ? 'समाप्त'
                              : 'Passed'
                            : `${booked}/5 ${language === 'hi' ? 'बुक' : 'Booked'}`}
                        </span>
                      </div>

                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-500 border border-slate-300">
                          {language === 'hi'
                            ? 'समय समाप्त'
                            : language === 'hinglish'
                            ? 'Time Passed'
                            : 'Expired'}
                        </span>
                      ) : isFull ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {language === 'hi' ? 'स्लॉट फुल' : 'SLOT FULL'}
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSelected
                              ? 'bg-amber-400 text-emerald-950'
                              : available <= 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {available}/5 {language === 'hi' ? 'उपलब्ध' : 'Available'}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/60 rounded-full h-1 mt-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isExpired
                            ? 'bg-slate-300'
                            : isFull
                            ? 'bg-rose-500'
                            : isSelected
                            ? 'bg-amber-400'
                            : available <= 2
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${(booked / 5) * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {slots.length === 0 && !loadingSlots && (
              <p className="text-xs text-slate-500 italic py-2">
                {language === 'hi' ? 'इस तारीख के लिए कोई स्लॉट उपलब्ध नहीं है।' : language === 'hinglish' ? 'Is date ke liye koi slot nahi hai.' : 'No slots configured for this date.'}
              </p>
            )}
          </div>
        </div>

        {/* Step 3: Therapy and Condition Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-base border-b border-emerald-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs flex items-center justify-center font-bold">3</span>
            <h3>{t('step3Title')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('selectTherapyLabel')} <span className="text-amber-600">*</span>
              </label>
              <select
                id="therapy-select"
                value={selectedTherapy}
                onChange={(e) => setSelectedTherapy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium text-slate-800"
              >
                {SERVICES_OFFERED.map((svc) => (
                  <option key={svc.id} value={svc.name}>
                    {language === 'hi' ? svc.hindi : language === 'hinglish' ? `${svc.name} (${svc.hindi})` : svc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('selectConditionLabel')} <span className="text-amber-600">*</span>
              </label>
              <select
                id="condition-select"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium text-slate-800"
              >
                {CONDITIONS_TREATED.map((c) => {
                  const displayLabel = language === 'hi'
                    ? c.hindi
                    : language === 'hinglish'
                    ? `${c.hinglish} (${c.hindi})`
                    : c.name;
                  return (
                    <option key={c.name} value={c.name}>
                      {displayLabel}
                    </option>
                  );
                })}
                <option value="Other Ailment">
                  {language === 'hi' ? 'अन्य कोई शारीरिक दर्द / परामर्श' : language === 'hinglish' ? 'Other Problem / General Consultation' : 'Other / General Consultation'}
                </option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {t('healthNotesLabel')}
              </label>
              <button
                type="button"
                onClick={() => handleToggleVoice('notes')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                  isListening && activeVoiceField === 'notes'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                }`}
                title={language === 'hi' ? "बोलकर लक्षण बताएं" : language === 'hinglish' ? "Bolkar lakshan batayein" : "Voice Input"}
              >
                {isListening && activeVoiceField === 'notes' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-emerald-700" />}
                <span>
                  {isListening && activeVoiceField === 'notes'
                    ? (language === 'hi' ? 'सुन रहे हैं...' : language === 'hinglish' ? 'Sun rahe hain...' : 'Listening...')
                    : (language === 'hi' ? 'बोलें' : language === 'hinglish' ? 'Bolein' : 'Voice')}
                </span>
              </button>
            </div>
            <textarea
              id="patient-notes-input"
              rows={2}
              placeholder={
                language === 'en'
                  ? 'e.g. Back pain and leg pain for 3 months, stiffness while walking...'
                  : language === 'hi'
                  ? 'उदा. 3 महीने से कमर व पैरों में दर्द है, चलने में खिंचाव होता है...'
                  : 'e.g. 3 mahine se kamar aur pairon me dard hai, chalne me khinchav hota hai...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Step 4: Fee & Payment Method */}
        <div ref={paymentSectionRef} id="booking-payment-section" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-base border-b border-emerald-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs flex items-center justify-center font-bold">4</span>
            <h3>{t('step4Title')}</h3>
          </div>

          {/* Dynamic Fee Banner with Visit Type Selector */}
          <div className="bg-gradient-to-r from-emerald-50 via-emerald-100/50 to-amber-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  {language === 'hi' ? 'कुल उपचार शुल्क' : language === 'hinglish' ? 'Calculated Therapy Fee' : 'Calculated Session Fee'}
                </div>
                <div className="text-3xl font-black text-emerald-950">
                  ₹{fee}{' '}
                  <span className="text-xs font-normal text-slate-600">
                    {visitType === 'returning_patient' ? (
                      language === 'hi' ? '(पुनः आगमन - ₹200)' : language === 'hinglish' ? '(Returning Patient - ₹200)' : '(Returning Patient - ₹200)'
                    ) : (
                      language === 'hi' ? '(पहला परामर्श + उपचार शुल्क - ₹500)' : language === 'hinglish' ? '(1st Visit + Registration - ₹500)' : '(1st Visit Registration + Therapy - ₹500)'
                    )}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  {visitType === 'returning_patient'
                    ? (language === 'hi' ? '✓ पंजीकरण शुल्क माफ। थेरेपी परामर्श ₹200 लागू।' : language === 'hinglish' ? '✓ Registration fee waived. Direct therapy ₹200 applied.' : '✓ Registration fee waived. Direct therapy ₹200 applied.')
                    : (language === 'hi' ? 'इसमें स्थायी डिजिटल रिकॉर्ड, प्रारंभिक परामर्श और संपूर्ण उपचार शामिल है।' : language === 'hinglish' ? 'Isme lifetime digital record, consultation aur full treatment include hai.' : 'Includes lifetime digital record, preliminary consultation, and full treatment.')}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  {language === 'hi' ? 'स्पष्ट शुल्क नियम' : 'Transparent Pricing'}
                </span>
              </div>
            </div>

            {/* Quick Visit Type Toggle inside Step 4 */}
            <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                {language === 'hi' ? 'प्रकार बदलें:' : 'Change Visit Type:'}
              </span>
              <button
                type="button"
                onClick={() => handleVisitTypeChange('first_visit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  visitType === 'first_visit'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                }`}
              >
                1st Visit (₹500)
              </button>
              <button
                type="button"
                onClick={() => handleVisitTypeChange('returning_patient')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  visitType === 'returning_patient'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                }`}
              >
                Returning (₹200)
              </button>
            </div>
          </div>

          {/* Payment Method Radio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label
              onClick={() => setPaymentMethod('pay_at_clinic')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                paymentMethod === 'pay_at_clinic'
                  ? 'bg-emerald-50/70 border-emerald-700 ring-2 ring-emerald-600/30 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value="pay_at_clinic"
                checked={paymentMethod === 'pay_at_clinic'}
                onChange={() => setPaymentMethod('pay_at_clinic')}
                className="mt-1 text-emerald-800 focus:ring-emerald-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-800" />
                  <span className="text-sm font-bold text-slate-900">
                    {language === 'hi' ? 'क्लिनिक पर भुगतान (नकद)' : 'Pay at Clinic (Cash)'}
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded">
                    {language === 'hi' ? 'नकद / Cash' : 'Cash'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {language === 'hi'
                    ? `अपॉइंटमेंट अभी बुक करें और परामर्श के दिन क्लिनिक रिसेप्शन पर ₹${calculatedFee} नकद (Cash) का भुगतान करें।`
                    : language === 'hinglish'
                    ? `Appointment abhi book karein aur consultation ke din clinic reception par ₹${calculatedFee} Cash pay karein.`
                    : `Book your slot now and pay ₹${calculatedFee} in Cash at the clinic front desk on arrival.`}
                </p>
              </div>
            </label>

            <label
              onClick={() => setPaymentMethod('upi_qr')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                paymentMethod === 'upi_qr'
                  ? 'bg-emerald-50/70 border-emerald-700 ring-2 ring-emerald-600/30 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value="upi_qr"
                checked={paymentMethod === 'upi_qr'}
                onChange={() => setPaymentMethod('upi_qr')}
                className="mt-1 text-emerald-800 focus:ring-emerald-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-800" />
                  <span className="text-sm font-bold text-slate-900">
                    {language === 'hi' ? 'UPI QR / ऑनलाइन भुगतान' : 'Pay Online (UPI QR)'}
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded">
                    {language === 'hi' ? 'तुरंत पुष्टि' : 'Instant'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {language === 'hi' ? (
                    `आधिकारिक UPI QR (${CLINIC_INFO.upiId}) स्कैन करके ₹${calculatedFee} का तुरंत भुगतान करें और डिजिटल रसीद प्राप्त करें।`
                  ) : language === 'hinglish' ? (
                    `Official UPI QR (${CLINIC_INFO.upiId}) scan karke ₹${calculatedFee} pay karein aur instant digital receipt paayein.`
                  ) : (
                    `Scan official UPI QR (${CLINIC_INFO.upiId}) to pay ₹${calculatedFee} instantly and generate a verified digital receipt.`
                  )}
                </p>
              </div>
            </label>
          </div>

          {/* Fallback View Inside Payment Section for Android WebViews & Direct Scans */}
          {paymentMethod === 'upi_qr' && (
            <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-50/90 to-white border-2 border-emerald-300/80 shadow-md space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-emerald-200/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>{language === 'hi' ? 'लाइव UPI QR कोड व सीधा भुगतान' : 'Live UPI QR Code & Direct Payment'}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                        {language === 'hi' ? 'सुरक्षित' : 'Verified'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Merchant: <span className="font-semibold text-slate-700">{CLINIC_INFO.merchantName}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">{language === 'hi' ? 'देय शुल्क' : 'Payable'}</span>
                  <span className="text-lg font-black text-emerald-900 font-mono">₹{calculatedFee}</span>
                </div>
              </div>

              {/* QR Code and Copy UPI ID Section */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* QR Code Display */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-emerald-200 shadow-inner">
                  <div className="w-36 h-36 sm:w-40 sm:h-40 bg-white rounded-xl shadow-xs border border-emerald-100 flex items-center justify-center overflow-hidden p-1.5">
                    {inlineQrUrl ? (
                      <img
                        src={inlineQrUrl}
                        alt="Bindsukh Clinic Official UPI QR Code"
                        className="w-full h-full object-contain block"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 font-medium animate-pulse">Generating QR...</span>
                    )}
                  </div>
                  <span className="mt-2 text-[10px] font-semibold text-emerald-800 flex items-center gap-1 text-center">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    {language === 'hi' ? 'गूगल पे, फोनपे, पेटीएम से स्कैन करें' : 'Scan with GPay, PhonePe, Paytm, BHIM'}
                  </span>
                </div>

                {/* UPI ID & Quick App / Copy Actions */}
                <div className="sm:col-span-7 space-y-3">
                  {/* Official Clinic UPI ID box with 1-Click Copy */}
                  <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        {language === 'hi' ? 'आधिकारिक क्लिनिक UPI ID' : 'Official Clinic UPI ID'}
                      </span>
                      {upiCopiedToast && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          UPI ID Copied!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <code className="text-xs sm:text-sm font-bold text-emerald-950 font-mono select-all truncate">
                        9455100097@okbizaxis
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUpiId}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                          upiCopiedToast
                            ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        }`}
                        title="Copy UPI ID: 9455100097@okbizaxis"
                      >
                        {upiCopiedToast ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3]" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy UPI ID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Android WebView / APK Support Notice */}
                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-950 leading-relaxed flex items-start gap-2">
                    <Smartphone className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">{language === 'hi' ? 'Android WebView / APK सहायता:' : 'Android WebView / APK Fallback:'}</strong>{' '}
                      {language === 'hi'
                        ? 'यदि आपका ऐप या ब्राउज़र सीधे UPI ऐप नहीं खोल पा रहा है, तो ऊपर दिए गए QR कोड को स्कैन करें या UPI ID को कॉपी करके किसी भी UPI ऐप में पेस्ट करके भुगतान करें।'
                        : 'If direct app switching is restricted on your device/APK, please scan the QR code above or copy the UPI ID (9455100097@okbizaxis) into any UPI app.'}
                    </div>
                  </div>

                  {/* Direct Launch Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsUpiModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'hi' ? 'पूर्ण स्क्रीन QR व रसीद अपलोड' : 'Open Fullscreen QR & UTR Upload'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Automated 24-Hour Reminder Preference Card */}
          <div className="mt-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>
                  {language === 'hi'
                    ? 'ऑटोमेटेड २४-घंटे पहले अपॉइंटमेंट रिमाइंडर और उपस्थिति पुष्टि'
                    : 'Automated 24-Hour Appointment Reminder & Attendance Confirmation'}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                {language === 'hi' ? 'निःशुल्क क्लिनिक सेवा' : 'Free Clinic Service'}
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {language === 'hi' ? (
                `आपको आपके स्लॉट से २४ घंटे पहले पूरामुफ्ती क्लिनिक की लोकेशन, टोकन नंबर और १-टैप कन्फर्म बटन के साथ एक ऑटोमेटेड रिमाइंडर प्राप्त होगा।`
              ) : language === 'hinglish' ? (
                `Aapko aapke slot se 24 hours pehle clinic direction, Token Number aur confirmation button ke sath reminder milega.`
              ) : (
                <>
                  You will automatically receive an appointment reminder <strong className="font-semibold text-emerald-950">24 hours before your slot</strong> with clinic directions to Puramufti, your Token Number, and a 1-tap confirmation button.
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">
                {language === 'hi' ? 'रिमाइंडर भेजने का माध्यम:' : language === 'hinglish' ? 'Reminder send karein via:' : 'Send reminder via:'}
              </span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="reminderChannelPref"
                  value="both"
                  checked={reminderChannel === 'both'}
                  onChange={() => setReminderChannel('both')}
                  className="text-emerald-700 focus:ring-emerald-700"
                />
                <span>{language === 'hi' ? 'व्हाट्सएप और एसएमएस' : language === 'hinglish' ? 'WhatsApp aur SMS' : 'WhatsApp & SMS'}</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="reminderChannelPref"
                  value="whatsapp"
                  checked={reminderChannel === 'whatsapp'}
                  onChange={() => setReminderChannel('whatsapp')}
                  className="text-emerald-700 focus:ring-emerald-700"
                />
                <span>{language === 'hi' ? 'केवल व्हाट्सएप' : 'WhatsApp Only'}</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="reminderChannelPref"
                  value="sms"
                  checked={reminderChannel === 'sms'}
                  onChange={() => setReminderChannel('sms')}
                  className="text-emerald-700 focus:ring-emerald-700"
                />
                <span>{language === 'hi' ? 'केवल एसएमएस' : 'SMS Only'}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Inline Booking & Payment Summary Card */}
        <div className="bg-[#042417] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-emerald-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-200/90 uppercase tracking-wider">
                {language === 'hi' ? 'कुल राशि:' : language === 'hinglish' ? 'TOTAL:' : 'TOTAL:'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight leading-none">
                ₹{calculatedFee}
              </span>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-md">
                {patientHistory?.isReturning ? (language === 'hi' ? 'पुराना मरीज' : 'Returning') : (language === 'hi' ? 'नया मरीज' : '1st Visit')}
              </span>
            </div>
            <div className="text-xs text-emerald-200/80 font-medium flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {selectedSlot ? selectedSlot.split(' - ')[0] : (language === 'hi' ? 'स्लॉट चुनें' : 'Select Slot')}
                {date ? ` • ${date}` : ''}
              </span>
            </div>
          </div>

          <motion.button
            id="submit-booking-btn"
            type="submit"
            whileTap={{ scale: 0.96 }}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300 shrink-0 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{language === 'hi' ? 'प्रोसेसिंग...' : 'Processing...'}</span>
            ) : paymentMethod === 'upi_qr' ? (
              <>
                <QrCode className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                <span>{language === 'hi' ? `UPI QR से भुगतान व कन्फर्म (₹${calculatedFee})` : language === 'hinglish' ? `UPI QR Se Pay Karein & Confirm (₹${calculatedFee})` : `Open UPI QR & Confirm (₹${calculatedFee})`}</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-950 fill-emerald-950" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                <span>{t('confirmBookingBtn')}</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-950 fill-emerald-950" />
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Live UPI QR Code Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        fee={calculatedFee}
        patientName={name}
        patientPhone={phone}
        timeSlot={selectedSlot}
        appointmentDate={date}
        onPaymentConfirmed={(refId) => submitAppointmentToServer(refId)}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
});
