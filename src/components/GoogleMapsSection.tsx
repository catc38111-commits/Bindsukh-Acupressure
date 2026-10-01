import React, { useState } from 'react';
import { CLINIC_INFO } from '../data/clinicData';
import { GOOGLE_BUSINESS_INFO } from '../data/clinicPhotosData';
import {
  Compass,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sparkles,
  Star,
  Clock,
  Building2,
  Car
} from 'lucide-react';

interface GoogleMapsSectionProps {
  onBookClick?: () => void;
}

export const GoogleMapsSection: React.FC<GoogleMapsSectionProps> = ({ onBookClick }) => {
  const [copied, setCopied] = useState(false);

  // Exact Google Maps directions destination
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=25.5028,81.6756&destination_place_id=ChIJfyroHkOqmjkRf7_j9ZL9fXw`;
  const viewMapUrl = GOOGLE_BUSINESS_INFO.googleMapsUrl;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(
      `${CLINIC_INFO.name}, ${CLINIC_INFO.address}, Prayagraj, Uttar Pradesh 212208`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareLocation = () => {
    const text = `🏥 *${CLINIC_INFO.name}*\n📍 ${CLINIC_INFO.address}\n\n🗺️ Google Maps Directions:\n${directionsUrl}\n\n📞 Phone: +91 9455100097`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section id="google-maps-location-section" className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl overflow-hidden relative">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-bold border border-emerald-300">
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Interactive Google Maps &amp; Clinic Directions • क्लिनिक का नक्शा व रास्ता</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 tracking-tight">
              Bindsukh Center Location &amp; Directions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर, <strong>पुरामुफ्ती पुरानी बाजार (निकट पंचायत भवन), प्रयागराज</strong> पर आसानी से पहुंचें। नीचे दिए गए मैप व बटन से सीधे अपने फोन में जीपीएस नेविगेशन शुरू करें।
            </p>
          </div>

          {/* Quick Action: Get Directions Button */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              id="get-directions-btn"
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-900/20 text-xs sm:text-sm transition-all flex items-center gap-2 border border-emerald-700 active:scale-95 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-amber-300" />
              <span>Get Directions / Clinic Location</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
            </a>

            <button
              type="button"
              onClick={handleShareLocation}
              className="px-4 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-2xl border border-emerald-300 text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>व्हाट्सएप पर लोकेशन भेजें</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Interactive Map + Location Metadata */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-stretch">
          {/* Left Column: Embedded Interactive Google Map */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-100 group">
              <iframe
                title="Bindsukh Acupressure Center Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14406.845942478586!2d81.6669!3d25.5028!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399aca431ef82a7f%3A0x7c7dfd92f5e3bf7d!2sPuramufti%2C%20Prayagraj%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />

              {/* Floating Map Overlay Badge */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-300 shadow-md text-xs font-bold text-emerald-950 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>Bindsukh Acu Center • Puramufti</span>
              </div>

              {/* Floating Fullscreen Map Button */}
              <a
                href={viewMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 bg-emerald-950/90 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-xl border border-amber-400 text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
              >
                <span>Open in Google Maps App</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              </a>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>📍 GPS कोऑर्डिनेट्स: 25.5028° N, 81.6756° E</span>
              <span>पुरामुफ्ती, प्रयागराज (NH-19)</span>
            </div>
          </div>

          {/* Right Column: Address, Landmark Distances & Hours */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Address Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    संपूर्ण क्लिनिक पता (Full Address)
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug pt-1">
                    {CLINIC_INFO.name}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {CLINIC_INFO.address}, प्रयागराज (उ.प्र.) - 212208
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shrink-0 shadow-2xs"
                  title="पता कॉपी करें (Copy Address)"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {copied && (
                <div className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                  ✓ पता क्लिपबोर्ड में कॉपी हो गया!
                </div>
              )}
            </div>

            {/* Landmark Distances */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 space-y-2 text-xs">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-800" />
                <span>निकटतम प्रमुख केंद्र व दूरी (Landmarks):</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 pl-5 list-disc text-[11px]">
                <li>
                  <strong>पुरामुफ्ती पंचायत भवन / जीटी रोड:</strong> मात्र 150 मीटर पैदल दूरी
                </li>
                <li>
                  <strong>बमरौली रेलवे स्टेशन / एयरपोर्ट:</strong> लगभग 8 किमी (15-20 मिनट)
                </li>
                <li>
                  <strong>प्रयागराज जंक्शन (इलाहाबाद स्टेशन):</strong> लगभग 16 किमी (30-35 मिनट)
                </li>
                <li>
                  <strong>कौशाम्बी बॉर्डर:</strong> लगभग 4 किमी
                </li>
              </ul>
            </div>

            {/* Operating Hours */}
            <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 space-y-2 text-xs">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>क्लिनिक परामर्श समय (Consultation Timings):</span>
              </div>
              <div className="space-y-1 text-slate-700 text-[11px]">
                <div className="flex justify-between">
                  <span>सोमवार से शनिवार:</span>
                  <span className="font-bold text-slate-900">8:30 AM से 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>रविवार (Sunday Morning):</span>
                  <span className="font-bold text-slate-900">8:00 AM से 12:00 PM</span>
                </div>
              </div>
            </div>

            {/* Call Doctor Button */}
            <div className="pt-1 flex items-center gap-2">
              <a
                href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
                className="flex-1 py-3 bg-white hover:bg-emerald-50 text-emerald-900 font-bold rounded-2xl border border-emerald-300 text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>मार्गदर्शन के लिए कॉल: +91 9455100097</span>
              </a>

              {onBookClick && (
                <button
                  type="button"
                  onClick={onBookClick}
                  className="px-4 py-3 bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black rounded-2xl shadow-xs text-xs transition-colors cursor-pointer"
                >
                  स्लॉट बुक करें
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
