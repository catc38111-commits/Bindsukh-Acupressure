import React, { useState } from 'react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import {
  Rocket,
  ShieldCheck,
  Globe,
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  X,
  ExternalLink,
  Lock,
  MessageSquare,
  Server,
  Download,
  Github
} from 'lucide-react';
import { CLINIC_INFO } from '../data/clinicData';

interface OwnershipDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnershipDeployModal: React.FC<OwnershipDeployModalProps> = ({ isOpen, onClose }) => {
  useLockBodyScroll(isOpen);
  const [activeSection, setActiveSection] = useState<'ownership' | 'publishing' | 'messaging' | 'custom_domain'>('ownership');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-emerald-900/10 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-400/30">
              <Rocket className="w-3.5 h-3.5" />
              Production Deployment & Ownership Guide
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif mt-2">
            How to Own & Publish Bindsukh Center Live
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            Step-by-step instructions for THERAPIST: SAURABH PRAJAPATI to take full ownership, connect custom domains, and launch to patients.
          </p>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-emerald-800/60">
            <button
              onClick={() => setActiveSection('ownership')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSection === 'ownership'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              1. Take Ownership
            </button>

            <button
              onClick={() => setActiveSection('publishing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSection === 'publishing'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              2. Publish / Deploy Live
            </button>

            <button
              onClick={() => setActiveSection('messaging')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSection === 'messaging'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              3. WhatsApp & 24h Reminders
            </button>

            <button
              onClick={() => setActiveSection('custom_domain')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSection === 'custom_domain'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              4. Custom Clinic Domain
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Section 1: Take Ownership */}
          {activeSection === 'ownership' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Claiming Complete Control of Your Source Code
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  You have full rights and intellectual ownership over this application. You can download the source files or connect your personal GitHub account.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Option A: Export to Your GitHub Account</h4>
                      <p className="text-[11px] text-slate-500">
                        In AI Studio, click the three-dots menu or <strong>Share &gt; Export to GitHub</strong>. This creates a private repository in your GitHub account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Option B: Download ZIP to Your Computer</h4>
                      <p className="text-[11px] text-slate-500">
                        Select <strong>Download ZIP</strong> from the AI Studio menu. Unzip it on your local computer or clinic laptop.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Local Development Commands:</h4>
                  <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs flex items-center justify-between">
                    <code>npm install && npm run dev</code>
                    <button
                      onClick={() => copyToClipboard('npm install && npm run dev', 'cmd1')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    The app boots on <code>http://localhost:3000</code> with full API routes, slot management, and automated reminders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Publishing Live */}
          {activeSection === 'publishing' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-amber-700" />
                  Publishing Your Application Live to Patients
                </h3>
                <p className="text-xs text-amber-800 mt-1">
                  Here are the fastest, most reliable ways to make your Bindsukh Center booking portal live on the web 24/7.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-emerald-300 bg-emerald-50/40 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                    Recommended (1-Click)
                  </span>
                  <h4 className="text-xs font-bold text-emerald-950">Google Cloud Run (Direct)</h4>
                  <p className="text-[11px] text-slate-600">
                    In Google AI Studio, click <strong>Deploy &gt; Cloud Run</strong>. The platform will automatically compile your frontend and start your Node.js server in a fast Google container.
                  </p>
                  <ul className="text-[11px] text-slate-600 list-disc pl-4 space-y-0.5">
                    <li>Free tier handles thousands of clinic bookings.</li>
                    <li>Always online with automated HTTPS security.</li>
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Alternative
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">Render / Railway / VPS</h4>
                  <p className="text-[11px] text-slate-600">
                    Import your GitHub repo into Render or Railway. Set:
                  </p>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                    <div><strong>Build Command:</strong> npm run build</div>
                    <div><strong>Start Command:</strong> npm start</div>
                    <div><strong>Port:</strong> 3000</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-700" />
                  Database Persistence for Production
                </h4>
                <p className="text-xs text-slate-600">
                  Currently, appointments are stored in <code>/data/appointments.json</code> on disk. For long-term production with high volume, you can easily connect <strong>Firebase Firestore</strong> or <strong>PostgreSQL</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Section 3: WhatsApp & 24h Reminders */}
          {activeSection === 'messaging' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  24-Hour Automated WhatsApp & SMS Reminders
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  The appointment reminder engine runs automatically in the background every 30 seconds to send notifications 24 hours prior to appointment slots.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900">How Reminders Work in this App:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-900">1. Automatic Schedule</div>
                    <p className="text-slate-600 text-[11px]">
                      When booked, scheduled exactly 24 hours before the patient's selected 1-hour slot starts.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-900">2. Dispatched Message</div>
                    <p className="text-slate-600 text-[11px]">
                      Includes patient name, token number, therapy, date, time slot, and clinic address in Puramufti.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-900">3. 1-Click Confirmation</div>
                    <p className="text-slate-600 text-[11px]">
                      Patient replies "CONFIRM" or taps their unique link (<code>/confirm/:token</code>) to verify attendance instantly.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block">Connecting a Live WhatsApp Gateway (e.g. Gupshup / Twilio):</span>
                  <p className="text-slate-600">
                    To send directly to Indian WhatsApp numbers (+91 9455100097) without manual interaction, register with a Meta WhatsApp Business BSP (such as Gupshup, Aisensy, or Twilio) and configure their webhook URL to point to:
                  </p>
                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px]">
                    POST https://your-domain.com/api/incoming-reply
                  </div>
                  <p className="text-[11px] text-slate-500">
                    When a patient replies "CONFIRM" or "YES", the webhook immediately updates attendance to "Confirmed" in Therapist Saurabh's roster!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Custom Domain */}
          {activeSection === 'custom_domain' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-700" />
                  Connecting a Custom Clinic Domain (e.g. bindsukhcenter.com)
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Give patients a memorable, trusted web address printed on clinic banners, visiting cards, and prescriptions.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">Step 1: Purchase Domain</div>
                  <p className="text-slate-600">
                    Buy a domain like <code>bindsukhclinic.in</code> or <code>bindsukhacupuncture.com</code> from GoDaddy, Namecheap, or Hostinger (~₹499/year).
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">Step 2: Add DNS Records</div>
                  <p className="text-slate-600">
                    In your domain registrar's DNS Management, add a CNAME record:
                  </p>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[11px]">
                    Type: CNAME | Host: @ or www | Target: your-cloud-run-service.run.app
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">Step 3: SSL Certificate</div>
                  <p className="text-slate-600">
                    Cloud Run and modern cloud providers issue an SSL certificate (HTTPS padlock) automatically within 15 minutes of DNS verification.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Clinic Contact: <strong>THERAPIST: SAURABH PRAJAPATI</strong> (+91 9455100097)
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
