import React from 'react';
import { CLINIC_INFO } from '../data/clinicData';
import { useClinicLogo } from '../utils/logoHelper';
import { useLanguage } from '../context/LanguageContext';
import {
  Calendar,
  Clock,
  Heart,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

interface FooterProps {
  onNavClick: (tab: 'booking' | 'photos' | 'dashboard' | 'services' | 'doctor' | 'admin') => void;
  onOpenInstallModal?: () => void;
  onOpenPublicModal?: () => void;
  onOpenPhoneModal?: () => void;
  onOpenHelpShareModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavClick,
  onOpenInstallModal,
  onOpenPublicModal,
  onOpenPhoneModal,
  onOpenHelpShareModal,
}) => {
  const clinicLogo = useClinicLogo();
  const { language } = useLanguage();

  const tagline = language === 'en'
    ? CLINIC_INFO.taglineEnglish
    : language === 'hinglish'
    ? 'Touch Aur Magnet Se Natural Healing'
    : CLINIC_INFO.taglineHindi;

  const desc = language === 'en'
    ? "Specialized holistic center for Acupressure, Acupuncture, Chiropractic realignment, and Magnet therapy under THERAPIST: SAURABH PRAJAPATI in Prayagraj."
    : language === 'hinglish'
    ? "Acupressure, Acupuncture aur Chiropractic ki realigning therapy bina dawa ke, Therapist Saurabh Prajapati ke supervision me."
    : "प्रयागराज में थेरेपिस्ट सौरभ प्रजापति के निर्देशन में एक्यूप्रेशर, एक्यूपंक्चर, काइरोप्रैक्टिक अलाइनमेंट और मैग्नेट थेरेपी का विशिष्ट प्राकृतिक चिकित्सा केंद्र।";

  const upiLabel = language === 'en'
    ? "Official UPI Merchant ID"
    : language === 'hi'
    ? "आधिकारिक UPI मर्चेंट आईडी"
    : "Official UPI Merchant ID";

  const timingsHeader = language === 'en'
    ? "Operating Hours & Slots"
    : language === 'hi'
    ? "कार्य समय एवं स्लॉट"
    : "Operating Hours aur Slots";

  const monSatLabel = language === 'en' ? "Monday - Saturday:" : language === 'hi' ? "सोमवार - शनिवार:" : "Monday - Saturday:";
  const monSatVal = language === 'en' ? "8:00 AM to 4:00 PM (1-Hour Discrete Slots)" : language === 'hi' ? "सुबह 8:00 से दोपहर 4:00 बजे तक (1-घंटे का स्लॉट)" : "8:00 AM se 4:00 PM (1-Hour Discrete Slots)";

  const sunLabel = language === 'en' ? "Sunday Morning Session:" : language === 'hi' ? "रविवार सुबह सत्र:" : "Sunday Morning Session:";
  const sunVal = language === 'en' ? "8:00 AM to 12:00 PM (1-Hour Discrete Slots)" : language === 'hi' ? "सुबह 8:00 से दोपहर 12:00 बजे तक" : "8:00 AM se 12:00 PM";

  const maxCapText = language === 'en'
    ? "Max 5 Patients / 1-Hour Time Slot"
    : language === 'hi'
    ? "अधिकतम 5 मरीज / 1-घंटे का स्लॉट"
    : "Max 5 Patients / 1-Hour Time Slot";

  const contactHeader = language === 'en' ? "Location & Contact" : language === 'hi' ? "स्थान एवं संपर्क" : "Location aur Contact";
  const getDirectionsText = language === 'en' ? "Get Directions on Google Maps ↗" : language === 'hi' ? "गूगल मैप पर रास्ता देखें ↗" : "Google Maps Par Rasta Dekhein ↗";

  const addressLabel = language === 'en' ? "Address" : language === 'hi' ? "पता" : "Address";
  const mobileLabel = language === 'en' ? "Mobile" : language === 'hi' ? "मोबाइल" : "Mobile";

  // Navigation labels
  const navHeader = language === 'en' ? "Quick Links & Rates" : language === 'hi' ? "त्वरित लिंक एवं दरें" : "Quick Links aur Rates";
  const bookSlotNav = language === 'en' ? "Book 1-Hour Slot" : language === 'hi' ? "1-घंटे का स्लॉट बुक करें" : "Book 1-Hour Slot";
  const clinicPhotosNav = language === 'en' ? "Clinic Office Photos" : language === 'hi' ? "क्लिनिक कार्यालय फोटो" : "Clinic Office Photos";
  const trackAptNav = language === 'en' ? "Track My Appointment Status" : language === 'hi' ? "अपॉइंटमेंट स्थिति ट्रैक करें" : "Track My Appointment Status";
  const servicesNav = language === 'en' ? "Services & Ailments Treated" : language === 'hi' ? "सेवाएं एवं उपचार" : "Services aur Ailments";
  const doctorNav = language === 'en' ? "Therapist Saurabh Profile" : language === 'hi' ? "चिकित्सक प्रोफ़ाइल" : "Therapist Saurabh Profile";
  const loginNav = language === 'en' ? "Doctor Security Console" : language === 'hi' ? "डॉक्टर सुरक्षा लॉगिन" : "Doctor Security Console";
  const phoneHelpNav = language === 'en' ? "Phone & iPhone Help" : language === 'hi' ? "फ़ोन समाधान सहायता" : "Phone & iPhone Help";
  const installAppNav = language === 'en' ? "Install App on Mobile / PC" : language === 'hi' ? "ऐप सीधे इंस्टॉल करें" : "Install App on Mobile / PC";
  const qrCodeNav = language === 'en' ? "Public Patient App QR" : language === 'hi' ? "सार्वजनिक ऐप QR कोड" : "Public Patient App QR";
  const helpShareNav = language === 'en' ? "Help & Direct Share" : language === 'hi' ? "सहायता व व्हाट्सएप शेयर" : "Help & Direct Share";

  const feeNoteText = language === 'en'
    ? "Fee: 1st Visit: ₹500 (Registration + Therapy) | Returning: ₹200 (Therapy only)"
    : language === 'hi'
    ? "शुल्क: पहली बार: ₹500 (पंजीकरण + थेरेपी) | दोबारा: ₹200 (केवल थेरेपी)"
    : "Fee: Pehli Baar: ₹500 | Dobara: ₹200";

  return (
    <footer className="bg-emerald-950 text-white pt-12 pb-28 sm:pb-24 border-t border-emerald-900 no-print mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-emerald-900/60">
          {/* Col 1: Clinic Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={clinicLogo}
                alt="Bindsukh Clinic Official Circular Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shrink-0 shadow-md"
              />
              <div>
                <h3 className="font-bold text-sm font-serif leading-tight">{CLINIC_INFO.name}</h3>
                <p className="text-xs text-amber-300 font-semibold">{tagline}</p>
              </div>
            </div>

            <p className="text-xs text-emerald-200/80 leading-relaxed">
              {desc}
            </p>

            <div className="pt-1">
              <div className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">
                {upiLabel}
              </div>
              <div className="font-mono text-xs font-bold text-amber-300 bg-emerald-900/80 px-2.5 py-1.5 rounded-lg border border-emerald-800 inline-block mt-1">
                {CLINIC_INFO.upiId}
              </div>
            </div>
          </div>

          {/* Col 2: Timings & Slots */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-sm text-white font-serif border-b border-emerald-900 pb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-300" />
              {timingsHeader}
            </h4>

            <div className="space-y-2 text-emerald-200">
              <div>
                <span className="font-bold text-white block">{monSatLabel}</span>
                <span>{monSatVal}</span>
              </div>
              <div>
                <span className="font-bold text-white block">{sunLabel}</span>
                <span>{sunVal}</span>
              </div>
              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded bg-emerald-900 text-emerald-300 text-[11px] font-semibold">
                  {maxCapText}
                </span>
              </div>
            </div>
          </div>

          {/* Col 3: Contact & Location */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-sm text-white font-serif border-b border-emerald-900 pb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-300" />
              {contactHeader}
            </h4>

            <div className="space-y-2 text-emerald-200">
              <p className="leading-relaxed">
                <strong className="text-white">{addressLabel}:</strong> {CLINIC_INFO.address}
              </p>
              <div className="pt-1">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=25.5028,81.6756"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-850 text-amber-300 font-bold border border-emerald-700 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{getDirectionsText}</span>
                </a>
              </div>
              <p>
                <strong className="text-white">{mobileLabel}:</strong>{' '}
                <a href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`} className="hover:text-amber-300">
                  {CLINIC_INFO.phones[0]}
                </a>
                ,{' '}
                <a href={`tel:${CLINIC_INFO.phones[1].replace(/\s+/g, '')}`} className="hover:text-amber-300">
                  {CLINIC_INFO.phones[1]}
                </a>
              </p>
              <p>
                <strong className="text-white">Email:</strong>{' '}
                <a href={`mailto:${CLINIC_INFO.email}`} className="hover:text-amber-300">
                  {CLINIC_INFO.email}
                </a>
              </p>
              <p>
                <strong className="text-white">Instagram:</strong>{' '}
                <a
                  href={CLINIC_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 font-semibold"
                >
                  {CLINIC_INFO.instagram}
                </a>
              </p>
            </div>
          </div>

          {/* Col 4: Quick Navigation & Rates */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-sm text-white font-serif border-b border-emerald-900 pb-2">
              {navHeader}
            </h4>

            <ul className="space-y-2 text-emerald-200">
              <li>
                <button
                  onClick={() => onNavClick('booking')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <span>→ {bookSlotNav}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('photos')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-amber-300 font-semibold"
                >
                  <span>→ {clinicPhotosNav}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('dashboard')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <span>→ {trackAptNav}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('services')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <span>→ {servicesNav}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('doctor')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <span>→ {doctorNav}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('admin')}
                  className="text-amber-300 hover:text-amber-200 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>→ {loginNav}</span>
                </button>
              </li>
              {onOpenPhoneModal && (
                <li>
                  <button
                    onClick={onOpenPhoneModal}
                    className="text-amber-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>→ {phoneHelpNav}</span>
                  </button>
                </li>
              )}
              {onOpenInstallModal && (
                <li>
                  <button
                    onClick={onOpenInstallModal}
                    className="text-emerald-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>→ {installAppNav}</span>
                  </button>
                </li>
              )}
              {onOpenPublicModal && (
                <li>
                  <button
                    onClick={onOpenPublicModal}
                    className="text-emerald-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <span>→ {qrCodeNav}</span>
                  </button>
                </li>
              )}
              {onOpenHelpShareModal && (
                <li>
                  <button
                    onClick={onOpenHelpShareModal}
                    className="text-amber-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <span>→ {helpShareNav}</span>
                  </button>
                </li>
              )}
            </ul>

            <div className="pt-2 text-[11px] text-emerald-300/80 bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-800/60">
              <strong>{feeNoteText}</strong>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400/80 gap-3">
          <p>© {new Date().getFullYear()} Bindsukh Acupressure & Acupuncture Center. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Clinical Lead:</span>
            <span className="text-amber-300 font-semibold">THERAPIST: SAURABH PRAJAPATI</span>
            <span>• Prayagraj</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
