import React, { useState, useEffect } from 'react';
import { PatientAppointment, PatientProfile } from '../types';
import { CLINIC_INFO, CONDITIONS_TREATED, SERVICES_OFFERED } from '../data/clinicData';
import { downloadCalendarIcsFile } from '../utils/calendarHelper';
import { generateAppointmentReceiptPdf, downloadReceiptAsImage } from '../utils/receiptPdfHelper';
import { compressImageToBase64 } from '../utils/imageHelper';
import { getAbsoluteApiUrl, safeParseJsonResponse } from '../utils/appUrlHelper';
import { useLanguage } from '../context/LanguageContext';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  FileText,
  Phone,
  Search,
  Sparkles,
  User,
  UserCheck,
  XCircle,
  AlertCircle,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Download,
  Save,
  Edit3,
  HeartPulse,
  Activity,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

interface PatientDashboardProps {
  onSelectReceipt: (appointment: PatientAppointment) => void;
  onNavigateToBooking?: () => void;
  initialPhone?: string;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onSelectReceipt,
  onNavigateToBooking,
  initialPhone = ''
}) => {
  const { language } = useLanguage();
  const [activeSubTab, setActiveDashboardTab] = useState<'profile' | 'history'>('profile');

  // Profile Form state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState(initialPhone);
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [profileDefaultCondition, setProfileDefaultCondition] = useState(CONDITIONS_TREATED[0].name);
  const [profileNotes, setProfileNotes] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // History & Appointments state
  const [searchPhone, setSearchPhone] = useState(initialPhone);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [downloadingImgId, setDownloadingImgId] = useState<string | null>(null);
  const [downloadedIcsId, setDownloadedIcsId] = useState<string | null>(null);

  // Handle image upload & compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    try {
      const compressedBase64 = await compressImageToBase64(file, 400, 400, 0.85);
      setProfilePhoto(compressedBase64);
      setProfileSuccessMsg(
        language === 'hi'
          ? 'फ़ोटो अपलोड हो गई! प्रोफ़ाइल सुरक्षित करने के लिए नीचे "Save Profile" दबाएं।'
          : 'Photo uploaded! Click "Save Profile" below to confirm.'
      );
    } catch (err) {
      console.error('Photo processing error:', err);
      setProfileErrorMsg(
        language === 'hi'
          ? 'चित्र फ़ाइल लोड नहीं हो सकी। कृपया कोई अन्य फोटो चुनें।'
          : 'Failed to process image. Please choose another photo.'
      );
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('');
    setProfileSuccessMsg(
      language === 'hi'
        ? 'फ़ोटो हटा दी गई है। परिवर्तन सुरक्षित करने के लिए "Save Profile" दबाएं।'
        : 'Photo removed. Click "Save Profile" to save changes.'
    );
  };

  // 1. Initialize profile from localStorage or recent active booking on mount
  useEffect(() => {
    try {
      const storedProfileStr = localStorage.getItem('bindsukh_patient_profile');
      if (storedProfileStr) {
        const storedProfile: PatientProfile = JSON.parse(storedProfileStr);
        if (storedProfile) {
          if (storedProfile.name) setProfileName(storedProfile.name);
          if (storedProfile.phone) {
            setProfilePhone(storedProfile.phone);
            setSearchPhone(storedProfile.phone);
          }
          if (storedProfile.age) setProfileAge(storedProfile.age);
          if (storedProfile.gender) setProfileGender(storedProfile.gender);
          if (storedProfile.defaultCondition) setProfileDefaultCondition(storedProfile.defaultCondition);
          if (storedProfile.notes) setProfileNotes(storedProfile.notes);
          if (storedProfile.patientPhoto || storedProfile.photoUrl) {
            setProfilePhoto(storedProfile.patientPhoto || storedProfile.photoUrl || '');
          }

          if (storedProfile.phone) {
            fetchPatientAppointments(storedProfile.phone);
          }
          return;
        }
      }

      // Fallback: check recent active booking
      const storedBookingStr = localStorage.getItem('bindsukh_active_booking');
      if (storedBookingStr) {
        const apt = JSON.parse(storedBookingStr) as PatientAppointment;
        if (apt && apt.patientPhone) {
          const cleanPhone = apt.patientPhone.replace(/\D/g, '').slice(-10);
          setProfilePhone(cleanPhone);
          setSearchPhone(cleanPhone);
          if (apt.patientName) setProfileName(apt.patientName);
          if (apt.condition) setProfileDefaultCondition(apt.condition);
          if (apt.patientPhoto) setProfilePhoto(apt.patientPhoto);
          setAppointments([apt]);
          setSearched(true);
          fetchPatientAppointments(cleanPhone);
        }
      } else if (initialPhone && initialPhone.length === 10) {
        setProfilePhone(initialPhone);
        setSearchPhone(initialPhone);
        fetchPatientAppointments(initialPhone);
      }
    } catch (e) {
      console.warn('[Profile] Error loading initial profile:', e);
    }
  }, [initialPhone]);

  // Fetch appointments for a given phone number
  const fetchPatientAppointments = async (phoneToQuery: string) => {
    const cleanPhone = phoneToQuery.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) return;

    try {
      setLoading(true);
      setSearched(true);
      const endpoint = getAbsoluteApiUrl(`/api/appointments?phone=${cleanPhone}`);
      const res = await fetch(endpoint);
      const parsed = await safeParseJsonResponse<PatientAppointment[]>(res);

      if (parsed.ok && parsed.data && parsed.data.length > 0) {
        setAppointments(parsed.data);
      } else {
        // Fallback check in local active booking or local list
        const localListStr = localStorage.getItem('bindsukh_local_appointments');
        if (localListStr) {
          const localList: PatientAppointment[] = JSON.parse(localListStr);
          const filtered = localList.filter(
            (a) => a.patientPhone && a.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone
          );
          if (filtered.length > 0) {
            setAppointments(filtered);
            return;
          }
        }

        const stored = localStorage.getItem('bindsukh_active_booking');
        if (stored) {
          const apt = JSON.parse(stored) as PatientAppointment;
          if (apt && apt.patientPhone && apt.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) {
            setAppointments([apt]);
            return;
          }
        }
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
      // Local storage fallback
      const stored = localStorage.getItem('bindsukh_active_booking');
      if (stored) {
        const apt = JSON.parse(stored) as PatientAppointment;
        if (apt && apt.patientPhone && apt.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) {
          setAppointments([apt]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Save Patient Profile to localStorage
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    const cleanPhone = profilePhone.replace(/\D/g, '').slice(-10);

    if (!profileName.trim()) {
      setProfileErrorMsg(
        language === 'hi'
          ? 'कृपया मरीज का नाम दर्ज करें!'
          : 'Please enter patient full name!'
      );
      return;
    }

    if (cleanPhone.length !== 10) {
      setProfileErrorMsg(
        language === 'hi'
          ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें!'
          : 'Please enter a valid 10-digit mobile number!'
      );
      return;
    }

    setIsSavingProfile(true);

    const profileData: PatientProfile = {
      name: profileName.trim(),
      phone: cleanPhone,
      age: profileAge.trim() || undefined,
      gender: profileGender || undefined,
      defaultCondition: profileDefaultCondition,
      notes: profileNotes.trim() || undefined,
      patientPhoto: profilePhoto || undefined,
      photoUrl: profilePhoto || undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('bindsukh_patient_profile', JSON.stringify(profileData));
      // Dispatch custom event so BookingForm auto-prefills immediately
      window.dispatchEvent(
        new CustomEvent('bindsukh_patient_profile_updated', { detail: profileData })
      );

      setProfileSuccessMsg(
        language === 'hi'
          ? 'प्रोफ़ाइल सफलतापूर्वक सुरक्षित हो गई! अब अपॉइंटमेंट फॉर्म में आपका नाम व फ़ोन अपने आप भर जाएगा।'
          : 'Profile saved successfully! Your details will now auto-fill when booking appointments.'
      );

      setSearchPhone(cleanPhone);
      fetchPatientAppointments(cleanPhone);
    } catch (err) {
      console.error('Failed to save profile to localStorage:', err);
      setProfileErrorMsg('Failed to save profile to local storage.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatientAppointments(searchPhone);
  };

  const handleCancelAppointment = async (id: string) => {
    if (
      !window.confirm(
        language === 'hi'
          ? 'क्या आप इस अपॉइंटमेंट टोकन को रद्द करना चाहते हैं?'
          : 'Are you sure you want to cancel this appointment slot?'
      )
    )
      return;

    try {
      setCancellingId(id);
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
        );
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadPdf = async (apt: PatientAppointment) => {
    setDownloadingPdfId(apt.id);
    try {
      await generateAppointmentReceiptPdf(apt, `apt-card-${apt.id}`);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDownloadImage = async (apt: PatientAppointment) => {
    setDownloadingImgId(apt.id);
    try {
      await downloadReceiptAsImage(apt, `apt-card-${apt.id}`);
    } catch (err) {
      console.error('Image download error:', err);
    } finally {
      setDownloadingImgId(null);
    }
  };

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'in-progress'
  );
  const completedAppointments = appointments.filter((a) => a.status === 'completed');
  const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled');

  return (
    <div id="patient-profile-dashboard-wrapper" className="space-y-6">
      {/* Top Banner */}
      <div className="liquid-glass-dark text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mb-1 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {language === 'hi'
              ? 'मरीज़ प्रोफ़ाइल व मेडिकल इतिहास'
              : 'Patient Profile & Medical History Portal'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif">
            {language === 'hi' ? 'मेरी प्रोफ़ाइल और अपॉइंटमेंट रिकॉर्ड' : 'My Profile & Appointments'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
            {language === 'hi'
              ? 'यहाँ अपनी व्यक्तिगत जानकारी सुरक्षित रखें, अपनी अपॉइंटमेंट पर्चियाँ डाउनलोड करें और नया अपॉइंटमेंट बुक करते समय विवरण स्वतः भरें।'
              : 'Manage your patient details, view appointment history, and download digital prescription slips with 1-click auto-fill.'}
          </p>

          {/* Dashboard Sub-Tabs Toggle */}
          <div className="pt-4 flex items-center gap-3 border-t border-white/15 relative z-10">
            <button
              type="button"
              onClick={() => setActiveDashboardTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'profile'
                  ? 'bg-amber-400 text-emerald-950 shadow-md font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{language === 'hi' ? 'मेरी प्रोफ़ाइल (My Profile)' : 'My Profile'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDashboardTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-amber-400 text-emerald-950 shadow-md font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>
                {language === 'hi'
                  ? `अपॉइंटमेंट इतिहास (${appointments.length})`
                  : `Appointment History (${appointments.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Top-Right Patient Photo Avatar Spot */}
        <div className="relative z-10 flex flex-col items-center justify-center shrink-0 self-start md:self-center bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md">
          <div className="relative group">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={profileName || 'Patient Photo'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-300 shadow-lg ring-4 ring-emerald-950/40"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-800 border-2 border-amber-300 flex items-center justify-center text-amber-300 shadow-lg font-bold font-serif text-xl">
                {profileName ? profileName.trim().charAt(0).toUpperCase() : <User className="w-8 h-8 text-amber-300" />}
              </div>
            )}
            <label
              htmlFor="top-banner-photo-input"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-md cursor-pointer hover:bg-amber-300 transition-transform active:scale-95"
              title="Upload / Change Photo"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <input
                id="top-banner-photo-input"
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          <span className="text-[11px] font-bold text-amber-300 mt-1.5 truncate max-w-[120px] text-center">
            {profileName || (language === 'hi' ? 'मरीज़ फोटो' : 'Patient Photo')}
          </span>
        </div>
      </div>

      {/* SUB-TAB 1: MY PROFILE FORM */}
      {activeSubTab === 'profile' && (
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shadow-xs border border-emerald-300">
                <UserCheck className="w-5 h-5 text-emerald-800 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  {language === 'hi' ? 'व्यक्तिगत जानकारी (Patient Profile)' : 'Personal Profile Information'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'यह विवरण आपके फोन में सुरक्षित रहेगा और नए अपॉइंटमेंट फॉर्म में स्वतः भरा जाएगा।'
                    : 'Stored securely on your device for instant auto-filling when booking clinic slots.'}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Local Storage Saved
            </span>
          </div>

          {/* Success Banner */}
          {profileSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-xs text-emerald-900 font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{profileSuccessMsg}</span>
                {onNavigateToBooking && (
                  <button
                    type="button"
                    onClick={onNavigateToBooking}
                    className="mt-2 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{language === 'hi' ? 'अभी स्लॉट बुक करें' : 'Proceed to Book Slot'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {profileErrorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* 1. Circular Avatar Photo Upload Placeholder */}
            <div className="bg-gradient-to-r from-emerald-50/70 via-slate-50 to-emerald-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-emerald-700/20 bg-emerald-900 flex items-center justify-center text-amber-300">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={profileName || 'Patient Photo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-amber-300">
                      {profileName ? (
                        <span className="text-3xl font-extrabold font-serif">
                          {profileName.trim().charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="w-12 h-12 stroke-[1.8]" />
                      )}
                    </div>
                  )}
                </div>

                <label
                  htmlFor="profile-photo-upload-input"
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-transform active:scale-95"
                  title="Upload Photo / कैमरा से फोटो लें"
                >
                  <Camera className="w-5 h-5 stroke-[2.5]" />
                  <input
                    id="profile-photo-upload-input"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-800" />
                    <span>{language === 'hi' ? 'मरीज़ फोटो अपलोड करें (Patient Profile Photo)' : 'Patient Profile Photo'}</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'hi'
                      ? 'कैमरा से फोटो खींचें या गैलरी से चुनें। यह फोटो डॉक्टर कंसोल व पर्ची में दिखाई देगी।'
                      : 'Take a photo or pick from gallery. Shown in Doctor Console & Booking records.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <label
                    htmlFor="profile-photo-upload-input"
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-300" />
                    <span>{profilePhoto ? (language === 'hi' ? 'फोटो बदलें' : 'Change Photo') : (language === 'hi' ? 'फोटो अपलोड करें' : 'Upload Photo')}</span>
                  </label>

                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 border border-rose-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>{language === 'hi' ? 'हटाएं' : 'Remove'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{language === 'hi' ? 'मरीज़ का पूरा नाम (Full Name) *' : 'Patient Full Name *'}</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar / रमेश कुमार"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{language === 'hi' ? '10-अंकीय मोबाइल नंबर *' : 'Mobile Phone Number *'}</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit phone number..."
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{language === 'hi' ? 'आयु (Age in years)' : 'Age (in years)'}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  placeholder="e.g. 42"
                  value={profileAge}
                  onChange={(e) => setProfileAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {language === 'hi' ? 'लिंग (Gender)' : 'Gender'}
                </label>
                <select
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                >
                  <option value="">{language === 'hi' ? '-- चुनें --' : '-- Select Gender --'}</option>
                  <option value="male">{language === 'hi' ? 'पुरुष (Male)' : 'Male'}</option>
                  <option value="female">{language === 'hi' ? 'महिला (Female)' : 'Female'}</option>
                  <option value="other">{language === 'hi' ? 'अन्य (Other)' : 'Other'}</option>
                </select>
              </div>
            </div>

            {/* Default Ailment / Condition Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-800" />
                <span>{language === 'hi' ? 'मुख्य बीमारी व दर्द समस्या (Default Primary Concern)' : 'Primary Health Concern / Pain Area'}</span>
              </label>
              <select
                value={profileDefaultCondition}
                onChange={(e) => setProfileDefaultCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                {CONDITIONS_TREATED.map((cond, idx) => (
                  <option key={idx} value={cond.name}>
                    {cond.name} ({cond.hindi})
                  </option>
                ))}
              </select>
            </div>

            {/* Default Health Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
                <span>{language === 'hi' ? 'स्वास्थ्य इतिहास व पूर्व बीमारी नोट्स' : 'Medical History Notes / Symptoms'}</span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  language === 'hi'
                    ? 'जैसे: पिछले 2 महीने से कमर में दर्द व नस दबने की समस्या...'
                    : 'e.g., L4-L5 slip disc pain for 3 months, MRI report available...'
                }
                value={profileNotes}
                onChange={(e) => setProfileNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-900/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>
                  {isSavingProfile
                    ? (language === 'hi' ? 'सुरक्षित हो रहा है...' : 'Saving Profile...')
                    : (language === 'hi' ? 'प्रोफ़ाइल सुरक्षित करें (Save Profile)' : 'Save Profile Details')}
                </span>
              </button>

              {onNavigateToBooking && (
                <button
                  type="button"
                  onClick={onNavigateToBooking}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-2xl text-sm transition-colors border border-amber-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-800" />
                  <span>{language === 'hi' ? 'अपॉइंटमेंट बुकिंग पर जाएं' : 'Go to Booking Form'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: CENTRALIZED APPOINTMENT HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Phone Search & Lookup Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-emerald-800" />
                </div>
                <input
                  id="dashboard-phone-search"
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number / 10 अंकों का मोबाइल नंबर..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm font-mono font-bold"
                />
              </div>
              <button
                id="track-appointments-btn"
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                {loading
                  ? 'Finding...'
                  : (language === 'hi' ? 'इतिहास खोजें (Search History)' : 'Find Appointments')}
              </button>
            </form>
          </div>

          {/* History Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Bookings
              </span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                {appointments.length}
              </span>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Upcoming Slots
              </span>
              <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">
                {upcomingAppointments.length}
              </span>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Completed Visits
              </span>
              <span className="text-xl font-black text-amber-950 font-mono mt-0.5 block">
                {completedAppointments.length}
              </span>
            </div>

            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                Cancelled
              </span>
              <span className="text-xl font-black text-rose-950 font-mono mt-0.5 block">
                {cancelledAppointments.length}
              </span>
            </div>
          </div>

          {/* Results List */}
          {searched && (
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {language === 'hi' ? 'कोई रिकॉर्ड नहीं मिला' : 'No Appointments Found'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {language === 'hi'
                      ? 'इस मोबाइल नंबर से कोई अपॉइंटमेंट नहीं मिला। कृपया नंबर जाँचें या नया समय स्लॉट बुक करें।'
                      : "We couldn't find any appointments linked to this mobile number. Please double check the number or book a new clinical session."}
                  </p>
                  {onNavigateToBooking && (
                    <button
                      type="button"
                      onClick={onNavigateToBooking}
                      className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Calendar className="w-4 h-4 text-amber-300" />
                      <span>{language === 'hi' ? 'नया अपॉइंटमेंट बुक करें' : 'Book New Session'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.map((apt) => {
                    const isCompleted = apt.status === 'completed';
                    const isInProgress = apt.status === 'in-progress';
                    const isCancelled = apt.status === 'cancelled';

                    return (
                      <div
                        key={apt.id}
                        id={`apt-card-${apt.id}`}
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 relative overflow-hidden transition-all hover:border-emerald-300"
                      >
                        {/* Status Top Strip */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-emerald-950 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                              {apt.tokenNumber}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isInProgress
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                  : isCancelled
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {apt.status === 'in-progress'
                                ? 'Session In Progress'
                                : apt.status}
                            </span>
                          </div>

                          <span className="text-sm font-black text-emerald-950 font-mono">
                            ₹{apt.fee}
                          </span>
                        </div>

                        {/* Patient & Therapy details */}
                        <div>
                          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>{apt.patientName}</span>
                            <span className="text-[10px] font-semibold text-slate-400 font-mono">
                              (+91 {apt.patientPhone})
                            </span>
                          </h4>
                          <div className="text-xs text-slate-700 font-medium mt-1 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>{apt.therapy}</span>
                          </div>
                          {apt.condition && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Concern:{' '}
                              <span className="text-slate-700 font-medium">{apt.condition}</span>
                            </div>
                          )}
                        </div>

                        {/* Time & Slot Box */}
                        <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1.5 border border-slate-200/80">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                            <span className="font-bold">{apt.appointmentDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                            <span className="font-bold font-mono">{apt.timeSlot}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/80">
                            Payment:{' '}
                            <span className="font-semibold text-slate-800">
                              {apt.paymentStatus === 'paid_online'
                                ? `✓ Paid Online via UPI (Ref: ${apt.upiReferenceNumber || 'Verified'})`
                                : apt.paymentStatus === 'collected_at_clinic'
                                ? '✓ Collected at Clinic'
                                : '⏳ Pay at Clinic Counter'}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions: 4 Quick Actions */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* 1. View Token Slip */}
                            <button
                              type="button"
                              onClick={() => onSelectReceipt(apt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              title="View styled digital token slip"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{language === 'hi' ? 'पर्चा देखें' : 'View Slip'}</span>
                            </button>

                            {/* 2. Download PDF Slip */}
                            <button
                              type="button"
                              disabled={downloadingPdfId === apt.id}
                              onClick={() => handleDownloadPdf(apt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                              title="Download official PDF receipt slip"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-300" />
                              <span>
                                {downloadingPdfId === apt.id
                                  ? (language === 'hi' ? 'PDF बन रहा है...' : 'PDF...')
                                  : (language === 'hi' ? 'PDF डाउनलोड' : 'PDF Slip')}
                              </span>
                            </button>

                            {/* 3. Download Image (Canvas Data URL for WebViews) */}
                            <button
                              type="button"
                              disabled={downloadingImgId === apt.id}
                              onClick={() => handleDownloadImage(apt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                              title="Download token slip as image for Android WebViews"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-950 stroke-[2.5]" />
                              <span>
                                {downloadingImgId === apt.id
                                  ? (language === 'hi' ? 'फोटो बन रहा है...' : 'Image...')
                                  : (language === 'hi' ? 'फोटो डाउनलोड' : 'Save Image')}
                              </span>
                            </button>

                            {/* 3. Add to Calendar */}
                            <button
                              type="button"
                              onClick={() => {
                                const ok = downloadCalendarIcsFile(apt);
                                if (ok) {
                                  setDownloadedIcsId(apt.id);
                                  setTimeout(() => setDownloadedIcsId(null), 3500);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              title="Download calendar reminder (.ics file)"
                            >
                              {downloadedIcsId === apt.id ? (
                                <>
                                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Saved!</span>
                                </>
                              ) : (
                                <>
                                  <CalendarPlus className="w-3.5 h-3.5 text-amber-700" />
                                  <span>.ics Calendar</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* 4. Cancel / Reschedule */}
                          {apt.status === 'scheduled' && (
                            <button
                              type="button"
                              disabled={cancellingId === apt.id}
                              onClick={() => handleCancelAppointment(apt.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                              title="Cancel or reschedule this slot"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Clinic Assistance Footer */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-emerald-950">
            {language === 'hi' ? 'सहायता या परामर्श की आवश्यकता है?' : 'Need Assistance or Emergency Consultation?'}
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Puramufti Purani Bazar, Prayagraj - Near Puramufti Panchayat Bhawan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`tel:${CLINIC_INFO.phones[0].replace(/\s+/g, '')}`}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Clinic</span>
          </a>
          <a
            href={`https://wa.me/${CLINIC_INFO.whatsapp}?text=${encodeURIComponent(
              'नमस्ते डॉ. सौरभ प्रजापति जी, मुझे बिंदसुख क्लिनिक में परामर्श व अपॉइंटमेंट चाहिए।'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
