import React, { useState } from 'react';
import { PatientAppointment } from '../types';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { CLINIC_INFO } from '../data/clinicData';
import { useClinicLogo } from '../utils/logoHelper';
import { downloadCalendarIcsFile, getGoogleCalendarUrl } from '../utils/calendarHelper';
import {
  generateAndDownloadReceiptPdf,
  downloadReceiptAsImage,
  openPrintableReceiptWindow,
  renderElementToCanvasImage
} from '../utils/receiptPdfHelper';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Check,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Phone,
  Printer,
  Share2,
  Sparkles,
  User,
  X,
  FileDown,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface SlipModalProps {
  appointment: PatientAppointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SlipModal: React.FC<SlipModalProps> = ({
  appointment,
  isOpen,
  onClose,
}) => {
  useLockBodyScroll(isOpen);
  const clinicLogo = useClinicLogo();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [calendarSuccess, setCalendarSuccess] = useState(false);

  if (!isOpen || !appointment) return null;

  // Dynamic fee calculation: never hardcode ₹500
  const displayFee = appointment.fee || (appointment.visitType === 'returning_patient' ? 200 : 500);

  const handleDownloadSlip = async () => {
    if (!appointment) return;
    try {
      setIsGeneratingPdf(true);
      const success = await generateAndDownloadReceiptPdf(
        appointment,
        'printable-slip-wrapper',
        clinicLogo
      );
      if (success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error downloading receipt PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!appointment) return;
    try {
      setIsGeneratingImg(true);
      await downloadReceiptAsImage(appointment, 'printable-slip-wrapper');
    } catch (err) {
      console.error('Error downloading receipt image:', err);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleDownloadCalendar = () => {
    if (!appointment) return;
    const ok = downloadCalendarIcsFile(appointment);
    if (ok) {
      setCalendarSuccess(true);
      setTimeout(() => setCalendarSuccess(false), 4000);
    }
  };

  const handlePrint = async () => {
    if (!appointment) return;
    try {
      const imgDataUrl = await renderElementToCanvasImage('printable-slip-wrapper');
      openPrintableReceiptWindow(appointment, imgDataUrl || undefined);
    } catch (err) {
      console.error('Error printing receipt:', err);
      openPrintableReceiptWindow(appointment);
    }
  };

  const handleWhatsAppShare = () => {
    if (!appointment) return;
    const msg = encodeURIComponent(
      `*Bindsukh Clinic Appointment Token Slip*\n\n` +
      `📋 Token: ${appointment.tokenNumber}\n` +
      `👤 Patient: ${appointment.patientName}\n` +
      `📅 Date: ${appointment.appointmentDate}\n` +
      `⏰ Time Slot: ${appointment.timeSlot}\n` +
      `🌿 Therapy: ${appointment.therapy}\n` +
      `💰 Fee: ₹${displayFee} (${appointment.paymentStatus === 'paid_online' ? 'PAID UPI' : 'Pay at Clinic'})\n` +
      `📍 Location: Puramufti Purani Bazar, Prayagraj\n` +
      `📞 Helpline: +91 9455100097`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div
      id="receipt-modal-overlay"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto no-print animate-in fade-in duration-200"
    >
      <div
        id="receipt-modal-container"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 relative my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition-colors cursor-pointer"
          title="Close slip modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Pass Container */}
        <div id="printable-slip-wrapper" className="bg-white">
          {/* Header Strip with Clinic Brand */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white p-6 relative overflow-hidden text-center">
            <div className="relative z-10 flex flex-col items-center">
              {clinicLogo && (
                <img
                  src={clinicLogo}
                  alt={CLINIC_INFO.name}
                  className="w-14 h-14 rounded-full border-2 border-amber-300 shadow-md mb-2 object-cover"
                />
              )}
              <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-800/80 text-[10px] font-bold text-amber-300 border border-emerald-700/60 mb-1">
                Official Token Slip • आधिकारिक रसीद पर्ची
              </div>
              <h2 className="text-lg font-bold font-serif">{CLINIC_INFO.name}</h2>
              <p className="text-xs text-amber-300 font-medium tracking-wide">{CLINIC_INFO.taglineHindi}</p>
              <p className="text-[11px] text-emerald-200 mt-0.5">{CLINIC_INFO.address}</p>
            </div>
          </div>

          {/* Printable Slip Body */}
          <div id="printable-slip" className="p-6 space-y-4">
            {/* Token Card */}
            <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center">
              <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold">Official Queue Token</div>
              <div className="text-3xl font-black text-emerald-950 tracking-wider font-mono my-1">
                {appointment.tokenNumber}
              </div>
              <div className="text-xs text-emerald-700 font-medium">
                Please present this token at the reception desk
              </div>
            </div>

            {/* Details Table */}
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" /> Patient Name
                </span>
                <span className="font-bold text-slate-800">{appointment.patientName}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" /> Contact Phone
                </span>
                <span className="font-mono text-slate-800 font-medium">+91 {appointment.patientPhone}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date
                </span>
                <span className="font-bold text-emerald-900">{appointment.appointmentDate}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" /> 1-Hour Time Slot
                </span>
                <span className="font-bold text-emerald-900">{appointment.timeSlot}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Therapy
                </span>
                <span className="font-semibold text-slate-800">{appointment.therapy}</span>
              </div>
              {appointment.condition && (
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500 font-medium">Concern / Condition</span>
                  <span className="text-slate-700 font-medium">{appointment.condition}</span>
                </div>
              )}
              {/* Dynamic Fee Line */}
              <div className="p-3 flex justify-between items-center bg-slate-50/50">
                <div>
                  <span className="text-slate-600 font-semibold block">Consultation & Therapy Fee</span>
                  <span className="text-[10px] text-slate-400">
                    {appointment.visitType === 'returning_patient' ? 'Returning Patient Rate' : 'First Visit Registration + Therapy'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-900 font-mono">₹{displayFee}</span>
                  <span className={`block text-[10px] font-bold ${
                    appointment.paymentStatus === 'paid_online' || appointment.paymentStatus === 'collected_at_clinic'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}>
                    {appointment.paymentStatus === 'paid_online' ? '✓ Paid Online (UPI)' : 'Payment Pending at Clinic'}
                  </span>
                </div>
              </div>
            </div>

            {/* Practitioner Note */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <span>Practitioner:</span> {CLINIC_INFO.leadPractitioner}
              </p>
              <p className="text-[10px] text-amber-800">{CLINIC_INFO.qualifications}</p>
              <p className="text-[10px] text-slate-600 pt-1">
                📌 <strong>Important Instructions:</strong> Please arrive 10 minutes before your slot. Wear comfortable loose clothing. Bring prior MRI / X-ray reports if available.
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Reminder & Actions */}
        <div className="p-6 pt-0 space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <CalendarPlus className="w-4 h-4 text-emerald-700" />
                <span>फोन कैलेंडर में रिमाइंडर जोड़ें (Add to Calendar)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                .ics Invite
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleDownloadCalendar}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {calendarSuccess ? (
                  <>
                    <CalendarCheck className="w-4 h-4 text-amber-300" />
                    <span>कैलेंडर फ़ाइल डाउनलोड हुई!</span>
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4 text-amber-300" />
                    <span>कैलेंडर फ़ाइल (.ics)</span>
                  </>
                )}
              </button>
              <a
                href={getGoogleCalendarUrl(appointment)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span>Google Calendar</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 no-print">
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadSlip}
            className="flex-1 min-w-[125px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-75"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Generating PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-amber-300" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-amber-300" />
                <span>PDF Slip</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isGeneratingImg}
            onClick={handleDownloadImage}
            className="flex-1 min-w-[125px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-emerald-950 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-75"
          >
            {isGeneratingImg ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-950" />
                <span>Generating Image...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 text-emerald-950" />
                <span>Image Slip</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="p-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl transition-colors cursor-pointer border border-emerald-300"
            title="Share token slip on WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Print appointment slip"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
