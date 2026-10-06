import React, { useState, useEffect } from 'react';
import { PatientAppointment } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  FileText,
  Download,
  Image as ImageIcon,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  User,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { generateAndDownloadReceiptPdf, downloadReceiptAsImage } from '../utils/receiptPdfHelper';
import { useClinicLogo } from '../utils/logoHelper';
import { CLINIC_INFO } from '../data/clinicData';
import { safeParseJsonResponse, getAbsoluteApiUrl } from '../utils/appUrlHelper';

interface MySlipsProps {
  onSelectReceipt: (appointment: PatientAppointment) => void;
  onNavigateToBooking?: () => void;
}

export const MySlips: React.FC<MySlipsProps> = ({
  onSelectReceipt,
  onNavigateToBooking
}) => {
  const { language } = useLanguage();
  const clinicLogo = useClinicLogo();
  const [searchPhone, setSearchPhone] = useState('');
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [downloadingImgId, setDownloadingImgId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-fetch using active booking phone or stored profile
  useEffect(() => {
    try {
      const activeStr = localStorage.getItem('bindsukh_active_booking');
      if (activeStr) {
        const activeApt = JSON.parse(activeStr) as PatientAppointment;
        if (activeApt && activeApt.patientPhone) {
          setSearchPhone(activeApt.patientPhone);
          fetchPatientSlips(activeApt.patientPhone);
          return;
        }
      }

      const profileStr = localStorage.getItem('bindsukh_patient_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile && profile.phone) {
          setSearchPhone(profile.phone);
          fetchPatientSlips(profile.phone);
        }
      }
    } catch (e) {
      console.warn('Error reading saved profile for slips:', e);
    }
  }, []);

  const fetchPatientSlips = async (phoneToSearch: string) => {
    const cleanPhone = phoneToSearch.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) return;

    setLoading(true);
    setSearched(true);
    try {
      const endpoint = getAbsoluteApiUrl(`/api/patient-records/${cleanPhone}`);
      const res = await fetch(endpoint);
      const parsed = await safeParseJsonResponse<PatientAppointment[]>(res);

      if (parsed.ok && parsed.data && parsed.data.length > 0) {
        setAppointments(parsed.data);
      } else {
        // Check local storage fallback
        const localListStr = localStorage.getItem('bindsukh_local_appointments');
        if (localListStr) {
          const localList: PatientAppointment[] = JSON.parse(localListStr);
          const filtered = localList.filter(
            (a) => a.patientPhone && a.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone
          );
          if (filtered.length > 0) {
            setAppointments(filtered);
            return;
          }
        }

        const stored = localStorage.getItem('bindsukh_active_booking');
        if (stored) {
          const apt = JSON.parse(stored) as PatientAppointment;
          if (apt && apt.patientPhone && apt.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) {
            setAppointments([apt]);
            return;
          }
        }
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching patient slips:', err);
      const stored = localStorage.getItem('bindsukh_active_booking');
      if (stored) {
        const apt = JSON.parse(stored) as PatientAppointment;
        if (apt && apt.patientPhone && apt.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) {
          setAppointments([apt]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatientSlips(searchPhone);
  };

  const handleDownloadPdf = async (apt: PatientAppointment) => {
    try {
      setDownloadingPdfId(apt.id);
      await generateAndDownloadReceiptPdf(apt, `apt-card-${apt.id}`, clinicLogo);
    } catch (err) {
      console.error('Error downloading slip PDF:', err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDownloadImage = async (apt: PatientAppointment) => {
    try {
      setDownloadingImgId(apt.id);
      await downloadReceiptAsImage(apt, `apt-card-${apt.id}`);
    } catch (err) {
      console.error('Error downloading slip image:', err);
    } finally {
      setDownloadingImgId(null);
    }
  };

  const handleWhatsAppShare = (apt: PatientAppointment) => {
    const feeText = `₹${apt.fee || (apt.visitType === 'returning_patient' ? 200 : 500)}`;
    const msg = encodeURIComponent(
      `*Bindsukh Clinic Appointment Token*\n\n` +
      `📋 Token: ${apt.tokenNumber}\n` +
      `👤 Patient: ${apt.patientName}\n` +
      `📅 Date: ${apt.appointmentDate}\n` +
      `⏰ Slot: ${apt.timeSlot}\n` +
      `🌿 Therapy: ${apt.therapy}\n` +
      `💰 Fee: ${feeText} (${apt.paymentStatus === 'paid_online' ? 'PAID UPI' : 'Pay at Clinic'})\n` +
      `📍 Location: Puramufti Purani Bazar, Prayagraj\n` +
      `📞 Helpline: +91 9455100097`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div id="my-slips-container" className="space-y-6">
      {/* Search Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">
              {language === 'hi' ? 'मेरी रसीद व पर्चा (My Slips & Receipts)' : 'My Slips & Appointment Tokens'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'अपने मोबाइल नंबर से पूर्व बुक किए गए सभी टोकन पर्चे देखें और डाउनलोड करें।'
                : 'Search by mobile phone to view and download all your clinic slips and tokens.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="Enter 10-digit mobile number..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-amber-300" />}
            <span>{language === 'hi' ? 'खोजें' : 'Search'}</span>
          </button>
        </form>
      </div>

      {/* Slips List */}
      {searched && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {language === 'hi' ? 'कोई रसीद नहीं मिली' : 'No Slips Found'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {language === 'hi'
                  ? 'इस मोबाइल नंबर से कोई सक्रिय पर्चा नहीं मिला। कृपया नया अपॉइंटमेंट बुक करें।'
                  : 'No appointment slips found for this number. Please book a new consultation session.'}
              </p>
              {onNavigateToBooking && (
                <button
                  type="button"
                  onClick={onNavigateToBooking}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer mt-2"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>{language === 'hi' ? 'नया अपॉइंटमेंट बुक करें' : 'Book New Session'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((apt) => {
                const isCompleted = apt.status === 'completed';
                const isInProgress = apt.status === 'in-progress';
                const isCancelled = apt.status === 'cancelled';
                // Dynamic Fee strictly displaying ₹{appointment.fee}
                const displayFee = apt.fee || (apt.visitType === 'returning_patient' ? 200 : 500);

                return (
                  <div
                    key={apt.id}
                    id={`apt-card-${apt.id}`}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 relative overflow-hidden transition-all hover:border-emerald-300"
                  >
                    {/* Booking Card Header with Dynamic Fee */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-emerald-950 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                          {apt.tokenNumber}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isInProgress
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {apt.status === 'in-progress' ? 'In Progress' : apt.status}
                        </span>
                      </div>

                      {/* Header Dynamically Displaying ₹{appointment.fee} */}
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-950 font-mono">
                          ₹{displayFee}
                        </span>
                        <span className="block text-[9px] font-semibold text-slate-400">
                          {apt.visitType === 'returning_patient' ? 'Returning' : '1st Visit'}
                        </span>
                      </div>
                    </div>

                    {/* Patient & Therapy details */}
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{apt.patientName}</span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          (+91 {apt.patientPhone})
                        </span>
                      </h4>
                      <div className="text-xs text-slate-700 font-medium mt-1 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{apt.therapy}</span>
                      </div>
                      {apt.condition && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Concern: <span className="text-slate-700 font-medium">{apt.condition}</span>
                        </div>
                      )}
                    </div>

                    {/* Time & Slot Box */}
                    <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1.5 border border-slate-200/80">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                        <span className="font-bold">{apt.appointmentDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                        <span className="font-bold font-mono">{apt.timeSlot}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
                        <span>
                          Payment:{' '}
                          <strong className="text-slate-800">
                            {apt.paymentStatus === 'paid_online'
                              ? `✓ Paid Online UPI`
                              : apt.paymentStatus === 'collected_at_clinic'
                              ? '✓ Paid at Clinic'
                              : '⏳ Pay at Clinic'}
                          </strong>
                        </span>
                        <span className="font-bold text-emerald-900 font-mono">₹{displayFee}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectReceipt(apt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="View styled digital token slip"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{language === 'hi' ? 'पर्चा देखें' : 'View Slip'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={downloadingPdfId === apt.id}
                          onClick={() => handleDownloadPdf(apt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          title="Download official PDF receipt slip"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>
                            {downloadingPdfId === apt.id
                              ? (language === 'hi' ? 'PDF बन रहा है...' : 'PDF...')
                              : (language === 'hi' ? 'PDF डाउनलोड' : 'PDF Slip')}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={downloadingImgId === apt.id}
                          onClick={() => handleDownloadImage(apt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                          title="Download token slip as image"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-950 stroke-[2.5]" />
                          <span>
                            {downloadingImgId === apt.id
                              ? (language === 'hi' ? 'फ़ोटो...' : 'Image...')
                              : (language === 'hi' ? 'फ़ोटो पर्चा' : 'Image Slip')}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleWhatsAppShare(apt)}
                        className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl transition-colors cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-4 h-4 text-emerald-800" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
