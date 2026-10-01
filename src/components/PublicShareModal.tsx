import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { copyToClipboard } from '../utils/clipboard';
import { useClinicLogo } from '../utils/logoHelper';
import { usePublicAppUrl } from '../utils/appUrlHelper';
import {
  Globe,
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  QrCode,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Download,
  Smartphone,
  Edit3,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { CLINIC_INFO } from '../data/clinicData';

interface PublicShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPhoneGuide?: () => void;
}

export const PublicShareModal: React.FC<PublicShareModalProps> = ({ isOpen, onClose, onOpenPhoneGuide }) => {
  const clinicLogo = useClinicLogo();
  const { publicAppUrl, updateUrl, resetUrl, isCustom } = usePublicAppUrl();

  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Link customization state
  const [isEditing, setIsEditing] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState(publicAppUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Real-time link reachability test
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ isOk: boolean; message: string } | null>(null);

  // Sync input when publicAppUrl updates
  useEffect(() => {
    setCustomInputUrl(publicAppUrl);
  }, [publicAppUrl]);

  // Generate QR Code whenever publicAppUrl changes or modal opens
  useEffect(() => {
    if (isOpen && publicAppUrl) {
      QRCode.toDataURL(publicAppUrl, {
        width: 440,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, publicAppUrl]);

  if (!isOpen) return null;

  const handleCopy = async (textToCopy: string) => {
    await copyToClipboard(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `bindsukh_clinic_patient_qr_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    let trimmed = customInputUrl.trim();
    if (!trimmed) {
      setStatusNotice({ type: 'error', message: 'कृपया एक वैध वेब लिंक (URL) दर्ज करें।' });
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
      setCustomInputUrl(trimmed);
    }

    setIsSaving(true);
    const ok = await updateUrl(trimmed);
    setIsSaving(false);

    if (ok) {
      setIsEditing(false);
      setStatusNotice({
        type: 'success',
        message: '✅ स्कैनर लिंक सफलतापूर्वक अपडेट हो गया! QR कोड अब इसी नए लिंक पर खुलेगा।'
      });
      setTimeout(() => setStatusNotice(null), 5000);
    } else {
      setStatusNotice({ type: 'error', message: 'लिंक सेव करने में त्रुटि आई। कृपया पुनः प्रयास करें।' });
    }
  };

  const handleResetDefaultUrl = async () => {
    setIsSaving(true);
    await resetUrl();
    setIsSaving(false);
    setIsEditing(false);
    setStatusNotice({
      type: 'info',
      message: '🔄 स्कैनर लिंक आधिकारिक डिफ़ॉल्ट शेयर लिंक पर रीसेट हो गया है।'
    });
    setTimeout(() => setStatusNotice(null), 5000);
  };

  const handleTestLink = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/check-public-status?url=${encodeURIComponent(publicAppUrl)}`);
      const data = await res.json();
      setIsTesting(false);
      setTestResult({
        isOk: Boolean(data.isPublished),
        message: data.message || (data.isPublished ? 'लिंक सक्रिय है!' : 'लिंक लोड नहीं हो रहा है')
      });
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({
        isOk: false,
        message: 'कनेक्शन जांचने में असमर्थ: ' + (err.message || 'Error')
      });
    }
  };

  const whatsappShareText = encodeURIComponent(
    `🙏 नमस्ते!\n\n*बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर* (हीलिंग थ्रू टच एंड मैग्नेट), प्रयागराज में थेरेपिस्ट सौरभ प्रजापति जी से इलाज के लिए अपना 1-घंटे का स्लॉट व टोकन ऑनलाइन बुक करें:\n\n👉 *मरीजों के लिए डायरेक्ट ऐप लिंक (Patient Live App):*\n${publicAppUrl}\n\n✅ किसी भी स्मार्टफोन से बिना किसी पासवर्ड के सीधे खुलता है।\n📞 क्लिनिक हेल्पलाइन: +91 9455100097`
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-h-[90vh] overflow-y-auto rounded-2xl w-full max-w-md bg-white shadow-2xl my-auto animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 relative shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={clinicLogo}
              alt="Bindsukh Clinic Official Logo"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 uppercase tracking-wider bg-emerald-800/80 px-2 py-0.5 rounded-md mb-1 border border-amber-300/20">
                <Sparkles className="w-3 h-3" /> QR Scanner Code
              </div>
              <h2 className="text-lg font-bold font-serif text-white leading-tight">
                मरीजों के लिए क्लिनिक QR कोड
              </h2>
            </div>
          </div>
        </div>

        {/* Status Notice Toast */}
        {statusNotice && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 border-b shrink-0 ${
              statusNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : statusNotice.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusNotice.message}</span>
            </div>
            <button
              onClick={() => setStatusNotice(null)}
              className="p-1 hover:opacity-75 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-slate-800 text-xs flex-1">
          {/* Main QR Code Card */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-emerald-100/40 rounded-2xl p-4 border border-emerald-200 shadow-sm flex flex-col items-center text-center space-y-3">
            {/* QR Code Container */}
            <div
              className="bg-white p-2 rounded-xl border border-emerald-600 shadow-lg relative flex items-center justify-center mx-auto overflow-hidden w-full max-w-[180px] aspect-square"
              style={{ maxWidth: '180px', width: '100%', aspectRatio: '1 / 1' }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Clinic Patient Public QR Code"
                  className="w-full h-full object-contain block"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-[11px]">
                  QR कोड लोड हो रहा है...
                </div>
              )}
            </div>

            <div className="text-[10px] font-extrabold text-emerald-900 bg-amber-400/90 py-0.5 px-2 rounded-full inline-flex items-center gap-1 border border-amber-500/30">
              <ShieldCheck className="w-3 h-3 text-emerald-950" />
              बिंदसुख एक्यूप्रेशर क्लिनिक प्रयागराज
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-950 font-serif flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>फोन कैमरा या Google Lens से स्कैन करें</span>
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                स्कैन करके मरीज सीधे बिना किसी Google लॉगिन के टोकन व समय बुक कर सकते हैं।
              </p>
            </div>

            {/* Quick Actions for QR */}
            <div className="flex flex-col gap-2 w-full pt-1">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>QR कोड डाउनलोड करें (प्रिंट हेतु)</span>
              </button>

              <a
                href={publicAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-800" />
                <span>नए टैब में खोलकर जांचें</span>
              </a>
            </div>
          </div>

          {/* Current URL & Custom URL Change Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span>सक्रिय लिंक (Active Link):</span>
              </label>
            </div>

            {!isEditing ? (
              <div className="space-y-2">
                <div className="flex flex-col gap-2">
                  <div className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-[10px] text-slate-800 break-all select-all shadow-inner">
                    {publicAppUrl}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(publicAppUrl)}
                      className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-950 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>कॉपी हुआ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>लिंक कॉपी करें</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>लिंक बदलें</span>
                    </button>
                  </div>
                </div>

                {/* Test button & results */}
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={handleTestLink}
                    disabled={isTesting}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'जांच हो रही है...' : 'सक्रियता जांचें (Test URL)'}</span>
                  </button>

                  {testResult && (
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        testResult.isOk ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {testResult.isOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span className="truncate max-w-[150px]">{testResult.message}</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Edit URL Form */
              <form onSubmit={handleSaveCustomUrl} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-700">
                    नया लिंक दर्ज करें (जैसे: https://your-domain.com):
                  </span>
                  <input
                    type="url"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-white border-2 border-amber-400 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{isSaving ? 'सेव हो रहा है...' : 'लिंक बदलें'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInputUrl(publicAppUrl);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-[11px] cursor-pointer"
                  >
                    रद्द करें
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={handleResetDefaultUrl}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1 text-[10px] text-rose-700 hover:text-rose-900 font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>रीसेट</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* WhatsApp Direct Share Banner */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col gap-2">
            <div className="space-y-0.5 text-center">
              <div className="font-bold text-emerald-950 text-xs flex items-center justify-center gap-1">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>व्हाट्सएप पर शेयर करें:</span>
              </div>
              <p className="text-[10px] text-emerald-800">
                बिना लॉगिन सीधे बुकिंग पेज खोलें।
              </p>
            </div>

            <a
              href={`https://api.whatsapp.com/send?text=${whatsappShareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>WhatsApp पर भेजें</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
          >
            बंद करें (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
