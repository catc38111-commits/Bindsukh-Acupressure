import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CLINIC_INFO } from '../data/clinicData';
import { CheckCircle2, Copy, ExternalLink, QrCode, ShieldCheck, X, Upload, Image } from 'lucide-react';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee: number;
  patientName: string;
  patientPhone: string;
  timeSlot: string;
  appointmentDate: string;
  onPaymentConfirmed: (referenceId: string) => void;
  isSubmitting?: boolean;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  fee,
  patientName,
  patientPhone,
  timeSlot,
  appointmentDate,
  onPaymentConfirmed,
  isSubmitting = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // UPI intent URI
  const upiUrl = `upi://pay?pa=${CLINIC_INFO.upiId}&pn=${encodeURIComponent(
    CLINIC_INFO.merchantName
  )}&am=${fee}&cu=INR&tn=${encodeURIComponent(`Acupressure Center - ${patientName}`)}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(upiUrl, {
        width: 440,
        margin: 2,
        color: {
          dark: '#064e3b', // Emerald dark
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, upiUrl]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(CLINIC_INFO.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!referenceNumber.trim() && !screenshotBase64) {
      setErrorMsg('Please enter the UPI Transaction ID / UTR Number OR Upload a Payment Screenshot to confirm booking.');
      return;
    }
    setErrorMsg('');
    const refText = referenceNumber.trim() || `SCREENSHOT_UPLOADED:${screenshotName}`;
    onPaymentConfirmed(refText);
  };

  return (
    <div id="upi-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div id="upi-modal-container" className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-emerald-900/10 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white p-5 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 rounded-xl text-amber-300 border border-amber-400/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif tracking-wide text-white">Live UPI Instant Payment</h3>
              <p className="text-xs text-emerald-200">Merchant: {CLINIC_INFO.merchantName}</p>
            </div>
          </div>
          <button
            id="close-upi-modal-btn"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800/50 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Internal scrollable container to prevent overflow issues on WebViews and WebKit) */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar">
          {/* Summary Pill */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-800 font-medium">Patient: <span className="font-semibold text-emerald-950">{patientName}</span></div>
              <div className="text-xs text-emerald-700">{appointmentDate} • {timeSlot}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Payable Fee</div>
              <div className="text-2xl font-extrabold text-emerald-900">₹{fee}</div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-emerald-50/40 rounded-2xl border border-emerald-100 shadow-inner">
            <div
              className="p-2 sm:p-2.5 bg-white rounded-xl shadow-md border border-emerald-100 w-full max-w-[220px] aspect-square flex items-center justify-center mx-auto overflow-hidden"
              style={{ maxWidth: '220px', width: '100%', aspectRatio: '1 / 1' }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain block"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">Loading QR...</div>
              )}
            </div>
            <p className="mt-3 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI App
            </p>
          </div>

          {/* Merchant UPI ID display & copy */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Official Clinic UPI ID</div>
              <div className="text-sm font-bold text-slate-800 font-mono">{CLINIC_INFO.upiId}</div>
            </div>
            <button
              id="copy-upi-btn"
              type="button"
              onClick={handleCopyUpi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Pay Buttons for Mobile & WebView APK */}
          <div className="space-y-2">
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              ⚡ Quick Pay via UPI Apps (मोबाईल से सीधे भुगतान करें)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* PhonePe */}
              <a
                href={`phonepe://pay?pa=${CLINIC_INFO.upiId}&pn=${encodeURIComponent(CLINIC_INFO.merchantName)}&am=${fee}&cu=INR&tn=${encodeURIComponent(`Acupressure Center - ${patientName}`)}`}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] border border-violet-800 text-center"
              >
                <span className="w-4 h-4 bg-white text-violet-700 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0">P</span>
                PhonePe
              </a>

              {/* Google Pay */}
              <a
                href={`gpay://upi/pay?pa=${CLINIC_INFO.upiId}&pn=${encodeURIComponent(CLINIC_INFO.merchantName)}&am=${fee}&cu=INR&tn=${encodeURIComponent(`Acupressure Center - ${patientName}`)}`}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] border border-blue-700 text-center"
              >
                <span className="w-4 h-4 bg-white text-blue-600 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0">G</span>
                Google Pay
              </a>

              {/* Paytm */}
              <a
                href={`paytmmp://pay?pa=${CLINIC_INFO.upiId}&pn=${encodeURIComponent(CLINIC_INFO.merchantName)}&am=${fee}&cu=INR&tn=${encodeURIComponent(`Acupressure Center - ${patientName}`)}`}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] border border-sky-600 text-center"
              >
                <span className="w-4 h-4 bg-white text-sky-500 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0">P</span>
                Paytm
              </a>

              {/* Generic any app */}
              <a
                href={upiUrl}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] border border-emerald-950 text-center"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                Other UPI App
              </a>
            </div>
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              💡 Tip: Tap any button above to open payment apps instantly. If your WebView/APK blocks app-launch, copy the UPI ID or scan the QR Code.
            </p>
          </div>

          {/* Reference UTR input and file upload screenshot */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                UPI Reference / UTR Number <span className="text-amber-600">*</span>
              </label>
              <input
                id="upi-ref-input"
                type="text"
                placeholder="e.g. 428901238492 or last 6 digits"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm font-mono text-slate-800"
              />
              <p className="text-[11px] text-slate-500">
                Enter the transaction ID shown in your UPI app to verify booking instantly.
              </p>
            </div>

            {/* OR Divider */}
            <div className="flex items-center my-2.5">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-3 text-xs font-bold text-slate-400 uppercase">OR</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            {/* Screenshot Upload field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Upload Payment Screenshot (स्क्रीनशॉट अपलोड करें) <span className="text-amber-600">*</span>
              </label>
              <div className="relative flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 bg-slate-50/50 hover:bg-emerald-50/10 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="text-center space-y-1">
                  <Upload className="w-5 h-5 mx-auto text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  <p className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">
                    {screenshotName ? `Selected: ${screenshotName}` : 'Click to Upload Screenshot Image'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Supported: JPG, PNG, WebP (Max 10MB)
                  </p>
                </div>
              </div>
              {screenshotBase64 && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                  <Image className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold truncate">Screenshot attached: {screenshotName}</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-lg p-2">
                ⚠ {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            id="cancel-upi-payment-btn"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-upi-payment-btn"
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying...' : 'I Have Paid • Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};
