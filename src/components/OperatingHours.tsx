import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, Phone, MapPin, Sparkles } from 'lucide-react';
import { CLINIC_INFO, WEEKDAY_SLOTS, SUNDAY_SLOTS } from '../data/clinicData';
import { useLanguage } from '../context/LanguageContext';

interface OperatingHoursProps {
  onBookClick?: () => void;
  className?: string;
}

export const OperatingHours: React.FC<OperatingHoursProps> = memo(({ onBookClick, className = '' }) => {
  const { language } = useLanguage();

  const title =
    language === 'hi'
      ? 'क्लिनिक परामर्श समय व स्लॉट'
      : language === 'hinglish'
      ? 'Clinic Consultation Timings & Slots'
      : 'Clinic Consultation Timings & Slots';

  const subtitle =
    language === 'hi'
      ? 'प्रत्येक 1-घंटे के स्लॉट में अधिकतम 5 मरीज – व्यक्तिगत परामर्श व थेरेपी'
      : language === 'hinglish'
      ? 'Max 5 patients per 1-hour slot – Personalized diagnosis & magnet therapy'
      : 'Max 5 patients per 1-hour slot – Individualized diagnosis & magnet therapy';

  const monSatLabel =
    language === 'hi'
      ? 'सोमवार से शनिवार (Monday - Saturday)'
      : language === 'hinglish'
      ? 'Monday se Saturday (Weekday Sessions)'
      : 'Monday to Saturday (Standard Clinic Sessions)';

  const monSatTiming =
    language === 'hi'
      ? 'सुबह 8:30 AM से दोपहर 4:00 PM'
      : language === 'hinglish'
      ? '8:30 AM to 4:00 PM'
      : '8:30 AM to 4:00 PM';

  const sunLabel =
    language === 'hi'
      ? 'रविवार विशेष सत्र (Sunday Morning)'
      : language === 'hinglish'
      ? 'Sunday Morning Special Session'
      : 'Sunday Morning Special Session';

  const sunTiming =
    language === 'hi'
      ? 'सुबह 8:00 AM से दोपहर 12:00 PM'
      : language === 'hinglish'
      ? '8:00 AM to 12:00 PM'
      : '8:00 AM to 12:00 PM';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-800/60 shadow-xl overflow-hidden relative smooth-gpu ${className}`}
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100/50 dark:bg-emerald-950/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-100/50 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 space-y-6">
        {/* Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Official Operating Schedule</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-serif text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {subtitle}
            </p>
          </div>

          {onBookClick && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onBookClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md shrink-0 cursor-pointer transition-all"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>{language === 'hi' ? 'स्लॉट बुक करें' : 'Book 1-Hour Slot'}</span>
            </motion.button>
          )}
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Monday to Saturday Card */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                {monSatLabel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                Active 6 Days
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                {monSatTiming}
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
              <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block mb-2">
                Available 1-Hour Hourly Slots ({WEEKDAY_SLOTS.length} Slots Daily):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {WEEKDAY_SLOTS.map((slot) => (
                  <div
                    key={slot}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900 text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span className="font-mono">{slot}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Sunday Morning Session Card */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-800/50 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 dark:text-amber-300 uppercase tracking-wider">
                  {sunLabel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-emerald-950 text-[10px] font-black">
                  Morning Only
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {sunTiming}
                </span>
              </div>

              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60">
                <span className="text-[11px] font-bold text-amber-950 dark:text-amber-300 block mb-2">
                  Sunday Morning 1-Hour Slots ({SUNDAY_SLOTS.length} Slots):
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SUNDAY_SLOTS.map((slot) => (
                    <div
                      key={slot}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900 text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between"
                    >
                      <span className="font-mono">{slot}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Capacity & Doctor Verification Guarantee */}
            <div className="mt-4 p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300/80 text-[11px] text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Strict Max 5 Patients:</strong> Walk-ins are prioritized by digital token number.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Contact & Location Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{CLINIC_INFO.address}</span>
          </div>

          <a
            href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 hover:underline"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Direct Call: {CLINIC_INFO.phones[0]}</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
});
