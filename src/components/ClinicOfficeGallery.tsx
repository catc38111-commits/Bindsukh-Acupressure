import React, { useState } from 'react';
import { CLINIC_PHOTOS, GOOGLE_BUSINESS_INFO, ClinicPhoto } from '../data/clinicPhotosData';
import { CLINIC_INFO } from '../data/clinicData';
import { useLanguage } from '../context/LanguageContext';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  ExternalLink,
  Eye,
  HeartHandshake,
  MapPin,
  Maximize2,
  Phone,
  Sparkles,
  Star,
  Stethoscope,
  X
} from 'lucide-react';

interface ClinicOfficeGalleryProps {
  onBookClick?: () => void;
}

export const ClinicOfficeGallery: React.FC<ClinicOfficeGalleryProps> = ({ onBookClick }) => {
  const { language } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState<ClinicPhoto | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'acupuncture_live' | 'doctor' | 'treatment_room' | 'therapy_bed' | 'office'>('all');

  const filteredPhotos = activeFilter === 'all'
    ? CLINIC_PHOTOS
    : CLINIC_PHOTOS.filter((p) => p.category === activeFilter);

  const getCategoryLabel = (category: string) => {
    if (language === 'en') {
      if (category === 'office') return "Consultation";
      if (category === 'acupuncture_live') return "Live Treatment";
      if (category === 'treatment_room') return "Treatment Room";
      if (category === 'therapy_bed') return "Therapy Bed";
      if (category === 'diagnostic') return "Diagnostic";
      return "Clinic Gallery";
    } else if (language === 'hinglish') {
      if (category === 'office') return "Consultation Room";
      if (category === 'acupuncture_live') return "Live Treatment";
      if (category === 'treatment_room') return "Treatment Room";
      if (category === 'therapy_bed') return "Therapy Bed";
      if (category === 'diagnostic') return "Diagnostic";
      return "Clinic Gallery";
    } else {
      if (category === 'office') return "परामर्श कक्ष";
      if (category === 'acupuncture_live') return "चालू उपचार";
      if (category === 'treatment_room') return "उपचार कक्ष";
      if (category === 'therapy_bed') return "थेरेपी बेड";
      if (category === 'diagnostic') return "निदान क्षेत्र";
      return "गैलरी फोटो";
    }
  };

  const filterLabels: Record<string, Record<string, string>> = {
    all: {
      en: "All Photos (7)",
      hi: "सभी फोटो (7)",
      hinglish: "Sabhi Photos (7)"
    },
    acupuncture_live: {
      en: "Live Treatment",
      hi: "चालू उपचार",
      hinglish: "Live Treatment"
    },
    doctor: {
      en: "Doctor Profile",
      hi: "मुख्य चिकित्सक",
      hinglish: "Doctor Profile"
    },
    treatment_room: {
      en: "Treatment Room",
      hi: "उपचार कक्ष",
      hinglish: "Treatment Room"
    },
    therapy_bed: {
      en: "Therapy Beds",
      hi: "थेरेपी बेड",
      hinglish: "Therapy Beds"
    },
    office: {
      en: "Consultation Room",
      hi: "परामर्श कक्ष",
      hinglish: "Consultation Room"
    }
  };

  const headerBadge = language === 'en'
    ? "Doctor & Live Acupuncture Photos"
    : language === 'hi'
    ? "क्लिनिक फोटो एवं चालू उपचार दर्शन"
    : "Clinic Photos aur Live Therapy Showcase";

  const headerTitle = language === 'en'
    ? "Bindsukh Center Doctor & Live Therapy Showcase"
    : language === 'hi'
    ? "बिंदसुख सेंटर डॉक्टर एवं लाइव थेरेपी गैलरी"
    : "Bindsukh Center Doctor aur Live Therapy Showcase";

  const headerDesc = language === 'en'
    ? "Actual clinical photo showcase, live acupuncture therapy sessions, treatment rooms, and reception of Lead Specialist Therapist Saurabh Prajapati in Prayagraj."
    : language === 'hi'
    ? "प्रयागराज स्थित मुख्य चिकित्सक थेरेपिस्ट सौरभ प्रजापति की क्लिनिकल फोटो, चालू एक्यूपंक्चर (नीडल) थेरेपी सत्र, उपचार कक्ष एवं रिसेप्शन।"
    : "Prayagraj ke main specialist Therapist Saurabh Prajapati ke clinical photos, live acupuncture session aur treatment room ka showcase.";

  const viewLargeText = language === 'en' ? "View Large Photo" : language === 'hi' ? "बड़ा देखें" : "Bada Dekhein";

  const keyFeaturesLabel = language === 'en'
    ? "Key Office & Clinical Features:"
    : language === 'hi'
    ? "मुख्य क्लिनिकल विशेषताएं व सुविधाएं:"
    : "Key Office aur Clinical Features:";

  const callDoctorText = language === 'en'
    ? "Call Doctor +91 9455100097"
    : language === 'hi'
    ? "डॉक्टर को कॉल करें +91 9455100097"
    : "Doctor ko Call Karein +91 9455100097";

  const closeBtnText = language === 'en' ? "Close" : language === 'hi' ? "बंद करें" : "Close";

  const bookClinicText = language === 'en'
    ? "Book at this Clinic"
    : language === 'hi'
    ? "अपॉइंटमेंट लें"
    : "Book Karein";

  const googleVerifiedText = language === 'en'
    ? "Google Verified Clinic"
    : language === 'hi'
    ? "गूगल सत्यापित क्लिनिक"
    : "Google Verified Clinic";

  const reviewsText = language === 'en'
    ? `(${GOOGLE_BUSINESS_INFO.reviewCount}+ Reviews)`
    : language === 'hi'
    ? `(${GOOGLE_BUSINESS_INFO.reviewCount}+ समीक्षाएं)`
    : `(${GOOGLE_BUSINESS_INFO.reviewCount}+ Reviews)`;

  return (
    <section id="clinic-office-gallery-section" className="space-y-6">
      {/* Header Card with Google Business Badge */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl overflow-hidden relative">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-bold border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>{headerBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 tracking-tight">
              {headerTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {headerDesc}
            </p>
          </div>

          {/* Google Business Profile Verified Badge */}
          <div className="w-full sm:w-auto p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-300/80 shadow-md space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-amber-300 flex items-center justify-center shadow-xs">
                <span className="font-black text-blue-600 text-xs">G</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-amber-900 tracking-wider">
                  {googleVerifiedText}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <span>5.0</span>
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-slate-500 font-normal">{reviewsText}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-700 font-medium border-t border-amber-200/60 pt-2 flex items-center justify-between gap-3">
              <span className="truncate max-w-[220px]">
                {GOOGLE_BUSINESS_INFO.address}
              </span>
              <a
                href={GOOGLE_BUSINESS_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold shrink-0 hover:underline"
              >
                <span>Google Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-5 overflow-x-auto pb-1 scrollbar-none">
          {Object.keys(filterLabels).map((key) => {
            const isSelected = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-emerald-900 text-white shadow-sm ring-2 ring-amber-400/50'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filterLabels[key][language]}
              </button>
            );
          })}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
          {filteredPhotos.map((photo) => {
            const photoTitle = language === 'en' ? photo.title : language === 'hinglish' ? photo.titleHinglish : photo.titleHindi;
            const photoDesc = language === 'en' ? photo.description : language === 'hinglish' ? photo.descriptionHinglish : photo.descriptionHindi;
            const photoHighlights = language === 'en' ? photo.highlights : language === 'hinglish' ? photo.highlightsHinglish : photo.highlightsHindi;
            const categoryLabel = getCategoryLabel(photo.category);

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group cursor-pointer rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col transform hover:-translate-y-1"
              >
                {/* Image Frame */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={photo.imageUrl}
                    alt={photoTitle}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                      photo.category === 'doctor' ? 'object-cover object-[center_18%]' : 'object-cover rounded-xl shadow-md hover:scale-[1.02] transition-transform cursor-pointer'
                    }`}
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md border shadow-xs ${
                      photo.category === 'acupuncture_live'
                        ? 'bg-amber-400/95 text-emerald-950 border-amber-300 font-extrabold'
                        : photo.category === 'doctor'
                        ? 'bg-emerald-800/95 text-amber-300 border-amber-400/60 font-extrabold'
                        : 'bg-emerald-950/90 text-emerald-100 border-white/20'
                    }`}>
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Click to expand pill */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Bottom title on image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-sm leading-snug drop-shadow-sm line-clamp-2">
                      {photoTitle}
                    </h3>
                  </div>
                </div>

                {/* Card Footer Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {photoDesc}
                  </p>

                  {/* Highlights tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {photoHighlights.slice(0, 2).map((h, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-semibold border border-emerald-200/80"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-bold group-hover:text-emerald-950 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{viewLargeText}</span>
                    </span>
                    <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal for Detailed High-Res Photo View */}
      {selectedPhoto && (() => {
        const photoTitle = language === 'en' ? selectedPhoto.title : language === 'hinglish' ? selectedPhoto.titleHinglish : selectedPhoto.titleHindi;
        const photoDesc = language === 'en' ? selectedPhoto.description : language === 'hinglish' ? selectedPhoto.descriptionHinglish : selectedPhoto.descriptionHindi;
        const photoHighlights = language === 'en' ? selectedPhoto.highlights : language === 'hinglish' ? selectedPhoto.highlightsHinglish : selectedPhoto.highlightsHindi;
        const categoryLabel = getCategoryLabel(selectedPhoto.category);

        return (
          <div
            id="clinic-photo-lightbox"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-white/60 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Image Header */}
              <div className="relative aspect-[16/9] sm:aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={selectedPhoto.imageUrl}
                  alt={photoTitle}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full ${
                    selectedPhoto.category === 'doctor'
                      ? 'object-contain sm:object-cover sm:object-top'
                      : 'object-cover'
                  }`}
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors shadow-lg"
                  title="Close Photo"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-xl bg-emerald-900/90 text-amber-300 text-xs font-bold backdrop-blur-md border border-amber-300/30">
                    {categoryLabel}
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 sm:p-8 space-y-5 text-slate-800">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-emerald-950 leading-tight">
                    {photoTitle}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
                  <p>
                    {photoDesc}
                  </p>
                </div>

                {/* Highlights & Features */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {keyFeaturesLabel}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {photoHighlights.map((h, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Reference matching Google Business Profile */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Bindsukh Center Location:</strong>
                      <div>{GOOGLE_BUSINESS_INFO.address}</div>
                    </div>
                  </div>
                  <a
                    href={GOOGLE_BUSINESS_INFO.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  </a>
                </div>

                {/* Modal Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                  <a
                    href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{callDoctorText}</span>
                  </a>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(null)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      {closeBtnText}
                    </button>
                    {onBookClick && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(null);
                          onBookClick();
                        }}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        <Calendar className="w-4 h-4 text-amber-300" />
                        <span>{bookClinicText}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
