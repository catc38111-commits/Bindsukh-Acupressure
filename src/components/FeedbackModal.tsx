import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  User,
  Heart,
  Send,
  Phone,
  MessageCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { CLINIC_INFO } from '../data/clinicData';
import { PatientFeedback } from '../types';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToBooking?: () => void;
}

const THERAPY_OPTIONS = [
  'Acupressure (एक्यूप्रेशर)',
  'Acupuncture (एक्यूपंक्चर)',
  'Chiropractic (स्पाइनल एडजस्टमेंट)',
  'Cupping (कपिंग / हिजामा)',
  'Sciatica & Back Pain (साइटिका व कमर दर्द)',
  'Knee Pain & Arthritis (घुटनों का दर्द व गठिया)',
  'Cervical Spondylosis (सर्वाइकल व गर्दन दर्द)',
  'Paralysis Recovery (लकवा उपचार)',
  'General Wellness (स्वास्थ्य परामर्श)'
];

const RATING_DESCRIPTIONS: Record<number, { text: string; hindi: string }> = {
  5: { text: 'Outstanding Experience', hindi: 'उत्कृष्ट व चमत्कारी लाभ (5 Star)' },
  4: { text: 'Very Good Service', hindi: 'बहुत अच्छा व संतोषजनक (4 Star)' },
  3: { text: 'Good Experience', hindi: 'अच्छा अनुभव (3 Star)' },
  2: { text: 'Average', hindi: 'सामान्य (2 Star)' },
  1: { text: 'Needs Improvement', hindi: 'सुधार की आवश्यकता (1 Star)' }
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onNavigateToBooking
}) => {
  useLockBodyScroll(isOpen);
  const [activeSubTab, setActiveSubTab] = useState<'write' | 'view'>('write');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientCity, setPatientCity] = useState('');
  const [selectedTherapy, setSelectedTherapy] = useState(THERAPY_OPTIONS[0]);
  const [comment, setComment] = useState('');
  const [verifiedPatient, setVerifiedPatient] = useState(true);

  const [feedbacks, setFeedbacks] = useState<PatientFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch feedbacks
  useEffect(() => {
    if (isOpen) {
      loadFeedbacks();
      setSubmitSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  const loadFeedbacks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/feedbacks');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setErrorMessage('कृपया अपना नाम दर्ज करें (Please enter your name)');
      return;
    }
    if (!comment.trim()) {
      setErrorMessage('कृपया अपना फीडबैक या समीक्षा दर्ज करें (Please write your feedback/review)');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const displayName = patientCity.trim()
        ? `${patientName.trim()} (${patientCity.trim()})`
        : patientName.trim();

      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: displayName,
          rating,
          comment: comment.trim(),
          category: selectedTherapy,
          therapy: selectedTherapy,
          verifiedPatient
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit feedback');
      }

      setSubmitSuccess(true);
      setComment('');
      setPatientCity('');
      loadFeedbacks();
    } catch (err: any) {
      setErrorMessage(err.message || 'त्रुटि: फीडबैक सबमिट नहीं हो सका।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentRatingDisplay = hoverRating || rating;
  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / feedbacks.length).toFixed(1)
      : '4.9';

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* YouTube style grab handle on mobile */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base leading-tight text-white">
                  मरीज फीडबैक व समीक्षा
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black">
                  ★ {averageRating}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90">
                {CLINIC_INFO.name} • {CLINIC_INFO.leadPractitioner}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs (YouTube style pill switcher) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl w-full">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('write');
                setSubmitSuccess(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'write'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>✍️ फीडबैक दें (Give Feedback)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('view')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'view'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>मरीज रिव्यू ({feedbacks.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeSubTab === 'write' ? (
            submitSuccess ? (
              <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">
                    धन्यवाद! आपका फीडबैक दर्ज हो गया है 🙏
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    आपके मूल्यवान अनुभव और समीक्षा से अन्य मरीजों को प्राकृतिक उपचार चुनने में मदद मिलेगी।
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>डॉ. सौरभ प्रजापति (बिन्दसुख क्लिनिक)</span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    "आपका स्वास्थ्य और त्वरित स्वास्थ्य लाभ ही हमारा परम संकल्प है।"
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('view')}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    समीक्षाएं देखें (View Reviews)
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all"
                  >
                    बंद करें (Close)
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
                {/* Star Rating Section */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-center space-y-2">
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    क्लिनिक सेवा व उपचार का रेटिंग चुनें
                  </label>
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled = starVal <= (currentRatingDisplay || 5);
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(starVal)}
                          className="p-1 text-slate-300 hover:scale-125 active:scale-95 transition-transform focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs font-bold text-amber-800">
                    {RATING_DESCRIPTIONS[currentRatingDisplay]?.hindi || 'उत्कृष्ट अनुभव'}
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Patient Name & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      आपका नाम (Patient Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. रमेश कुमार मौर्य"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      शहर / क्षेत्र (City / Area)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. पूरामुफ्ती, प्रयागराज"
                      value={patientCity}
                      onChange={(e) => setPatientCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                    />
                  </div>
                </div>

                {/* Therapy / Condition selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    किस उपचार / रोग का अनुभव साझा कर रहे हैं?
                  </label>
                  <select
                    value={selectedTherapy}
                    onChange={(e) => setSelectedTherapy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {THERAPY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Comment / Review */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    आपका अनुभव व सुझाव (Feedback / Review) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="डॉ. सौरभ प्रजापति जी के उपचार से आपको कितना आराम मिला? अपनी प्रतिक्रिया यहाँ लिखें..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                {/* Verified Patient Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="verifiedPatientCheck"
                    checked={verifiedPatient}
                    onChange={(e) => setVerifiedPatient(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
                  />
                  <label htmlFor="verifiedPatientCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                    हाँ, मैंने बिन्दसुख क्लिनिक में उपचार प्राप्त किया है (Verified Patient)
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'सबमिट हो रहा है...' : 'फीडबैक सबमिट करें (Submit)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    रद्द करें
                  </button>
                </div>
              </form>
            )
          ) : (
            /* View Reviews Tab */
            <div className="space-y-4">
              {/* Rating Summary Bar */}
              <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-amber-300 font-mono">
                    {averageRating}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <div className="text-[11px] text-emerald-200 mt-0.5">
                      आधारित {feedbacks.length}+ संतुष्ट मरीजों की समीक्षाओं पर
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('write');
                    setSubmitSuccess(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shrink-0 shadow-xs"
                >
                  + रिव्यू दें
                </button>
              </div>

              {/* Reviews List */}
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  समीक्षाएं लोड हो रही हैं...
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">अभी तक कोई समीक्षा नहीं है। आप पहली समीक्षा दें!</p>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('write')}
                    className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-bold rounded-lg"
                  >
                    फीडबैक लिखें
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-2xl p-3.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {fb.patientName?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {fb.patientName}
                              </h5>
                              {fb.verifiedPatient && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>सत्यापित</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(fb.createdAt).toLocaleDateString('hi-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {fb.therapy && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-semibold">
                          उपचार: {fb.therapy}
                        </span>
                      )}

                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        "{fb.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Quick Contact Bar */}
        <div className="p-3 bg-slate-100/90 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">डॉक्टर से सीधे बात करें:</span>
            <a
              href={`https://wa.me/${CLINIC_INFO.whatsapp}?text=${encodeURIComponent(
                'नमस्ते डॉ. सौरभ जी, मुझे बिन्दसुख क्लिनिक उपचार के बारे में जानकारी चाहिए।'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-800 font-bold hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1 text-slate-800 font-bold hover:underline"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>कॉल (+91 9455100097)</span>
            </a>
          </div>

          {onNavigateToBooking && (
            <button
              onClick={() => {
                onClose();
                onNavigateToBooking();
              }}
              className="ml-auto text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline"
            >
              अपॉइंटमेंट बुक करें →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
