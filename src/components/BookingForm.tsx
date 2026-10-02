import React, { useState, useEffect } from 'react';
import { CLINIC_INFO, SERVICES_OFFERED, CONDITIONS_TREATED } from '../data/clinicData';
import { PatientAppointment, SlotAvailability, PatientHistoryCheck } from '../types';
import { UpiPaymentModal } from './UpiPaymentModal';
import { saveAppointmentToFirestore } from '../utils/firebase';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useLanguage } from '../context/LanguageContext';
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
  MicOff
} from 'lucide-react';

interface BookingFormProps {
  onAppointmentCreated: (appointment: PatientAppointment) => void;
}

const DEFAULT_1HOUR_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
];

const generateFallbackSlots = (): SlotAvailability[] => {
  return DEFAULT_1HOUR_SLOTS.map((s) => ({
    slot: s,
    maxCapacity: 5,
    bookedCount: 0,
    availableCount: 5,
    isFull: false,
    patientsInSlot: []
  }));
};

export const BookingForm: React.FC<BookingFormProps> = ({ onAppointmentCreated }) => {
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
  const [date, setDate] = useState(todayStr());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedTherapy, setSelectedTherapy] = useState(SERVICES_OFFERED[0].name);
  const [selectedCondition, setSelectedCondition] = useState(CONDITIONS_TREATED[0].name);
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_clinic' | 'upi_qr'>('upi_qr');
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'sms' | 'both'>('both');
  const [notes, setNotes] = useState('');

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

  // Fetch slot availability whenever date changes
  const fetchSlots = async (targetDate: string) => {
    try {
      setLoadingSlots(true);
      const res = await fetch(`/api/slots?date=${targetDate}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const fetchedSlots = data.slots || [];
        
        if (fetchedSlots.length === 0) {
          const fallback = generateFallbackSlots();
          setSlots(fallback);
          setSelectedSlot(fallback[0].slot);
        } else {
          setSlots(fetchedSlots);
          // Auto-select the first available slot by default when date changes
          const currentSlotObj = fetchedSlots.find((s: SlotAvailability) => s.slot === selectedSlot);
          if (!currentSlotObj || currentSlotObj.isFull) {
            const firstAvailable = fetchedSlots.find((s: SlotAvailability) => !s.isFull);
            if (firstAvailable) {
              setSelectedSlot(firstAvailable.slot);
            } else if (fetchedSlots.length > 0) {
              setSelectedSlot(fetchedSlots[0].slot);
            } else {
              setSelectedSlot('');
            }
          }
        }
      } else {
        const fallback = generateFallbackSlots();
        setSlots(fallback);
        setSelectedSlot(fallback[0].slot);
      }
    } catch (err) {
      console.error('Error fetching slots, falling back to local slots:', err);
      const fallback = generateFallbackSlots();
      setSlots(fallback);
      setSelectedSlot(fallback[0].slot);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots(date);
  }, [date]);

  // Check phone number dynamically for past visit history & dynamic fee
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length === 10) {
      setCheckingHistory(true);
      fetch(`/api/check-patient/${cleanPhone}`)
        .then((res) => res.json())
        .then((data: PatientHistoryCheck) => {
          setPatientHistory(data);
          if (data.isReturning && data.patientName && !name.trim()) {
            setName(data.patientName);
          }
        })
        .catch((err) => console.error('Error checking patient history:', err))
        .finally(() => setCheckingHistory(false));
    } else {
      setPatientHistory(null);
    }
  }, [phone]);

  const calculatedFee = patientHistory?.isReturning
    ? CLINIC_INFO.fees.returningPatient // ₹200
    : CLINIC_INFO.fees.firstVisit; // ₹500

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter the patient’s full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (!selectedSlot) {
      alert("Please select/pick an available 1-hour time slot first before proceeding to payment! / कृपया भुगतान से पहले एक समय स्लॉट चुनें!");
      setFormError('Please select/pick an available 1-hour time slot first / कृपया पहले उपलब्ध समय स्लॉट चुनें।');
      return;
    }

    // Check if slot is full
    const currentSlotObj = slots.find((s) => s.slot === selectedSlot);
    if (currentSlotObj && currentSlotObj.isFull) {
      setFormError('The selected slot has reached maximum capacity (5/5). Please choose another slot.');
      return;
    }

    // ALWAYS open the Mandatory Advance Payment Screen (UpiPaymentModal)
    setIsUpiModalOpen(true);
  };

  const submitAppointmentToServer = async (upiRef?: string) => {
    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: name.trim(),
          patientPhone: phone.replace(/\D/g, '').slice(-10),
          appointmentDate: date,
          timeSlot: selectedSlot,
          therapy: selectedTherapy,
          condition: selectedCondition,
          paymentMethod,
          reminderChannel,
          upiReferenceNumber: upiRef,
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm appointment');
      }

      // Close UPI modal if open
      setIsUpiModalOpen(false);

      // Refresh slot counts
      fetchSlots(date);

      // Save permanently into Firebase Firestore Database
      try {
        await saveAppointmentToFirestore(data);
      } catch (fErr) {
        console.warn('[Firestore] Auto-sync notice:', fErr);
      }

      // Notify parent & open confirmation modal
      onAppointmentCreated(data);

      // Reset form fields
      setSelectedSlot('');
      setNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Error booking appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="booking-form-wrapper" className="liquid-glass-card rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
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
      <form onSubmit={handleBookingSubmit} className="p-6 sm:p-8 space-y-8">
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
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-base border-b border-slate-200/80 pb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs flex items-center justify-center font-bold">1</span>
            <h3>{t('step1Title')}</h3>
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

              {/* Live phone detection status */}
              {checkingHistory && (
                <p className="text-[11px] text-emerald-700 mt-1">Verifying patient record...</p>
              )}
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
                onClick={() => setDate(todayStr())}
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
                onClick={() => setDate(tomorrowStr())}
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
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 1-Hour Slots Grid with Live Multi-Patient Capacity Counters */}
          <div className="space-y-2 pt-2">
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
                const available = slotObj.availableCount;
                const booked = slotObj.bookedCount;

                return (
                  <button
                    key={slotObj.slot}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedSlot(slotObj.slot)}
                    className={`relative p-3.5 rounded-2xl text-left border transition-all ${
                      isFull
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-amber-400'
                        : 'bg-white border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {slotObj.slot}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center text-[10px] font-black">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Capacity Indicator Pill */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Users className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
                        <span className={isSelected ? 'text-emerald-100' : 'text-slate-600'}>
                          {booked}/5 {language === 'hi' ? 'बुक' : 'Booked'}
                        </span>
                      </div>

                      {isFull ? (
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
                          isFull
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-base border-b border-emerald-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs flex items-center justify-center font-bold">4</span>
            <h3>{t('step4Title')}</h3>
          </div>

          {/* Dynamic Fee Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-emerald-100/50 to-amber-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                {language === 'hi' ? 'कुल उपचार शुल्क' : language === 'hinglish' ? 'Calculated Therapy Fee' : 'Calculated Session Fee'}
              </div>
              <div className="text-3xl font-black text-emerald-950">
                ₹{calculatedFee}{' '}
                <span className="text-xs font-normal text-slate-600">
                  {patientHistory?.isReturning ? (
                    language === 'hi' ? '(पुराना मरीज)' : language === 'hinglish' ? '(Returning Patient)' : '(Returning Patient)'
                  ) : (
                    language === 'hi' ? '(पहला परामर्श + उपचार शुल्क)' : language === 'hinglish' ? '(First Visit + Registration)' : '(First Visit Registration + Therapy)'
                  )}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                {patientHistory?.isReturning
                  ? (language === 'hi' ? '✓ पुराना रिकॉर्ड सत्यापित। ₹300 पंजीकरण शुल्क माफ किया गया।' : language === 'hinglish' ? '✓ Past visit record mil gaya. ₹300 registration fee maaf.' : '✓ Verified past visit record. ₹300 registration fee waived.')
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

          {/* Payment Method Radio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 opacity-75 relative"
            >
              <div className="absolute top-2.5 right-2.5 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {language === 'hi' ? 'बंद है' : 'DISABLED'}
              </div>
              <div className="flex items-start gap-3.5">
                <input
                  type="radio"
                  name="payment_method"
                  disabled
                  className="mt-1 text-slate-300 focus:ring-0 cursor-not-allowed"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-400">
                      {language === 'hi' ? 'क्लीनिक पर भुगतान (नकद)' : 'Pay at Clinic (Cash)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'hi'
                      ? 'फर्जी/मजाकिया बुकिंग को रोकने के लिए बिना अग्रिम सत्यापन के क्लिनिक पर नकद भुगतान अक्षम है।'
                      : language === 'hinglish'
                      ? 'Fake bookings ko rokne ke liye direct pay at clinic disabled kiya gaya hai.'
                      : 'Paying at clinic without advance verification is disabled to prevent fake/joke bookings.'}
                  </p>
                </div>
              </div>
            </div>

            <label
              className="p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 bg-emerald-50/70 border-emerald-700 ring-2 ring-emerald-600/30"
            >
              <input
                type="radio"
                name="payment_method"
                checked={true}
                readOnly
                className="mt-1 text-emerald-800 focus:ring-emerald-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-800" />
                  <span className="text-sm font-bold text-slate-900">
                    {language === 'hi' ? 'अनिवार्य अग्रिम UPI भुगतान' : 'Mandatory Advance UPI Payment'}
                  </span>
                  <span className="px-1.5 py-0.5 bg-amber-400 text-emerald-950 text-[10px] font-black rounded">
                    {language === 'hi' ? 'अनिवार्य' : 'Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {language === 'hi' ? (
                    `अपनी सीट सुरक्षित करने के लिए अगले चरण में आधिकारिक QR (${CLINIC_INFO.upiId}) स्कैन करके ₹${calculatedFee} का भुगतान करें और ट्रांजैक्शन ID / UTR दर्ज करें या स्क्रीनशॉट अपलोड करें।`
                  ) : language === 'hinglish' ? (
                    `Agle step me official QR (${CLINIC_INFO.upiId}) scan karke ₹${calculatedFee} pay karein aur Transaction ID / UTR enter karein ya screenshot upload karein.`
                  ) : (
                    `Scan official QR (${CLINIC_INFO.upiId}) in the next step to pay ₹${calculatedFee} and enter Transaction ID / UTR or Upload Screenshot to lock your slot.`
                  )}
                </p>
              </div>
            </label>
          </div>

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

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {language === 'hi'
              ? 'आगे बढ़ने पर, एक तत्काल अपॉइंटमेंट टोकन जारी किया जाएगा।'
              : language === 'hinglish'
              ? 'Aage badhne par instant appointment token generate ho jayega.'
              : 'By proceeding, an instant appointment token will be generated.'}
          </div>

          <button
            id="submit-booking-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-900 hover:to-emerald-900 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{language === 'hi' ? 'अपॉइंटमेंट दर्ज हो रहा है...' : language === 'hinglish' ? 'Booking Confirm Ho Rahi Hai...' : 'Confirming Booking...'}</span>
            ) : paymentMethod === 'upi_qr' ? (
              <>
                <QrCode className="w-4 h-4" />
                <span>{language === 'hi' ? `UPI QR से भुगतान व कन्फर्म (₹${calculatedFee})` : language === 'hinglish' ? `UPI QR Se Pay Karein & Confirm (₹${calculatedFee})` : `Open UPI QR & Confirm (₹${calculatedFee})`}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('confirmBookingBtn')}</span>
              </>
            )}
          </button>
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
    </div>
  );
};
