import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Home,
  Building2,
  Plus,
  FileText,
  User,
  Stethoscope,
  Sparkles,
  MessageSquarePlus
} from 'lucide-react';

interface BottomNavProps {
  activeTab: 'booking' | 'photos' | 'dashboard' | 'services' | 'doctor' | 'admin';
  setActiveTab: (tab: 'booking' | 'photos' | 'dashboard' | 'services' | 'doctor' | 'admin') => void;
  isAdminUnlocked: boolean;
  onAdminToggle: () => void;
  onOpenFeedback: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  isAdminUnlocked,
  onAdminToggle,
  onOpenFeedback
}) => {
  const { t, language } = useLanguage();

  return (
    <div
      id="youtube-bottom-nav"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all select-none no-print"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center">
        {/* 1. Home / Book Appointment */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('booking');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center w-full py-1 text-center transition-all group focus:outline-none ${
            activeTab === 'booking'
              ? 'text-emerald-900 dark:text-emerald-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <Home
              className={`w-5 h-5 transition-transform group-active:scale-90 ${
                activeTab === 'booking' ? 'text-emerald-800 dark:text-emerald-400 stroke-[2.5]' : 'text-slate-600 dark:text-slate-400'
              }`}
            />
            {activeTab === 'booking' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-800 dark:bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            {language === 'en' ? 'Home' : language === 'hinglish' ? 'Home' : 'होम (Home)'}
          </span>
        </button>

        {/* 2. Photos / Clinic Gallery */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('photos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center w-full py-1 text-center transition-all group focus:outline-none ${
            activeTab === 'photos'
              ? 'text-emerald-900 dark:text-emerald-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <Building2
              className={`w-5 h-5 transition-transform group-active:scale-90 ${
                activeTab === 'photos' ? 'text-emerald-800 dark:text-emerald-400 stroke-[2.5]' : 'text-slate-600 dark:text-slate-400'
              }`}
            />
            {activeTab === 'photos' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-800 dark:bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            {language === 'en' ? 'Photos' : language === 'hinglish' ? 'Photos' : 'फोटो (Photos)'}
          </span>
        </button>

        {/* 3. CENTER BUTTON: The iconic YouTube (+) Plus Button with "Feedback" label */}
        <button
          type="button"
          onClick={onOpenFeedback}
          className="flex flex-col items-center justify-center w-full -mt-3.5 focus:outline-none group cursor-pointer"
          title="Give Patient Feedback / मरीज समीक्षा"
        >
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-950 via-emerald-800 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 border-2 border-white dark:border-slate-800 group-hover:scale-105 group-active:scale-95 transition-all">
            {/* YouTube Plus Icon */}
            <Plus className="w-6 h-6 text-amber-300 stroke-[2.8]" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white dark:border-slate-800 animate-pulse" />
          </div>
          <span className="text-[10px] mt-1 font-black text-emerald-950 dark:text-amber-300 group-hover:text-emerald-800 dark:group-hover:text-amber-200 tracking-tight leading-none">
            {language === 'hi' ? 'फीडबैक' : language === 'hinglish' ? '+ Feedback' : 'Feedback'}
          </span>
        </button>

        {/* 4. My Slip / Patient Dashboard */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center w-full py-1 text-center transition-all group focus:outline-none ${
            activeTab === 'dashboard'
              ? 'text-emerald-900 dark:text-emerald-400 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <FileText
              className={`w-5 h-5 transition-transform group-active:scale-90 ${
                activeTab === 'dashboard' ? 'text-emerald-800 dark:text-emerald-400 stroke-[2.5]' : 'text-slate-600 dark:text-slate-400'
              }`}
            />
            {activeTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-800 dark:bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            {language === 'en' ? 'My Slip' : language === 'hinglish' ? 'Parcha' : 'पर्चा (Slip)'}
          </span>
        </button>

        {/* 5. Doctor Admin Login / Console */}
        <button
          id="bottom-nav-doctor-login"
          type="button"
          onClick={() => {
            if (isAdminUnlocked) {
              setActiveTab('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              onAdminToggle();
            }
          }}
          className={`flex flex-col items-center justify-center w-full py-1 text-center transition-all group focus:outline-none ${
            activeTab === 'admin'
              ? 'text-emerald-900 dark:text-emerald-400 font-extrabold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
          title={isAdminUnlocked ? 'Open Doctor Admin Console' : 'Doctor Security Login (डॉक्टर लॉगिन)'}
        >
          <div className="relative">
            {isAdminUnlocked ? (
              <Stethoscope
                className={`w-5 h-5 transition-transform group-active:scale-90 ${
                  activeTab === 'admin' ? 'text-amber-600 dark:text-amber-400 stroke-[2.5]' : 'text-emerald-800 dark:text-emerald-400'
                }`}
              />
            ) : (
              <div className="relative">
                <User
                  className="w-5 h-5 text-slate-700 dark:text-slate-300 transition-transform group-active:scale-90"
                />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-800 flex items-center justify-center text-[7px] text-emerald-950 font-black">
                  🔒
                </span>
              </div>
            )}
            {activeTab === 'admin' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-800 dark:bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none font-bold">
            {isAdminUnlocked
              ? (language === 'en' ? 'Console' : language === 'hinglish' ? 'Console' : 'कंसोल (Admin)')
              : (language === 'en' ? 'Doctor Login' : language === 'hinglish' ? 'Doctor Login' : 'डॉक्टर लॉगिन')}
          </span>
        </button>
      </div>
    </div>
  );
};
