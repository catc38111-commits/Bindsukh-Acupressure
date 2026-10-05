import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { SERVICES_OFFERED, CONDITIONS_TREATED } from '../data/clinicData';
import { useLanguage } from '../context/LanguageContext';
import {
  Activity,
  Bandage,
  CircleDot,
  Fingerprint,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface ServicesSectionProps {
  onSelectServiceToBook: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = memo(({ onSelectServiceToBook }) => {
  const { language } = useLanguage();

  const getIcon = (id: string) => {
    switch (id) {
      case 'acupressure':
        return <Fingerprint className="w-6 h-6 text-emerald-700" />;
      case 'acupuncture':
        return <Sparkles className="w-6 h-6 text-emerald-700" />;
      case 'chiropractic':
        return <Activity className="w-6 h-6 text-emerald-700" />;
      case 'cupping':
        return <CircleDot className="w-6 h-6 text-emerald-700" />;
      case 'kinesiology_tape':
        return <Bandage className="w-6 h-6 text-emerald-700" />;
      case 'massage_therapy':
        return <HeartHandshake className="w-6 h-6 text-emerald-700" />;
      default:
        return <Zap className="w-6 h-6 text-emerald-700" />;
    }
  };

  const sectionLabel = language === 'en'
    ? "Evidence-Based Holistic Therapies"
    : language === 'hi'
    ? "प्रमाणित प्राकृतिक चिकित्सा पद्धतियां"
    : "Evidence-Based Natural Therapies";

  const sectionTitle = language === 'en'
    ? "Clinical Treatments & Therapies"
    : language === 'hi'
    ? "क्लीनिकल उपचार एवं थेरेपी"
    : "Clinical Treatments aur Therapies";

  const sectionDesc = language === 'en'
    ? "Administered personally by THERAPIST: SAURABH PRAJAPATI combining meridian touch, magnetic point stimulation, and spinal realignment."
    : language === 'hi'
    ? "मुख्य चिकित्सक थेरेपिस्ट सौरभ प्रजापति द्वारा स्पर्श, मैग्नेट स्टिमुलेशन और स्पाइनल अलाइनमेंट का व्यक्तिगत संयोजन।"
    : "Therapist Saurabh Prajapati ke dwara touch, magnet stimulation aur spinal realignment ka combination.";

  const bookButtonText = language === 'en'
    ? "Book Therapy"
    : language === 'hi'
    ? "अपॉइंटमेंट लें"
    : "Book Karein";

  const ailmentsLabel = language === 'en'
    ? "Ailments & Conditions"
    : language === 'hi'
    ? "बीमारियां एवं शारीरिक दर्द"
    : "Ailments aur Conditions";

  const ailmentsTitle = language === 'en'
    ? "Comprehensive Healing Protocols"
    : language === 'hi'
    ? "विशिष्ट प्राकृतिक उपचार पद्धति"
    : "Complete Healing Protocols";

  const ailmentsDesc = language === 'en'
    ? "Clinical acupressure and acupuncture address root organ meridians to stimulate the nervous system and body's innate healing mechanism."
    : language === 'hi'
    ? "क्लीनिकल एक्यूप्रेशर एवं एक्यूपंक्चर मुख्य अंगों के ऊर्जा संचरण मार्ग को ठीक कर नसों और शरीर की प्राकृतिक हीलिंग को सक्रिय करता है।"
    : "Acupressure aur acupuncture se nerves activate hote hain jo body ki self-healing power badhate hain.";

  return (
    <motion.div
      id="services-section-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-10 smooth-gpu"
    >
      {/* Services Heading */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
          {sectionLabel}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-emerald-950">
          {sectionTitle}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {sectionDesc}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICES_OFFERED.map((svc, idx) => {
          const serviceTitle = language === 'hi' ? svc.hindi : svc.name;
          const serviceDesc = language === 'hi'
            ? `${svc.description} (बिना दवा का सुरक्षित इलाज)`
            : svc.description;

          return (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.04, ease: 'easeOut' }}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all hover:border-emerald-300 flex flex-col justify-between group smooth-gpu"
            >
              {/* Visual Clinical Photo Header */}
              {'imageUrl' in svc && svc.imageUrl && (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  <img
                    src={svc.imageUrl as string}
                    alt={serviceTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-75" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    {language !== 'en' && (
                      <span className="text-[11px] font-bold bg-emerald-950/85 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-white/20">
                        {svc.hindi}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-amber-300 bg-black/40 px-2 py-0.5 rounded-md">
                      100% Drugless
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      {getIcon(svc.id)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{serviceTitle}</h3>
                      {language !== 'en' && language !== 'hi' && (
                        <span className="text-xs font-semibold text-emerald-800">{svc.hindi}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{serviceDesc}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    ₹500 <span className="text-slate-400 font-normal">/</span> ₹200
                  </span>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onSelectServiceToBook(svc.name)}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    {bookButtonText}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Conditions Treated Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 rounded-3xl p-6 sm:p-10 text-white space-y-6 smooth-gpu"
      >
        <div className="max-w-xl space-y-2">
          <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/30">
            {ailmentsLabel}
          </span>
          <h3 className="text-2xl font-bold font-serif">{ailmentsTitle}</h3>
          <p className="text-xs text-emerald-200">
            {ailmentsDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {CONDITIONS_TREATED.map((c) => {
            const primaryTitle = language === 'hi' ? c.hindi : language === 'hinglish' ? c.hinglish : c.name;
            const subtitle = language === 'hi' ? c.name : language === 'hinglish' ? c.hindi : '';
            return (
              <div
                key={c.name}
                className="bg-emerald-900/60 border border-emerald-700/50 rounded-2xl p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white leading-tight">{primaryTitle}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 shrink-0 ml-2">
                    {c.severity} Priority
                  </span>
                </div>
                {subtitle && <div className="text-xs text-emerald-300 font-semibold">{subtitle}</div>}
                <div className="text-[11px] text-emerald-200/80 pt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {language === 'hi'
                    ? 'मैग्नेट एवं स्पर्श बिंदु उपचार प्रोटोकॉल'
                    : language === 'hinglish'
                    ? 'Magnet & Touch Point Se Natural Recovery'
                    : 'Magnet & touch point recovery protocol'}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
});
