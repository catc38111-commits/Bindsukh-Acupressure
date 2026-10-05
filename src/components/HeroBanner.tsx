import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { CLINIC_INFO, CONDITIONS_TREATED } from '../data/clinicData';
import { GOOGLE_BUSINESS_INFO } from '../data/clinicPhotosData';
import { useClinicLogo } from '../utils/logoHelper';
import { useLanguage } from '../context/LanguageContext';
import {
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  HeartHandshake,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users
} from 'lucide-react';

interface HeroBannerProps {
  onBookNowClick: () => void;
  onViewPhotosClick?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = memo(({ onBookNowClick, onViewPhotosClick }) => {
  const clinicLogo = useClinicLogo();
  const { t, language } = useLanguage();

  return (
    <motion.div
      id="hero-banner-section"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="smooth-gpu relative overflow-hidden rounded-3xl text-white p-6 sm:p-10 shadow-2xl border border-white/20 bg-emerald-950 bg-cover bg-center"
      style={{ backgroundImage: `url('https://i.postimg.cc/qNk2g2NW/IMG-20261001-WA0048.jpg')` }}
    >
      {/* Dark overlay for rich text contrast */}
      <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-[1px] pointer-events-none" />

      {/* Liquid background refraction glows */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/40 via-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Clinic Headline and Doctor Qualifications */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-amber-300 text-xs font-bold tracking-wide border border-amber-300/30">
            <img
              src={clinicLogo}
              alt="Bindsukh Clinic Official Circular Emblem"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover shrink-0 border border-emerald-500 shadow-xs"
            />
            <span>{t('heroTagline')}</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif tracking-tight leading-tight text-white drop-shadow-sm">
              {t('heroTitle')}
            </h1>
            <p className="text-sm sm:text-base text-emerald-200/90 font-medium mt-1">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Lead Practitioner Badge with crisp, high-contrast dark liquid glass */}
          <div className="liquid-glass-dark-card rounded-2xl p-4 sm:p-6 space-y-2.5 shadow-xl border border-emerald-400/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t('leadSpecialist')}</span>
              </div>
              <span className="text-[11px] bg-emerald-800 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-600/60 shadow-xs">
                {language === 'en' ? 'Prayagraj' : 'प्रयागराज'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src="https://i.postimg.cc/5tR8Ypky/IMG-20260922-WA0016.jpg"
                  alt="THERAPIST: SAURABH PRAJAPATI"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/images/doctor-saurabh-profile.jpg') {
                      target.src = '/images/doctor-saurabh-profile.jpg';
                    } else {
                      target.src = clinicLogo;
                    }
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover object-[center_18%] border-2 border-amber-400 shadow-lg bg-emerald-950 p-0.5"
                />
                <img
                  src={clinicLogo}
                  alt="Official Logo Emblem"
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full absolute -bottom-1 -right-1 border-2 border-emerald-500 shadow-md object-cover"
                  title="Official Circular Emblem"
                />
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-wide drop-shadow-sm">
                  {language === 'hinglish' ? 'DR. SAURABH PRAJAPATI' : 'THERAPIST: SAURABH PRAJAPATI'}
                </div>
                <div className="text-xs sm:text-sm text-emerald-100 font-semibold leading-relaxed">
                  Master in Acupressure • Master Diploma in Acupuncture • Diploma in Chiropractic
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200 font-medium pt-1 leading-relaxed border-t border-emerald-800/60">
              {t('specialistBio')}
            </p>
          </div>

          {/* Key clinic credentials pills with liquid dark glass */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="liquid-glass-dark-pill rounded-2xl p-3.5 border border-emerald-400/25">
              <div className="text-amber-300 font-black text-xl tracking-tight">₹500 / ₹200</div>
              <div className="text-xs text-white font-bold mt-0.5">{t('firstVisitTitle')}</div>
              <div className="text-[11px] text-emerald-200 font-medium">{t('firstVisitRate')}</div>
            </div>
            <div className="liquid-glass-dark-pill rounded-2xl p-3.5 border border-emerald-400/25">
              <div className="text-amber-300 font-black text-xl tracking-tight">Max 5 / Slot</div>
              <div className="text-xs text-white font-bold mt-0.5">{t('dedicatedCareTitle')}</div>
              <div className="text-[11px] text-emerald-200 font-medium">{t('dedicatedCare')}</div>
            </div>
            <div className="liquid-glass-dark-pill rounded-2xl p-3.5 border border-emerald-400/25 col-span-2 sm:col-span-1">
              <div className="text-amber-300 font-black text-xl tracking-tight">100% Drugless</div>
              <div className="text-xs text-white font-bold mt-0.5">{t('druglessTitle')}</div>
              <div className="text-[11px] text-emerald-200 font-medium">{t('drugless')}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <motion.button
              id="hero-book-session-btn"
              whileTap={{ scale: 0.96 }}
              onClick={onBookNowClick}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-emerald-950 font-extrabold rounded-2xl shadow-xl shadow-amber-400/25 text-sm transition-all flex items-center gap-2 group border border-white/40 cursor-pointer"
            >
              <span>{t('bookNowBtn')}</span>
              <Sparkles className="w-4 h-4 text-emerald-950 group-hover:rotate-12 transition-transform" />
            </motion.button>

            {onViewPhotosClick && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onViewPhotosClick}
                className="px-4 py-3.5 liquid-glass-pill hover:bg-white/20 text-amber-300 rounded-2xl text-sm font-bold transition-all border border-amber-300/40 flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>{t('viewPhotosBtn')}</span>
              </motion.button>
            )}

            <motion.a
              whileTap={{ scale: 0.96 }}
              href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
              className="px-5 py-3.5 liquid-glass-pill hover:bg-white/20 text-white rounded-2xl text-sm font-semibold transition-all border border-white/30 flex items-center gap-2 shadow-sm"
            >
              <Phone className="w-4 h-4 text-amber-300" />
              <span>{t('callBtn')}</span>
            </motion.a>
          </div>
        </div>

        {/* Right Column: Conditions Treated & Location Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 text-slate-800 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
                {t('conditionsHeader')}
              </h3>
              <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                {t('reliefBadge')}
              </span>
            </div>

            {/* Conditions Tag Cloud with liquid pills */}
            <div className="flex flex-wrap gap-1.5 pt-3">
              {CONDITIONS_TREATED.map((c) => {
                const primaryText = language === 'hi' ? c.hindi : language === 'hinglish' ? c.hinglish : c.name;
                const secondaryText = language === 'hi' ? c.name : language === 'hinglish' ? c.hindi : '';
                return (
                  <span
                    key={c.name}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50/90 text-emerald-950 border border-emerald-200/80 shadow-2xs hover:bg-emerald-100/80 transition-colors"
                  >
                    {primaryText}
                    {secondaryText && (
                      <span className="text-[10px] text-emerald-700 font-normal"> ({secondaryText})</span>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Operating Hours Box */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{t('operatingHoursHeader')}</span>
              </div>
              <div className="pl-6 space-y-1 text-slate-700 font-medium">
                <div className="flex justify-between">
                  <span>{t('monSat')}</span>
                  <span className="font-bold text-slate-900">8:00 AM to 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('sunMorning')}</span>
                  <span className="font-bold text-slate-900">8:00 AM to 12:00 PM</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-start gap-2 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">{t('clinicAddressHeader')}</span>{' '}
                {CLINIC_INFO.address}
              </div>
            </div>

            {/* Google Business Profile Verified Badge */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2">
                <span className="font-black text-blue-600 bg-white px-1.5 py-0.5 rounded shadow-2xs text-[10px]">G</span>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>5.0</span>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-600">({GOOGLE_BUSINESS_INFO.reviewCount}+ Google Reviews)</span>
                  </div>
                  <div className="text-[10px] text-amber-900 font-medium">PURAMUFTI, PURANI BAZAR, Prayagraj</div>
                </div>
              </div>
              <a
                href={GOOGLE_BUSINESS_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5 shrink-0"
              >
                <span>Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
