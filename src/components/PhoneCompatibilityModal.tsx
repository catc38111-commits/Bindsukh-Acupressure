import React, { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { usePublicAppUrl } from '../utils/appUrlHelper';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Smartphone,
  Sparkles,
  X
} from 'lucide-react';

interface PhoneCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPublicModal?: () => void;
  onOpenInstallModal?: () => void;
}

export const PhoneCompatibilityModal: React.FC<PhoneCompatibilityModalProps> = ({
  isOpen,
  onClose,
  onOpenPublicModal,
  onOpenInstallModal
}) => {
  const [copied, setCopied] = useState(false);
  const { publicAppUrl } = usePublicAppUrl();

  if (!isOpen) return null;

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `🙏 नमस्ते!\n\n*बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर*, प्रयागराज (थेरेपिस्ट सौरभ प्रजापति जी) की आधिकारिक क्लिनिक लिंक:\n${publicAppUrl}\n\n💡 *फोन/iPhone पर खोलने की सलाह:* यदि स्क्रीन पर "Action required to load your app" या Cookie का संदेश आए, तो बस नीचे दिए गए *"Close and continue"* बटन पर 1 बार क्लिक करें या लिंक को Google Chrome में खोलें।`
  );

  return (
    <div
      id="phone-compatibility-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-slate-800 text-xs">
        {/* 1. Header Section */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 relative border-b border-emerald-800/80">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider bg-emerald-800/80 px-2.5 py-0.5 rounded-md mb-1 border border-amber-300/20">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>📱 MOBILE &amp; IPHONE GUIDE • समाधान</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white leading-tight">
                Fix "Action required to load your app" on Phone
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                iPhone, Safari एवं अन्य स्मार्टफ़ोन्स में ऐप आसानी से चलाने का आसान उपाय
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto bg-[#fafcfb]">
          {/* Welcome Patient Note */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs space-y-2">
            <h3 className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
              <span className="text-base select-none">✨</span>
              <span>मरीजों के लिए मोबाइल गाइड (Patient Access Guide):</span>
            </h3>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर प्रयागराज के ऑनलाइन पोर्टल का उपयोग करने के लिए नीचे दिए गए निर्देशों का पालन करें ताकि आप बिना किसी रुकावट के समय और टोकन बुक कर सकें।
            </p>
          </div>

          {/* Step-by-Step Patient Guide */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>✅ सुचारू रूप से चलाने के आसान उपाय:</span>
            </h3>

            {/* Step 1: Install to Home Screen (Primary recommendation) */}
            <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-400 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-700 text-white text-xs flex items-center justify-center font-bold shrink-0">
                    1
                  </span>
                  <span>सबसे आसान तरीका: ऐप होम स्क्रीन पर जोड़ें</span>
                </span>
                <span className="text-[10px] font-extrabold text-white bg-amber-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-2xs">
                  RECOMMENDED
                </span>
              </div>
              <p className="text-xs text-slate-800 pl-8 leading-relaxed">
                अपने मोबाइल में नीचे दिए गए <strong>"Install App Guide"</strong> बटन पर क्लिक करके ऐप को अपने फोन की होम स्क्रीन पर सीधे इंस्टॉल कर लें। इससे ब्राउज़र खोलने की झंझट खत्म हो जाएगी!
              </p>
              {onOpenInstallModal && (
                <div className="pl-8 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInstallModal();
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                  >
                    <span>Install App Guide देखें →</span>
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Safari Cookie Fix */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[11px] flex items-center justify-center font-mono shrink-0">
                    2
                  </span>
                  <span>Safari / iPhone पर "Close and continue" दबाएं</span>
                </span>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full shrink-0">
                  Safari Tip
                </span>
              </div>
              <p className="text-[11px] text-slate-700 pl-7 leading-relaxed">
                यदि iPhone Safari पर कुकी अनुमति का नोटिस दिखाई दे, तो नीचे दिए गए नीले बटन <strong>"Close and continue"</strong> पर क्लिक करें। Safari तुरंत पोर्टल शुरू कर देगा।
              </p>
            </div>

            {/* Step 3: Use Chrome */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[11px] flex items-center justify-center font-mono shrink-0">
                    3
                  </span>
                  <span>Google Chrome का उपयोग करें</span>
                </span>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full shrink-0">
                  Chrome Browser
                </span>
              </div>
              <p className="text-[11px] text-slate-700 pl-7 leading-relaxed">
                उत्कृष्ट अनुभव और बिना किसी रुकावट के त्वरित बुकिंग के लिए अपने एंड्रॉयड या आईफोन में Google Chrome ब्राउज़र का उपयोग करें।
              </p>
            </div>
          </div>
        </div>

        {/* 4. Footer Copy Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          <label className="block font-bold text-slate-900 text-xs">
            Direct Public Link to Share (सार्वजनिक लिंक):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicAppUrl}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 select-all shadow-inner focus:outline-none"
            />
            {/* Green "Copy" button with clipboard icon */}
            <button
              type="button"
              onClick={() => handleCopy(publicAppUrl)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm cursor-pointer"
              title="Copy link instantly"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80">
            <a
              href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp पर भेजें</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Got It • समझ गया
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Also export as MobileTroubleshootingModal for flexible import naming
export const MobileTroubleshootingModal = PhoneCompatibilityModal;
