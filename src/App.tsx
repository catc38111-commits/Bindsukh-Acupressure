import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { BookingForm } from './components/BookingForm';
import { PatientDashboard } from './components/PatientDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ServicesSection } from './components/ServicesSection';
import { DoctorProfile } from './components/DoctorProfile';
import { AppointmentReceiptModal } from './components/AppointmentReceiptModal';
import { InstallAppModal } from './components/InstallAppModal';
import { PublicShareModal } from './components/PublicShareModal';
import { HelpAndShareModal } from './components/HelpAndShareModal';
import { ClinicOfficeGallery } from './components/ClinicOfficeGallery';
import { PhoneCompatibilityModal } from './components/PhoneCompatibilityModal';
import { QuickRegisterModal } from './components/QuickRegisterModal';
import { FeedbackModal } from './components/FeedbackModal';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { GoogleMapsSection } from './components/GoogleMapsSection';
import { AiCareAssistantModal } from './components/AiCareAssistantModal';
import { PatientAppointment } from './types';
import { CLINIC_INFO } from './data/clinicData';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Lock,
  Phone,
  Sparkles,
  Stethoscope,
  X,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Globe,
  Share2,
  Download,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'booking' | 'photos' | 'dashboard' | 'services' | 'doctor' | 'admin'>('booking');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('bindsukh_doctor_auth');
      if (stored) {
        const auth = JSON.parse(stored);
        if (auth && auth.isLogged) {
          return true;
        }
      }
    } catch (e) {
      console.error('Error reading doctor auth from storage:', e);
    }
    return false;
  });
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [pinError, setPinError] = useState('');

  // Selected appointment for digital receipt / slip viewing
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<PatientAppointment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Ownership, PWA Install & Public Share Modals
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [showHelpShareModal, setShowHelpShareModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isPublicPublished, setIsPublicPublished] = useState<boolean | null>(null);
  const [dismissNotice, setDismissNotice] = useState(false);

  useEffect(() => {
    fetch('/api/check-public-status')
      .then(res => res.json())
      .then(data => setIsPublicPublished(Boolean(data.isPublished)))
      .catch(() => setIsPublicPublished(null));
  }, []);

  // Phone to prefill in patient dashboard when navigated from booking
  const [dashboardLookupPhone, setDashboardLookupPhone] = useState('');

  const handleAdminToggle = () => {
    if (isAdminUnlocked) {
      // Toggle into admin tab or back to booking
      if (activeTab === 'admin') {
        setActiveTab('booking');
      } else {
        setActiveTab('admin');
      }
    } else {
      setShowAdminPinModal(true);
      setPinError('');
      setAdminPinInput('');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === '19472026') {
      setIsAdminUnlocked(true);
      try {
        localStorage.setItem('bindsukh_doctor_auth', JSON.stringify({ isLogged: true, loginTime: Date.now() }));
      } catch (err) {
        console.error('Error writing doctor login status to storage:', err);
      }
      setShowAdminPinModal(false);
      setActiveTab('admin');
      setPinError('');
    } else {
      setPinError('गलत पासवर्ड! केवल अधिकृत डॉ. सौरभ व क्लिनिक एडमिन ही लॉगिन कर सकते हैं।');
    }
  };

  const handleLogout = () => {
    setIsAdminUnlocked(false);
    try {
      localStorage.removeItem('bindsukh_doctor_auth');
    } catch (err) {
      console.error('Error removing doctor login status from storage:', err);
    }
    setActiveTab('booking');
  };

  const handleAppointmentCreated = (appointment: PatientAppointment) => {
    setSelectedReceiptApt(appointment);
    setIsReceiptModalOpen(true);
    setDashboardLookupPhone(appointment.patientPhone);
    try {
      localStorage.setItem('bindsukh_active_booking', JSON.stringify(appointment));
    } catch (err) {
      console.error('Error writing active booking to storage:', err);
    }
  };

  const handleSelectReceipt = (appointment: PatientAppointment) => {
    setSelectedReceiptApt(appointment);
    setIsReceiptModalOpen(true);
  };

  const handleSelectServiceToBook = (_serviceName: string) => {
    setActiveTab('booking');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f3f7f5] flex flex-col selection:bg-emerald-200 selection:text-emerald-950 font-sans relative w-full max-w-full overflow-x-hidden">
      {/* Liquid glass ambient background glow orbs - GPU safe for iOS WebKit */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.14)_0%,transparent_70%)]" />
        <div className="absolute top-[25%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.12)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.12)_0%,transparent_70%)]" />
      </div>

      {/* Sticky Header with YouTube-style top bar and filter chips */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminUnlocked={isAdminUnlocked}
        onAdminToggle={handleAdminToggle}
        onOpenInstallModal={() => setShowInstallModal(true)}
        onOpenPublicModal={() => setShowPublicModal(true)}
        onOpenPhoneModal={() => setShowPhoneModal(true)}
        onOpenRegisterModal={() => setShowRegisterModal(true)}
        onOpenFeedbackModal={() => setShowFeedbackModal(true)}
        onOpenHelpShareModal={() => setShowHelpShareModal(true)}
      />

      {/* Main Content Area with bottom safe padding for fixed bottom bar */}
      <main className="relative z-10 flex-1 max-w-7xl w-full max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-8 pb-28 sm:pb-32 overflow-x-hidden">
        {/* Navigation Tab Content */}
        {activeTab === 'booking' && (
          <div className="space-y-8 tab-fade-in">
            {/* Hero Banner */}
            <HeroBanner
              onBookNowClick={() => {
                const el = document.getElementById('booking-form-wrapper');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onViewPhotosClick={() => setActiveTab('photos')}
            />

            {/* Booking Form with Multi-Patient Slot Capacity */}
            <BookingForm onAppointmentCreated={handleAppointmentCreated} />

            {/* Real Clinic Office & Treatment Rooms Photo Showcase for Easy Visibility */}
            <ClinicOfficeGallery
              onBookClick={() => {
                const el = document.getElementById('booking-form-wrapper');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Quick Preview of Therapies & Conditions */}
            <ServicesSection onSelectServiceToBook={handleSelectServiceToBook} />

            {/* Google Maps Clinic Location & Directions */}
            <GoogleMapsSection />
          </div>
        )}

        {/* Dedicated Clinic Photos Tab */}
        {activeTab === 'photos' && (
          <div className="tab-fade-in">
            <ClinicOfficeGallery
              onBookClick={() => {
                setActiveTab('booking');
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="tab-fade-in">
            <PatientDashboard
              initialPhone={dashboardLookupPhone}
              onSelectReceipt={handleSelectReceipt}
            />
          </div>
        )}

        {activeTab === 'services' && (
          <div className="tab-fade-in">
            <ServicesSection onSelectServiceToBook={handleSelectServiceToBook} />
          </div>
        )}

        {activeTab === 'doctor' && (
          <div className="tab-fade-in">
            <DoctorProfile
              onBookClick={() => {
                setActiveTab('booking');
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              isAdminUnlocked={isAdminUnlocked}
              onAdminToggle={handleAdminToggle}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="tab-fade-in">
            <AdminPanel onSelectReceipt={handleSelectReceipt} onLogout={handleLogout} />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavClick={(tab) => {
          if (tab === 'admin' && !isAdminUnlocked) {
            setShowAdminPinModal(true);
          } else {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenInstallModal={() => setShowInstallModal(true)}
        onOpenPublicModal={() => setShowPublicModal(true)}
        onOpenPhoneModal={() => setShowPhoneModal(true)}
        onOpenHelpShareModal={() => setShowHelpShareModal(true)}
      />

      {/* Appointment Digital Slip Modal */}
      <AppointmentReceiptModal
        appointment={selectedReceiptApt}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* PWA Convert & Install App Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Public Live Link & QR Code Modal */}
      <PublicShareModal
        isOpen={showPublicModal}
        onClose={() => setShowPublicModal(false)}
        onOpenPhoneGuide={() => setShowPhoneModal(true)}
      />

      {/* Help & Direct WhatsApp Share Modal */}
      <HelpAndShareModal
        isOpen={showHelpShareModal}
        onClose={() => setShowHelpShareModal(false)}
        onOpenEditUrl={() => {
          setShowHelpShareModal(false);
          setShowPublicModal(true);
        }}
      />

      {/* Phone Compatibility & Safari Cookie Fix Modal */}
      <PhoneCompatibilityModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onOpenPublicModal={() => setShowPublicModal(true)}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Quick 1-Click Patient Registration Modal */}
      <QuickRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegistered={(apt) => {
          handleAppointmentCreated(apt);
        }}
      />

      {/* Admin PIN Unlock Modal with Liquid Glass Card */}
      {showAdminPinModal && (
        <div id="admin-pin-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white/80 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-emerald-950 flex items-center justify-center shadow-xs border border-amber-400">
                <Lock className="w-5 h-5 text-emerald-950 stroke-[2.5]" />
              </div>
              <button
                onClick={() => setShowAdminPinModal(false)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                Doctor / Admin Security Portal
              </span>
              <h3 className="text-lg font-black font-serif text-slate-900 mt-1">
                डॉक्टर / एडमिन लॉगिन
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                क्लिनिक रिकॉर्ड्स, टोकन, मरीज सूची और पर्चा प्रबंधन के लिए अधिकृत डॉक्टर सुरक्षा पासवर्ड दर्ज करें।
              </p>
            </div>

            {pinError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-2xl font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    डॉक्टर सुरक्षा पासवर्ड (Security Password)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> केवल अधिकृत एक्सेस
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-pin-input"
                    type={showPinText ? 'text' : 'password'}
                    maxLength={24}
                    placeholder="सुरक्षा पासवर्ड दर्ज करें..."
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    title={showPinText ? 'Hide Password' : 'Show Password'}
                  >
                    {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>सुरक्षा कारणों से पासवर्ड केवल डॉ. सौरभ एवं अधिकृत व्यवस्थापक के पास है।</span>
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-750 hover:to-emerald-850 active:scale-95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>पासवर्ड सत्यापित करें व कंसोल खोलें</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPinModal(false);
                    setActiveTab('doctor');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  डॉ. सौरभ की प्रोफ़ाइल देखें (View Public Bio)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YouTube Style Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminUnlocked={isAdminUnlocked}
        onAdminToggle={handleAdminToggle}
        onOpenFeedback={() => setShowFeedbackModal(true)}
      />

      {/* Patient Feedback & Review Modal (YouTube-style Action Sheet) */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onNavigateToBooking={() => {
          setActiveTab('booking');
          const el = document.getElementById('booking-form-wrapper');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 350, behavior: 'smooth' });
          }
        }}
      />

      {/* Floating Gemini AI Care Assistant Chatbot with Voice Interaction */}
      <AiCareAssistantModal
        onNavigateToBooking={() => {
          setActiveTab('booking');
          const el = document.getElementById('booking-form-wrapper');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 350, behavior: 'smooth' });
          }
        }}
        onNavigateToMaps={() => {
          setActiveTab('booking');
          const el = document.getElementById('google-maps-location-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
}
