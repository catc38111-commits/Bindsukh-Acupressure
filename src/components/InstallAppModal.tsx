import React, { useState } from 'react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { copyToClipboard } from '../utils/clipboard';
import { useClinicLogo } from '../utils/logoHelper';
import { usePublicAppUrl } from '../utils/appUrlHelper';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  ExternalLink,
  Laptop,
  Layers,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { CLINIC_INFO } from '../data/clinicData';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  useLockBodyScroll(isOpen);
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'mobile' | 'apk' | 'desktop'>('mobile');
  const clinicLogo = useClinicLogo();
  const { publicAppUrl } = usePublicAppUrl();

  if (!isOpen) return null;

  const currentUrl = publicAppUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const handleCopyLink = async () => {
    await copyToClipboard(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-emerald-900/15 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src={clinicLogo}
              alt="Bindsukh Clinic Official Logo"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider bg-emerald-800/80 px-2 py-0.5 rounded-md mb-1">
                <Sparkles className="w-3 h-3" /> Progressive Web App &amp; Mobile APK
              </div>
              <h2 className="text-xl font-bold font-serif text-white leading-tight">
                Install &amp; Convert Bindsukh App
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Install directly on your phone home screen like a native Android/iOS app
              </p>
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-emerald-800/80 pt-3">
            <button
              onClick={() => setActiveTab('mobile')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'mobile'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-200 hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Direct Install (PWA)
            </button>
            <button
              onClick={() => setActiveTab('apk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'apk'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-200 hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Convert to Android APK
            </button>
            <button
              onClick={() => setActiveTab('desktop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'desktop'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-200 hover:bg-white/10'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              PC / Mac Clinic App
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-700 text-xs">
          {/* TAB 1: Mobile Direct Install (PWA) */}
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              {/* Android One-Click Button */}
              {isInstallable && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                  <div className="font-bold text-amber-950 text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-700" />
                    1-Tap Installation Ready
                  </div>
                  <p className="text-xs text-amber-900">
                    नीचे दिए गए बटन पर टैप करके बिन्दसुख सेंटर ऐप को सीधे अपने फ़ोन की होम स्क्रीन पर इंस्टॉल करें।
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await triggerInstall();
                      if (success) onClose();
                    }}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Install Bindsukh App on This Device
                  </button>
                </div>
              )}

              {/* iOS Safari Instructions */}
              {isIOS && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-emerald-700" />
                    iPhone / iPad Installation:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 text-xs">
                    <li>
                      Open this link in <strong>Safari browser</strong>.
                    </li>
                    <li>
                      Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> <strong>Share</strong> button in the bottom menu bar.
                    </li>
                    <li>
                      Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-700" /> <strong>"Add to Home Screen"</strong>.
                    </li>
                    <li>Tap <strong>Add</strong> in the top right. The app will appear on your iPhone home screen!</li>
                  </ol>
                </div>
              )}

              {/* Android / Chrome Manual Steps */}
              {(!isIOS || !isInstallable) && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    Android (Chrome / Edge / Browser) Steps:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 text-xs">
                    <li>अपने ब्राउज़र में ऊपर दाईं ओर <strong>तीन बिंदुओं (⋮)</strong> वाले मेनू पर टैप करें।</li>
                    <li>मेनू में <strong>"Install app"</strong> या <strong>"Add to Home screen" (होम स्क्रीन में जोड़ें)</strong> चुनें।</li>
                    <li><strong>Install / Add</strong> पर क्लिक करें। ऐप आपके फ़ोन के होम स्क्रीन पर ऐप आइकॉन के रूप में सेव हो जाएगा।</li>
                  </ol>
                </div>
              )}

              {isInstalled && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>यह ऐप PWA मोड में सक्रिय है। यदि आपके होम स्क्रीन पर इसका आइकॉन नहीं दिख रहा है, तो ऊपर दिए गए चरणों से 'Add to Home screen' कर लें।</span>
                </div>
              )}

              {/* Benefits of App */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="font-bold text-emerald-950 text-xs">⚡ Instant Access</div>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">Launches in full screen without browser address bar.</p>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="font-bold text-emerald-950 text-xs">📴 Offline Timings</div>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">View Therapist Saurabh's timings &amp; clinic address even without internet.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Convert to Android APK / Play Store */}
          {activeTab === 'apk' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5">
                <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  How to Convert this PWA into an Android APK / AAB
                </h4>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Because this app is built with compliant <strong>Web App Manifest</strong> and <strong>Service Worker</strong>, you can package it into an Android <code>.apk</code> file in 2 minutes using Microsoft's official free PWABuilder tool:
                </p>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50/80">
                <div className="font-semibold text-slate-900 text-xs">3 Simple Steps to your Android APK:</div>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1 text-[11px]">
                  <li>
                    Copy your live app URL below:
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="text"
                        readOnly
                        value={currentUrl}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] text-slate-800"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy
                      </button>
                    </div>
                  </li>
                  <li>
                    Open <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">PWABuilder.com <ExternalLink className="w-3 h-3" /></a> and paste your URL.
                  </li>
                  <li>
                    Click <strong>Package for Android</strong> and download your signed <code>.apk</code> (for direct installation or WhatsApp sharing) or <code>.aab</code> (for Google Play Store).
                  </li>
                </ol>
              </div>

              <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                💡 <strong>Clinic Advantage:</strong> You can send the downloaded APK file directly to patient WhatsApp groups in Puramufti and Prayagraj so they have THERAPIST: SAURABH PRAJAPATI's clinic icon right on their phone screen.
              </div>
            </div>
          )}

          {/* TAB 3: Desktop PC / Mac */}
          {activeTab === 'desktop' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-emerald-700" />
                  Install as Clinic Reception Desktop App
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  In Google Chrome or Microsoft Edge on Windows/Mac, look for the <strong>Install icon</strong> (computer with a down arrow) at the right end of the address bar.
                </p>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 font-mono">
                  Address bar → Click <strong>"Install Bindsukh Acupressure Center"</strong>
                </div>
                <p className="text-[11px] text-slate-500">
                  This creates a standalone desktop window for Therapist Saurabh or clinic reception staff to manage appointments, token calls, and walk-ins easily.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {CLINIC_INFO.name} • Prayagraj
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
