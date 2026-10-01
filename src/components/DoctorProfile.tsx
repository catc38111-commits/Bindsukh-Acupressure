import React, { useState } from 'react';
import { CLINIC_INFO } from '../data/clinicData';
import { ClinicOfficeGallery } from './ClinicOfficeGallery';
import { CLINIC_PHOTOS } from '../data/clinicPhotosData';
import { useClinicLogo } from '../utils/logoHelper';
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Flame,
  GraduationCap,
  Heart,
  Instagram,
  Lock,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope
} from 'lucide-react';

interface DoctorProfileProps {
  onBookClick: () => void;
  isAdminUnlocked?: boolean;
  onAdminToggle?: () => void;
}

export const DoctorProfile: React.FC<DoctorProfileProps> = ({
  onBookClick,
  isAdminUnlocked,
  onAdminToggle
}) => {
  const clinicLogo = useClinicLogo();
  const doctorPhoto = 'https://i.postimg.cc/5tR8Ypky/IMG-20260922-WA0016.jpg';
  const [selectedAvatar, setSelectedAvatar] = useState<'doctor' | 'logo'>('doctor');

  // Filter live acupuncture treatment photos for the doctor's direct practice showcase
  const liveAcupuncturePhotos = CLINIC_PHOTOS.filter((p) => p.category === 'acupuncture_live');

  return (
    <div id="doctor-profile-section" className="space-y-8">
      {/* 1. Dedicated Showcase Main Profile Card for Therapist Saurabh Prajapati */}
      <div
        className="text-white rounded-3xl p-6 sm:p-10 border-2 border-amber-400/80 shadow-2xl overflow-hidden relative bg-emerald-950 bg-cover bg-center"
        style={{ backgroundImage: `url('https://i.postimg.cc/qNk2g2NW/IMG-20261001-WA0048.jpg')` }}
      >
        {/* Dark overlay for rich contrast */}
        <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-[1px] pointer-events-none" />

        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Showcase Portrait (Seated Posture & Face Centered) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl bg-emerald-950 group">
              <img
                src={doctorPhoto}
                alt="Therapist Saurabh Prajapati - Lead Clinical Specialist"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== window.location.origin + '/images/doctor-saurabh-profile.jpg') {
                    target.src = '/images/doctor-saurabh-profile.jpg';
                  }
                }}
                className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Badge overlay on portrait */}
              <div className="absolute bottom-4 left-4 right-4 bg-emerald-950/90 backdrop-blur-md p-3 rounded-2xl border border-amber-400/60 shadow-lg text-center">
                <div className="text-amber-300 font-black text-sm uppercase tracking-wider">
                  THERAPIST: SAURABH PRAJAPATI
                </div>
                <div className="text-xs text-emerald-100 font-semibold mt-0.5">
                  मुख्य चिकित्सक (Lead Clinical Specialist)
                </div>
                <div className="text-[11px] text-amber-200/90 mt-1">
                  बिंदसुख प्राकृतिक चिकित्सा केंद्र, प्रयागराज
                </div>
              </div>
            </div>
          </div>

          {/* Showcase Bio & Clinical Highlights */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400 text-emerald-950 text-xs font-black uppercase tracking-wider shadow-md">
              <Award className="w-4 h-4 fill-emerald-950 text-emerald-950" />
              <span>Official Clinician Profile • मुख्य चिकित्सक परिचय</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
                THERAPIST: SAURABH PRAJAPATI
              </h2>
              <p className="text-sm sm:text-base text-amber-300 font-bold mt-1">
                {CLINIC_INFO.taglineHindi} (Healing Through Touch &amp; Magnet)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/20">
                <GraduationCap className="w-5 h-5 text-amber-300 mb-1" />
                <div className="text-xs font-bold text-white">Master in Acupressure</div>
                <div className="text-[11px] text-emerald-200">मेरिडियन मैग्नेट चिकित्सा</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/20">
                <Award className="w-5 h-5 text-amber-300 mb-1" />
                <div className="text-xs font-bold text-white">Master Dip. Acupuncture</div>
                <div className="text-[11px] text-emerald-200">सूक्ष्म स्टरलाइज्ड नीडल थेरेपी</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/20">
                <ShieldCheck className="w-5 h-5 text-amber-300 mb-1" />
                <div className="text-xs font-bold text-white">Dip. in Chiropractic</div>
                <div className="text-[11px] text-emerald-200">रीढ़ की हड्डी संतुलन</div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              थेरेपिस्ट सौरभ प्रजापति जी प्रयागराज के प्रतिष्ठित प्राकृतिक चिकित्सक हैं, जो बिना दवा और बिना इंजेक्शन के लकवा (Paralysis), साइटिका (Sciatica), सर्वाइकल स्पोंडिलाइटिस, कमर दर्द, स्लिप डिस्क, घुटनों के दर्द एवं नसों की कमजोरी का सफल उपचार करते हैं।
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onBookClick}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-emerald-950 font-black rounded-2xl shadow-xl shadow-amber-400/20 text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>अपॉइंटमेंट बुक करें (Book Session)</span>
              </button>

              <a
                href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs sm:text-sm font-bold border border-white/30 flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                <span>कॉल करें +91 9455100097</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Detailed Profile Card & Clinical Qualifications */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Avatar and Credentials Badge */}
          <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-emerald-950 p-1.5 border-4 border-amber-400 shadow-2xl relative group flex items-center justify-center overflow-hidden">
                <img
                  src={selectedAvatar === 'doctor' ? doctorPhoto : clinicLogo}
                  alt="THERAPIST: SAURABH PRAJAPATI"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (selectedAvatar === 'doctor') {
                      const target = e.currentTarget;
                      if (target.src !== window.location.origin + '/images/doctor-saurabh-profile.jpg') {
                        target.src = '/images/doctor-saurabh-profile.jpg';
                      } else {
                        setSelectedAvatar('logo');
                      }
                    }
                  }}
                  className={`w-full h-full rounded-full transition-transform duration-500 ${
                    selectedAvatar === 'logo'
                      ? 'object-contain p-2.5 bg-emerald-950'
                      : 'object-cover object-[center_18%] group-hover:scale-105'
                  }`}
                />
              </div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-gradient-to-r from-amber-400 to-amber-300 text-emerald-950 text-[10px] font-black uppercase rounded-full shadow-md whitespace-nowrap border border-white/80">
                Lead Specialist • मुख्य चिकित्सक
              </div>
            </div>

            {/* Quick avatar switcher pill */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedAvatar('doctor')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  selectedAvatar === 'doctor'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👨‍⚕️ Doctor Photo
              </button>
              <button
                type="button"
                onClick={() => setSelectedAvatar('logo')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  selectedAvatar === 'logo'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏥 Clinic Logo
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-emerald-950">
                THERAPIST: SAURABH PRAJAPATI
              </h2>
              <p className="text-xs text-amber-800 font-bold mt-0.5">
                {CLINIC_INFO.taglineHindi}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Acupressure • Acupuncture • Chiropractic
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                title="Call Doctor"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${CLINIC_INFO.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                title="WhatsApp Direct"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={CLINIC_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors"
                title="Instagram Profile"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Detailed Biography & Qualifications */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                Clinical Qualifications
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-2">
                Certified Practitioner in Traditional & Modern Meridian Therapies
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
                <GraduationCap className="w-5 h-5 text-emerald-800" />
                <h4 className="text-xs font-bold text-emerald-950">Master in Acupressure</h4>
                <p className="text-[11px] text-slate-600">Advanced diagnostic touch & magnet therapy meridian points.</p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
                <Award className="w-5 h-5 text-emerald-800" />
                <h4 className="text-xs font-bold text-emerald-950">Master Diploma in Acupuncture</h4>
                <p className="text-[11px] text-slate-600">Sterile micro-needle nerve excitation & pain desensitization.</p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
                <ShieldCheck className="w-5 h-5 text-emerald-800" />
                <h4 className="text-xs font-bold text-emerald-950">Diploma in Chiropractic</h4>
                <p className="text-[11px] text-slate-600">Spinal subluxation relief and musculoskeletal balance.</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                THERAPIST: SAURABH PRAJAPATI leads <strong>Bindsukh Acupressure & Acupuncture Center</strong> in Prayagraj, delivering drugless treatments for chronic conditions such as paralysis, sciatica, cervical spondylosis, back spasms, and arthritis.
              </p>
              <p>
                Each 1-hour time slot is intentionally structured with a maximum capacity of 5 patients to give each person individualized diagnostic attention, magnetic point prescription, and rehabilitation exercises.
              </p>
            </div>

            {/* Direct Contact Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Clinic Address:</span>
                <span className="font-semibold text-slate-800">{CLINIC_INFO.address}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Direct Email:</span>
                <a href={`mailto:${CLINIC_INFO.email}`} className="font-semibold text-emerald-800 hover:underline">
                  {CLINIC_INFO.email}
                </a>
              </div>
            </div>

            {/* Doctor Security Console Access Portal */}
            {onAdminToggle && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                    {isAdminUnlocked ? (
                      <Stethoscope className="w-5 h-5 text-emerald-950" />
                    ) : (
                      <Lock className="w-5 h-5 text-emerald-950" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <span>डॉक्टर / क्लिनिक एडमिन कंसोल</span>
                      {isAdminUnlocked && (
                        <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.2 rounded-full font-bold">
                          लॉगिन एक्टिव
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {isAdminUnlocked
                        ? 'आप एडमिन के रूप में प्रमाणित हैं। मरीज रिकॉर्ड और टोकन देखने के लिए कंसोल खोलें।'
                        : 'क्लिनिक मैनेजमेंट, मरीज रजिस्टर, और टोकन कंट्रोल के लिए डॉक्टर पिन से लॉगिन करें।'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onAdminToggle}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-emerald-950 text-xs font-extrabold rounded-xl shadow-xs border border-amber-500/40 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  {isAdminUnlocked ? (
                    <>
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-950" />
                      <span>एडमिन कंसोल खोलें</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-emerald-950" />
                      <span>डॉक्टर लॉगिन करें</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onBookClick}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                Book Session with Therapist Saurabh
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('clinic-office-gallery-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-600" />
                <span>View Live Acupuncture Photos (चालू उपचार फोटो)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Acupuncture Treatment in Action Section */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-amber-300/80 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-xs font-black uppercase tracking-wider shadow-2xs">
              <Flame className="w-3.5 h-3.5 fill-emerald-950 text-emerald-950" />
              <span>Live Clinical Practice • चालू एक्यूपंक्चर प्रक्रिया</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-2">
              Acupuncture Sessions by Therapist Saurabh Prajapati
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              बिंदसुख सेंटर पर थेरेपिस्ट सौरभ द्वारा संचालित वास्तविक एक्यूपंक्चर एवं मेरिडियन नीडल थेरेपी के लाइव दृश्य।
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('clinic-office-gallery-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-950 transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
          >
            <span>See All Photos • सभी फोटो</span>
            <Eye className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>

        {/* Live photos cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveAcupuncturePhotos.slice(0, 3).map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-emerald-950 text-[10px] font-black shadow-xs">
                    🔥 LIVE TREATMENT
                  </span>
                </div>
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">
                    {photo.titleHindi}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {photo.descriptionHindi}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-800 font-bold">100% Drugless</span>
                  <span className="text-amber-800 font-semibold">Sterile Needles ✓</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Clinic Office & Treatment Rooms Showcase */}
      <ClinicOfficeGallery onBookClick={onBookClick} />
    </div>
  );
};
