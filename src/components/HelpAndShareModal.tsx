import React, { useState } from 'react';
import { usePublicAppUrl } from '../utils/appUrlHelper';
import { copyToClipboard } from '../utils/clipboard';
import { useClinicLogo } from '../utils/logoHelper';
import {
  MessageCircle,
  X,
  Copy,
  Check,
  Globe,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface HelpAndShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditUrl?: () => void;
}

export const HelpAndShareModal: React.FC<HelpAndShareModalProps> = ({
  isOpen,
  onClose,
  onOpenEditUrl
}) => {
  const { publicAppUrl } = usePublicAppUrl();
  const clinicLogo = useClinicLogo();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    await copyToClipboard(publicAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappShareText = encodeURIComponent(
    `🙏 नमस्ते!\n\n*बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर* (हीलिंग थ्रू टच एंड मैग्नेट), प्रयागराज में थेरेपिस्ट सौरभ प्रजापति जी से इलाज के लिए अपना 1-घंटे का स्लॉट व टोकन ऑनलाइन बुक करें:\n\n👉 *मरीजों के लिए डायरेक्ट बुकिंग लिंक:*\n${publicAppUrl}\n\n✅ किसी भी स्मार्टफोन से बिना किसी पासवर्ड के सीधे खुलता है।\n📞 क्लिनिक हेल्पलाइन: +91 9455100097`
  );

  return (
    <div
      id="help-and-share-modal-overlay"
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="help-and-share-card"
        className="bg-white max-h-[90vh] overflow-y-auto rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/90 flex flex-col my-auto animate-in zoom-in-95 duration-200 text-slate-800 text-xs"
      >
        {/* 1. Modal Header with Branding and Top Action Button */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 border-b border-emerald-800/80 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={clinicLogo}
                alt="Bindsukh Clinic Official Logo"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-md shrink-0"
              />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 uppercase tracking-wider bg-emerald-800/80 px-2 py-0.5 rounded-md border border-amber-300/20 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>सहायता व शेयर (Help &amp; Share)</span>
                </div>
                <h2 className="text-sm font-bold font-serif text-white truncate leading-tight">
                  Bindsukh Acupressure Center
                </h2>
              </div>
            </div>

            {/* Top Action Button: बंद करें (Done) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 bg-[#fafcfb] flex-1">
          {/* Section 1: Direct WhatsApp Sharing */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-3">
            <div className="flex flex-col gap-2 pb-2">
              <h3 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                <span>व्हाट्सएप पर मरीजों को भेजें:</span>
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                लिंक पर क्लिक करते ही बिना किसी पासवर्ड के सीधे स्लॉट बुकिंग पेज खुलता है।
              </p>
            </div>

            {/* Action Button: Green "WhatsApp पर शेयर करें" */}
            <a
              href={`https://api.whatsapp.com/send?text=${whatsappShareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-emerald-500"
            >
              <MessageCircle className="w-4 h-4 text-white fill-white" />
              <span>WhatsApp पर शेयर करें</span>
            </a>

            {/* Quick Live Link Preview & Copy */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col gap-2 pt-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-mono text-[10px] text-slate-700 truncate select-all">
                  {publicAppUrl}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-950 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
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
                <a
                  href={publicAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors shrink-0"
                  title="Open directly"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-800" />
                </a>
              </div>
            </div>
          </div>

          {onOpenEditUrl && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditUrl();
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
              >
                <span>अपना कस्टम लिंक बदलें (Customize Link)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 text-[10px] font-medium text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Bindsukh Acupressure Center • प्रयागराज</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-emerald-900 hover:bg-emerald-950 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            बंद करें (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
