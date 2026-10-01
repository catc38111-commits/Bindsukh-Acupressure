import React from 'react';
import { CLINIC_INFO } from '../data/clinicData';
import { useClinicLogo } from '../utils/logoHelper';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Building2,
  Calendar,
  Clock,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Stethoscope,
  UserCheck,
  Smartphone,
  Globe,
  UserPlus,
  Share2,
  Search,
  CheckCircle2,
  Star,
  QrCode,
  Download
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'booking' | 'photos' | 'dashboard' | 'services' | 'doctor' | 'admin';
  setActiveTab: (tab: 'booking' | 'photos' | 'dashboard' | 'services' | 'doctor' | 'admin') => void;
  isAdminUnlocked: boolean;
  onAdminToggle: () => void;
  onOpenInstallModal?: () => void;
  onOpenPublicModal?: () => void;
  onOpenPhoneModal?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenFeedbackModal?: () => void;
  onOpenHelpShareModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdminUnlocked,
  onAdminToggle,
  onOpenInstallModal,
  onOpenPublicModal,
  onOpenPhoneModal,
  onOpenRegisterModal,
  onOpenFeedbackModal,
  onOpenHelpShareModal
}) => {
  const clinicLogo = useClinicLogo();
  const { t, language } = useLanguage();

  const registerBookText = language === 'en'
    ? "Register / Book"
    : language === 'hi'
    ? "रजिस्टर / बुक"
    : "Register / Book Karein";

  const callNowText = language === 'en'
    ? "Call Now"
    : language === 'hi'
    ? "कॉल करें"
    : "Call Now";

  return (
    <header className="w-full max-w-full bg-white shadow-sm border-b sticky top-0 z-50 no-print">
      {/* 1. TOP ROW: Main Sticky Header */}
      <div className="w-full px-3 py-2 flex items-center justify-between bg-white border-b gap-2">
        {/* Left Branding */}
        <button
          onClick={() => {
            setActiveTab('booking');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-1.5 text-left focus:outline-none group min-w-0 cursor-pointer"
        >
          <div className="relative shrink-0">
            <img
              src="https://i.postimg.cc/RF5zbscT/IMG-20260922-144104-(1).jpg"
              alt="Bindsukh Official Circular Logo"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-emerald-500 shadow-sm shrink-0"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-600 rounded-full border border-white flex items-center justify-center text-[5px] text-white font-bold">
              ✓
            </span>
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight shrink-0">
            Bindsukh
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-medium hidden xs:inline shrink-0">
            Acupressure
          </span>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSwitcher />
          
          <button
            id="admin-toggle-btn"
            type="button"
            onClick={onAdminToggle}
            className={`p-1.5 rounded-full text-white flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-emerald-700 ring-2 ring-emerald-500'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
            title={isAdminUnlocked ? 'Doctor Admin Console' : 'Doctor Security Login'}
          >
            {isAdminUnlocked ? (
              <Stethoscope className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 2. SECOND ROW: Quick Action Bar (Horizontally Scrollable) */}
      <div 
        className="overflow-x-auto whitespace-nowrap px-2 py-1.5 bg-emerald-900 text-white flex items-center gap-2 no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Quick Register / Book */}
        {onOpenRegisterModal && (
          <button
            onClick={onOpenRegisterModal}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold shadow-sm cursor-pointer shrink-0 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{registerBookText}</span>
          </button>
        )}

        {/* WhatsApp Chat */}
        <a
          href={`https://wa.me/${CLINIC_INFO.whatsapp}?text=${encodeURIComponent(
            'नमस्ते डॉ. सौरभ प्रजापति जी, मुझे बिन्दसुख क्लिनिक में अपॉइंटमेंट व उपचार की जानकारी चाहिए।'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-500 shadow-sm cursor-pointer shrink-0 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-emerald-100/20" />
          <span>WhatsApp Chat</span>
        </a>

        {/* Direct Call */}
        <a
          href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold border border-blue-500 shadow-sm cursor-pointer shrink-0 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{callNowText}</span>
        </a>

        {/* QR Code */}
        {onOpenPublicModal && (
          <button
            onClick={onOpenPublicModal}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold border border-purple-500 shadow-sm cursor-pointer shrink-0 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
        )}
      </div>

      {/* 2. Category Filter Tabs (Horizontal Scroll Bar with touch swipe support) */}
      <div
        className="w-full overflow-x-auto whitespace-nowrap flex items-center gap-2 px-2 py-2 bg-slate-50 border-b no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Chip 1: सभी (All Overview / Home) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('booking');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all cursor-pointer ${
            activeTab === 'booking'
              ? 'bg-emerald-900 text-white font-bold shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          {t('all')}
        </button>

        {/* Chip 2: अपॉइंटमेंट बुक (Book Slot) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('booking');
            const el = document.getElementById('booking-form-wrapper');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{t('bookSlot')}</span>
        </button>

        {/* Chip 3: क्लिनिक फोटो (Photos) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('photos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all cursor-pointer ${
            activeTab === 'photos'
              ? 'bg-emerald-900 text-white font-bold shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{t('photos')}</span>
        </button>

        {/* Chip 4: फीडबैक व समीक्षा (Feedback) */}
        {onOpenFeedbackModal && (
          <button
            type="button"
            onClick={onOpenFeedbackModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
            <span>{t('feedback')}</span>
          </button>
        )}

        {/* Chip 5: मेरी रसीद / पर्चा (My Slip) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-emerald-900 text-white font-bold shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{t('slip')}</span>
        </button>

        {/* Chip 6: थैरेपी व उपचार (Therapies) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('services');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all cursor-pointer ${
            activeTab === 'services'
              ? 'bg-emerald-900 text-white font-bold shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{t('therapies')}</span>
        </button>

        {/* Chip 7: थेरेपिस्ट सौरभ (Doctor) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('doctor');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all cursor-pointer ${
            activeTab === 'doctor'
              ? 'bg-emerald-900 text-white font-bold shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          <img
            src="https://i.postimg.cc/5tR8Ypky/IMG-20260922-WA0016.jpg"
            alt="THERAPIST: SAURABH PRAJAPATI"
            referrerPolicy="no-referrer"
            className="w-4 h-4 rounded-full object-cover object-[center_18%] border border-amber-400 shrink-0"
          />
          <span>{t('doctor')}</span>
        </button>

        {/* Chip 8: क्लिनिक नक्शा व रास्ता (Google Maps) */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('google-maps-location-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.open('https://www.google.com/maps/dir/?api=1&destination=25.5028,81.6756', '_blank');
            }
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{t('maps')}</span>
        </button>

        {/* Chip 9: ऐप इंस्टॉल (Install App) */}
        {onOpenInstallModal && (
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{t('directInstall')}</span>
          </button>
        )}

        {/* Chip 10: डॉक्टर लॉगिन / कंसोल (Admin) */}
        <button
          type="button"
          onClick={onAdminToggle}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all cursor-pointer font-bold ${
            activeTab === 'admin'
              ? 'bg-amber-400 text-emerald-950 shadow-xs border border-amber-500'
              : isAdminUnlocked
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80'
          }`}
        >
          {isAdminUnlocked ? (
            <>
              <Stethoscope className="w-3.5 h-3.5 text-emerald-900 shrink-0" />
              <span>{t('console')}</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{t('admin')}</span>
            </>
          )}
        </button>

        {/* Chip 11: फोन समाधान (Phone Help) */}
        {onOpenPhoneModal && (
          <button
            type="button"
            onClick={onOpenPhoneModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{t('phoneHelp')}</span>
          </button>
        )}

        {/* Chip 12: सहायता व शेयर (Help & Share) */}
        {onOpenHelpShareModal && (
          <button
            type="button"
            onClick={onOpenHelpShareModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{t('helpShare')}</span>
          </button>
        )}
      </div>
    </header>
  );
};
