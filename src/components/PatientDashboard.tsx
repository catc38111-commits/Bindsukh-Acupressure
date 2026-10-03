import React, { useState, useEffect } from 'react';
import { PatientAppointment } from '../types';
import { CLINIC_INFO } from '../data/clinicData';
import { downloadCalendarIcsFile } from '../utils/calendarHelper';
import { getAbsoluteApiUrl, safeParseJsonResponse } from '../utils/appUrlHelper';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  FileText,
  Phone,
  Search,
  Sparkles,
  User,
  XCircle,
  AlertCircle,
  CheckCircle2,
  MapPin,
  MessageCircle
} from 'lucide-react';

interface PatientDashboardProps {
  onSelectReceipt: (appointment: PatientAppointment) => void;
  initialPhone?: string;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onSelectReceipt,
  initialPhone = '',
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [downloadedIcsId, setDownloadedIcsId] = useState<string | null>(null);

  const fetchPatientAppointments = async (phoneToQuery: string) => {
    const cleanPhone = phoneToQuery.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) return;

    try {
      setLoading(true);
      setSearched(true);
      const endpoint = getAbsoluteApiUrl(`/api/appointments?phone=${cleanPhone}`);
      const res = await fetch(endpoint);
      const parsed = await safeParseJsonResponse<PatientAppointment[]>(res);

      if (parsed.ok && parsed.data && parsed.data.length > 0) {
        setAppointments(parsed.data);
      } else {
        // Check if stored matches
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
      console.error('Error fetching patient appointments:', err);
      // Try fallback on network error
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bindsukh_active_booking');
      if (stored) {
        const apt = JSON.parse(stored) as PatientAppointment;
        if (apt && apt.patientPhone) {
          const cleanPhone = apt.patientPhone.replace(/\D/g, '').slice(-10);
          setPhone(cleanPhone);
          setAppointments([apt]);
          setSearched(true);
          fetchPatientAppointments(cleanPhone);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading stored booking:', e);
    }

    if (initialPhone && initialPhone.length === 10) {
      setPhone(initialPhone);
      fetchPatientAppointments(initialPhone);
    }
  }, [initialPhone]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatientAppointments(phone);
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment slot?')) return;

    try {
      setCancellingId(id);
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
        );
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div id="patient-dashboard-wrapper" className="space-y-6">
      {/* Header Banner with Liquid Glass Dark */}
      <div className="liquid-glass-dark text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mb-2 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            डिजिटल पर्चा व टोकन ट्रैकर • Patient Digital Slip Tracker
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif">My Appointments &amp; Token Slip</h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1">
            यहाँ अपना 10-अंकों का मोबाइल नंबर डालकर अपने सभी अपॉइंटमेंट, टोकन नंबर और थेरेपिस्ट का डिजिटल पर्चा देखें।
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4 text-emerald-300" />
            </div>
            <input
              id="dashboard-phone-search"
              type="tel"
              maxLength={10}
              placeholder="Enter 10-digit mobile number / 10 अंकों का मोबाइल नंबर..."
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-10 pr-4 py-3 bg-white/10 text-white placeholder:text-emerald-200/60 rounded-2xl border border-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-mono backdrop-blur-sm"
            />
          </div>
          <button
            id="track-appointments-btn"
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-500 text-emerald-950 font-bold rounded-2xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 border border-white/30"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Finding...' : 'Track My Slip (पर्चा देखें)'}
          </button>
        </form>
      </div>

      {/* Results Display */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Appointments for Mobile: <span className="font-mono text-emerald-800">+91 {phone}</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Found {appointments.length} record{appointments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No Appointments Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any appointments linked to this mobile number. Please double check the number or book a new clinical session.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((apt) => {
                const isCompleted = apt.status === 'completed';
                const isInProgress = apt.status === 'in-progress';
                const isCancelled = apt.status === 'cancelled';

                return (
                  <div
                    key={apt.id}
                    id={`apt-card-${apt.id}`}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 relative overflow-hidden transition-all hover:border-emerald-300"
                  >
                    {/* Status Top Strip */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-100 px-2.5 py-1 rounded-lg">
                          {apt.tokenNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {apt.status === 'in-progress' ? 'Session In Progress' : apt.status}
                        </span>
                      </div>

                      <span className="text-xs font-black text-emerald-900">₹{apt.fee}</span>
                    </div>

                    {/* Patient & Therapy details */}
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{apt.patientName}</h4>
                      <div className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{apt.therapy}</span>
                      </div>
                      {apt.condition && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Concern: <span className="text-slate-700 font-medium">{apt.condition}</span>
                        </div>
                      )}
                    </div>

                    {/* Time & Slot Box */}
                    <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                        <span className="font-semibold">{apt.appointmentDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-emerald-800" />
                        <span className="font-semibold font-mono">{apt.timeSlot}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        Payment: <span className="font-semibold text-slate-700">
                          {apt.paymentStatus === 'paid_online'
                            ? `✓ Paid Online via UPI (Ref: ${apt.upiReferenceNumber || 'Verified'})`
                            : apt.paymentStatus === 'collected_at_clinic'
                            ? '✓ Collected at Clinic'
                            : '⏳ Pay at Clinic Counter'}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectReceipt(apt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Slip
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ok = downloadCalendarIcsFile(apt);
                            if (ok) {
                              setDownloadedIcsId(apt.id);
                              setTimeout(() => setDownloadedIcsId(null), 3500);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          title="Download calendar reminder (.ics file) to device"
                        >
                          {downloadedIcsId === apt.id ? (
                            <>
                              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>.ics Saved!</span>
                            </>
                          ) : (
                            <>
                              <CalendarPlus className="w-3.5 h-3.5 text-amber-700" />
                              <span>Add to Calendar (.ics)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {apt.status === 'scheduled' && (
                        <button
                          type="button"
                          disabled={cancellingId === apt.id}
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Clinic Help Box */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-emerald-950">Need Directions or Assistance?</h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Puramufti Purani Bazar, Prayagraj - Near Puramufti Panchayat Bhawan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            Call Clinic
          </a>
          <a
            href={`https://wa.me/${CLINIC_INFO.whatsapp}?text=${encodeURIComponent('Hello Therapist Saurabh, I have a query regarding my acupressure appointment.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
