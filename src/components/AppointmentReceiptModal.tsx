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
  renderElementToCanvasImage,
  printReceiptSlip
} from '../utils/receiptPdfHelper';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Check,
  CheckCircle2,
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
  Image
} from 'lucide-react';

interface AppointmentReceiptModalProps {
  appointment: PatientAppointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentReceiptModal: React.FC<AppointmentReceiptModalProps> = ({
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
    } catch (e) {
      printReceiptSlip('printable-slip-wrapper');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `*Bindsukh Acupressure & Acupuncture Center*
Token No: ${appointment.tokenNumber}
Patient: ${appointment.patientName}
Date: ${appointment.appointmentDate}
Time: ${appointment.timeSlot}
Therapy: ${appointment.therapy}
Fee: ₹${appointment.fee} (${appointment.paymentStatus === 'paid_online' ? 'Paid via UPI' : 'Pay at Clinic'})
Address: ${CLINIC_INFO.address}
Doctor: ${CLINIC_INFO.leadPractitioner}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div id="receipt-modal-overlay" className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div id="receipt-modal-container" className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-900/15 overflow-hidden my-6">
        
        {/* Printable Card Area Captured into High-Res PDF */}
        <div id="printable-slip-wrapper" className="bg-white">
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-emerald-950 to-emerald-800 text-white p-5 text-center relative">
            <button
              id="close-receipt-btn"
              onClick={onClose}
              className="absolute right-4 top-4 text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition-colors no-print"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img
                  src={clinicLogo}
                  alt="Bindsukh Clinic Official Logo Seal"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
                />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-400 text-emerald-950 text-[9px] font-black rounded-full border border-white shadow-xs">
                  SEAL
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mb-1 border border-amber-400/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Booking Confirmed • आधिकारिक रसीद पर्ची
              </div>
              <h2 className="text-lg font-bold font-serif">{CLINIC_INFO.name}</h2>
              <p className="text-xs text-amber-300 font-medium tracking-wide">{CLINIC_INFO.taglineHindi}</p>
              <p className="text-[11px] text-emerald-200 mt-0.5">{CLINIC_INFO.address}</p>
            </div>
          </div>

          {/* Printable Pass Content */}
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
              <div className="p-3 flex justify-between items-center bg-slate-50/50">
                <div>
                  <span className="text-slate-600 font-semibold block">Consultation & Therapy Fee</span>
                  <span className="text-[10px] text-slate-400">
                    {appointment.visitType === 'returning_patient' ? 'Returning Patient Rate' : 'First Visit Registration + Therapy'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-900">₹{appointment.fee}</span>
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

        {/* Calendar Reminder & .ics Invitation Section */}
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
            <p className="text-[11px] text-slate-600 leading-relaxed">
              कैलेंडर इन्विटेशन (.ics) डाउनलोड करें ताकि आपके फोन पर अपॉइंटमेंट से 2 घंटे और 24 घंटे पहले स्वतः अलार्म व नोटिफिकेशन आए।
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                id="download-ics-card-btn"
                type="button"
                onClick={handleDownloadCalendar}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Download .ics calendar invitation file for Apple / Google / Outlook Calendar"
              >
                {calendarSuccess ? (
                  <>
                    <CalendarCheck className="w-4 h-4 text-amber-300" />
                    <span>कैलेंडर फ़ाइल डाउनलोड हुई!</span>
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4 text-amber-300" />
                    <span>कैलेंडर फ़ाइल (.ics) डाउनलोड करें</span>
                  </>
                )}
              </button>
              <a
                href={getGoogleCalendarUrl(appointment)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Add directly to Google Calendar online"
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
            id="download-slip-btn"
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadSlip}
            className="flex-1 min-w-[125px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-75"
            title="Download official PDF token receipt slip to device"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-amber-300" />
                <span>PDF Saved!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-amber-300" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Direct Image Download Button for WebViews */}
          <button
            id="download-image-slip-btn"
            type="button"
            disabled={isGeneratingImg}
            onClick={handleDownloadImage}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-emerald-950 font-black rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-75"
            title="Download receipt card as PNG image for Android WebViews"
          >
            {isGeneratingImg ? (
              <>
                <Loader2 className="w-4 h-4 text-emerald-950 animate-spin" />
                <span>Creating Image...</span>
              </>
            ) : (
              <>
                <Image className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                <span>Save Image (फोटो पर्चा)</span>
              </>
            )}
          </button>

          <button
            id="print-receipt-btn"
            type="button"
            onClick={handlePrint}
            className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Open clean printable receipt view or print dialog"
          >
            <Printer className="w-4 h-4 text-amber-300" /> Print / View
          </button>

          <button
            id="share-whatsapp-btn"
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 min-w-[80px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>
    </div>
  );
};
