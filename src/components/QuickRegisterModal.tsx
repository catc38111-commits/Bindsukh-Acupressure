import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Sparkles,
  User,
  X,
  AlertCircle,
  FileText,
  Building2,
  HeartPulse
} from 'lucide-react';
import { CLINIC_INFO, SERVICES_OFFERED, CONDITIONS_TREATED } from '../data/clinicData';
import { PatientAppointment } from '../types';
import { saveAppointmentToFirestore } from '../utils/firebase';
import { getAbsoluteApiUrl, safeParseJsonResponse } from '../utils/appUrlHelper';

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (apt: PatientAppointment) => void;
}

export const QuickRegisterModal: React.FC<QuickRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegistered
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [therapy, setTherapy] = useState(SERVICES_OFFERED[0].name);
  const [condition, setCondition] = useState(CONDITIONS_TREATED[0].name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const todayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (!name.trim()) {
      setError('कृपया मरीज का नाम दर्ज करें (Please enter patient name)');
      return;
    }
    if (cleanPhone.length !== 10) {
      setError('कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (10-digit mobile number)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const targetDate = todayStr();
    const dateParts = targetDate.replace(/-/g, '').slice(4);
    const localToken = `BK-${dateParts}-${Math.floor(100 + Math.random() * 900)}`;

    const fallbackAppointment: PatientAppointment = {
      id: `apt-local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber: localToken,
      patientName: name.trim(),
      patientPhone: cleanPhone,
      appointmentDate: targetDate,
      timeSlot: '09:30 AM - 10:30 AM',
      therapy,
      condition: condition || 'General Acupressure Consultation',
      visitType: 'first_visit',
      fee: CLINIC_INFO.fees.firstVisit,
      paymentMethod: 'pay_at_clinic',
      paymentStatus: 'pending',
      notes: 'Direct Quick Registration',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      reminderChannel: 'both',
      attendanceStatus: 'unconfirmed'
    };

    const saveLocallyAndComplete = async (apt: PatientAppointment) => {
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

      window.dispatchEvent(new CustomEvent('clinic_appointment_booked', { detail: apt }));

      onRegistered(apt);
      onClose();
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const endpoint = getAbsoluteApiUrl('/api/book-appointment');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          patientName: name.trim(),
          patientPhone: cleanPhone,
          appointmentDate: targetDate,
          timeSlot: '09:30 AM - 10:30 AM',
          therapy,
          condition,
          paymentMethod: 'pay_at_clinic',
          notes: 'Direct 1-Click Registration'
        })
      });

      clearTimeout(timeoutId);

      const parsed = await safeParseJsonResponse<PatientAppointment>(res);

      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.error || `Server responded with status ${res.status}`);
      }

      await saveLocallyAndComplete(parsed.data);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Quick register fetch notice, using local storage fallback:', err);
      // Resilient local persistence so user is never blocked
      await saveLocallyAndComplete(fallbackAppointment);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="quick-register-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-white/80 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider bg-emerald-800/80 px-2 py-0.5 rounded-md mb-1 border border-amber-300/20">
                <Sparkles className="w-3 h-3" /> Quick Patient Registration • मरीज पंजीकरण
              </div>
              <h2 className="text-xl font-bold font-serif text-white leading-tight">
                बिंदसुख क्लिनिक में नया रजिस्ट्रेशन
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                कोई भी व्यक्ति नाम व फोन डालकर तुरंत टोकन प्राप्त कर सकता है (No Login Required)
              </p>
            </div>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rameshwar Nath Tripathi"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Phone Number <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9xxxxxxxxx"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              इस नंबर पर क्लिनिक से टोकन और अपॉइंटमेंट की पुष्टि भेजी जाएगी।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                थेरेपी (Therapy)
              </label>
              <select
                value={therapy}
                onChange={(e) => setTherapy(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700"
              >
                {SERVICES_OFFERED.map((srv) => (
                  <option key={srv.id} value={srv.name}>
                    {srv.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                बीमारी या दर्द (Condition)
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700"
              >
                {CONDITIONS_TREATED.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.hindi} ({c.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-emerald-950 block">परामर्श शुल्क (Clinic Fee)</span>
              <span className="text-[11px] text-emerald-800">क्लिनिक पहुँचने पर भुगतान करें (Pay at Clinic)</span>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-sm text-emerald-900">₹500 / ₹200</span>
              <span className="block text-[10px] text-emerald-700">First / Returning</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 transition-colors"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>पंजीकरण हो रहा है...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>अभी रजिस्टर करें व टोकन पाएं →</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
