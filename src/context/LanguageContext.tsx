import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'hi' | 'en' | 'hinglish';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  hi: {
    // Top Bar & Navigation
    'brandSubtitle': 'प्रयागराज • हीलिंग थ्रू टच एंड मैग्नेट',
    'all': 'सभी (All)',
    'bookSlot': 'अपॉइंटमेंट बुक (Book)',
    'photos': 'क्लिनिक फोटो (Photos)',
    'feedback': 'फीडबैक (+ Feedback)',
    'slip': 'मेरी रसीद (My Slip)',
    'therapies': 'प्राकृतिक थैरेपी (Therapies)',
    'doctor': 'थेरेपिस्ट सौरभ (Doctor)',
    'maps': 'क्लिनिक मैप व रास्ता (Maps)',
    'admin': 'डॉक्टर लॉगिन (Login)',
    'console': 'डॉक्टर कंसोल (Admin)',
    'phoneHelp': 'फोन हेल्प (Phone Help)',
    'helpShare': 'सहायता व शेयर (Help & Share)',
    'register': 'रजिस्टर करें',
    'directInstall': '⚡ डायरेक्ट ऐप इंस्टॉल करें (1-Click)',
    
    // Hero Banner
    'heroTagline': 'हीलिंग थ्रू टच एंड मैग्नेट (Healing Through Touch & Magnet)',
    'heroTitle': 'Bindsukh Acupressure & Acupuncture Center',
    'heroSubtitle': 'बिंदसुख प्राकृतिक चिकित्सा केंद्र • प्रयागराज | सभी सामान्य लोगों एवं परिवारों के लिए बिना दवा और बिना इंजेक्शन दर्द निवारण',
    'leadSpecialist': 'Lead Clinical Specialist • मुख्य चिकित्सक',
    'specialistBio': 'नस, रीढ़ की हड्डी, साइटिका, कमर और गर्दन दर्द का बिना ऑपरेशन व प्राकृतिक पद्धति से स्थाई समाधान।',
    'firstVisitRate': 'पहली बार ₹500 | दोबारा ₹200',
    'firstVisitTitle': '1st Visit / Returning',
    'dedicatedCare': 'हर घंटे सिर्फ 5 मरीज • नो भीड़',
    'dedicatedCareTitle': 'Dedicated Care',
    'drugless': 'बिना दवा • बिना साइड इफेक्ट',
    'druglessTitle': '100% Drugless Holistic',
    'bookNowBtn': 'Book Appointment Now (अपॉइंटमेंट बुक करें)',
    'viewPhotosBtn': 'Clinic & Therapy Photos (क्लिनिक व लाइव फोटो)',
    'callBtn': 'Call +91 9455100097',
    'conditionsHeader': 'Specialized Conditions Treated',
    'reliefBadge': 'दर्दों से स्थाई राहत',
    'operatingHoursHeader': 'Operating Hours (क्लिनिक समय):',
    'monSat': 'सोमवार - शनिवार:',
    'sunMorning': 'रविवार सुबह:',
    'clinicAddressHeader': 'क्लिनिक का पता (Clinic Address):',
    
    // Booking Form
    'bookingTitle': 'Book Clinical Appointment & Token',
    'bookingSubtitle': 'प्रत्येक 1-घंटे के स्लॉट में अधिकतम 5 मरीज • व्यक्तिगत ध्यान एवं कोई भीड़ नहीं',
    'step1Title': '1. मरीज का नाम व फोन नंबर',
    'step2Title': '2. तारीख व 1-घंटे का स्लॉट चुनें',
    'step3Title': '3. थैरेपी व समस्या का चयन',
    'step4Title': '4. परामर्श शुल्क एवं भुगतान विकल्प',
    'patientNameLabel': 'Patient Full Name (मरीज का पूरा नाम)',
    'patientPhoneLabel': 'Phone Number (मोबाइल नंबर)',
    'appointmentDateLabel': 'Appointment Date (तारीख)',
    'selectSlotLabel': 'Select 1-Hour Time Slot (1-घंटे का स्लॉट चुनें)',
    'selectTherapyLabel': 'Select Holistic Therapy (प्राकृतिक थैरेपी चुनें)',
    'selectConditionLabel': 'Primary Condition / Complaint (मुख्य समस्या / दर्द)',
    'healthNotesLabel': 'Specific Health Notes / Symptoms (समस्या का विवरण - ऐच्छिक)',
    'confirmBookingBtn': 'Confirm Appointment & Generate Token (अपॉइंटमेंट बुक करें)',
    'directInstallModalBtn': '⚡ Direct Install App (1-Click)',
    'directInstallModalSub': 'एक क्लिक में ऐप सीधे फोन स्क्रीन पर इंस्टॉल करें',

    // Chatbot
    'chatTitle': 'Bindsukh AI Assistant',
    'chatSubtitle': 'पूछें या बोलें (Ask AI)',
    'chatInputPlaceholder': 'अपनी समस्या लिखें या माइक दबाकर बोलें...',
    'chatListening': 'आपकी आवाज़ सुन रहे हैं... (Listening in हिंदी)',
    'chatStop': 'रोकें (Stop)',
    'chatSend': 'भेजें',
    'chatWelcome': `नमस्ते! 🙏 मैं बिंदसुख स्वास्थ्य सहायक (Bindsukh Care Assistant) हूँ।

हमारे मुख्य विशेषज्ञ **थेरेपिस्ट सौरभ प्रजापति** द्वारा बिना दवा और बिना इंजेक्शन प्राकृतिक पद्धतियों (एक्यूप्रेशर, एक्यूपंक्चर, काइरोप्रैक्टिक) से लकवा, साइटिका, मोच-हड्डी की समस्या, शरीर में दबी नस, सीपी चाइल्ड व पुराने दर्दों का उपचार किया जाता है।

आप मुझसे परामर्श शुल्क, समय, उपचार के प्रकार या अपॉइंटमेंट के बारे में कोई भी प्रश्न पूछ सकते हैं या नीचे माइक 🎙️ दबाकर बोल सकते हैं!`,

    // New Conditions
    'cond_sprain': 'मोच एवं हड्डी से सम्बंधित समस्याओं का समाधान',
    'cond_nerve': 'शरीर में कहीं भी नस का दबना (नसों की ब्लॉकेज)',
    'cond_cpchild': 'सीपी चाइल्ड (CP Child) एवं जन्म से बच्चों के न चल पाने का इलाज'
  },

  en: {
    // Top Bar & Navigation
    'brandSubtitle': 'Prayagraj • Healing Through Touch & Magnet',
    'all': 'All Overview',
    'bookSlot': 'Book Slot',
    'photos': 'Clinic Photos',
    'feedback': '+ Feedback',
    'slip': 'My Slip / Receipt',
    'therapies': 'Holistic Therapies',
    'doctor': 'Therapist Saurabh',
    'maps': 'Clinic Map & Directions',
    'admin': 'Doctor Login',
    'console': 'Doctor Console',
    'phoneHelp': 'Phone Help',
    'helpShare': 'Help & Share',
    'register': 'Quick Register',
    'directInstall': '⚡ Direct Install App (1-Click)',
    
    // Hero Banner
    'heroTagline': 'Healing Through Touch & Magnet (100% Drugless)',
    'heroTitle': 'Bindsukh Acupressure & Acupuncture Center',
    'heroSubtitle': 'Bindsukh Holistic Health Center • Prayagraj | 100% Drugless & Non-Surgical Pain Relief for Families',
    'leadSpecialist': 'Lead Clinical Specialist',
    'specialistBio': 'Permanent non-surgical holistic relief for pinched nerves, spinal alignment, sciatica, back & neck pain.',
    'firstVisitRate': '1st Visit ₹500 | Follow-up ₹200',
    'firstVisitTitle': '1st Visit / Returning',
    'dedicatedCare': 'Max 5 Patients / Hour • No Rush',
    'dedicatedCareTitle': 'Dedicated Attention',
    'drugless': '100% Drugless • Zero Side Effects',
    'druglessTitle': 'Holistic Medicine',
    'bookNowBtn': 'Book Appointment Now',
    'viewPhotosBtn': 'Clinic & Therapy Photos',
    'callBtn': 'Call +91 9455100097',
    'conditionsHeader': 'Specialized Conditions Treated',
    'reliefBadge': 'Natural Pain Relief',
    'operatingHoursHeader': 'Operating Hours:',
    'monSat': 'Monday - Saturday:',
    'sunMorning': 'Sunday Morning:',
    'clinicAddressHeader': 'Clinic Address:',
    
    // Booking Form
    'bookingTitle': 'Book Clinical Appointment & Token',
    'bookingSubtitle': 'Strict maximum of 5 patients per 1-hour slot • Dedicated care and zero crowding',
    'step1Title': '1. Patient Name & Contact',
    'step2Title': '2. Select Date & 1-Hour Time Slot',
    'step3Title': '3. Select Therapy & Primary Condition',
    'step4Title': '4. Consultation Fee & Payment Method',
    'patientNameLabel': 'Patient Full Name',
    'patientPhoneLabel': 'Mobile Phone Number',
    'appointmentDateLabel': 'Appointment Date',
    'selectSlotLabel': 'Select 1-Hour Time Slot',
    'selectTherapyLabel': 'Select Holistic Therapy',
    'selectConditionLabel': 'Primary Condition / Complaint',
    'healthNotesLabel': 'Specific Health Notes / Symptoms (Optional)',
    'confirmBookingBtn': 'Confirm Appointment & Generate Token',
    'directInstallModalBtn': '⚡ Direct Install App (1-Click)',
    'directInstallModalSub': 'Install app directly on your phone home screen in 1 tap',

    // Chatbot
    'chatTitle': 'Bindsukh AI Assistant',
    'chatSubtitle': 'Ask or Speak (Ask AI)',
    'chatInputPlaceholder': 'Type your question or tap mic to speak...',
    'chatListening': 'Listening to your voice... (English)',
    'chatStop': 'Stop',
    'chatSend': 'Send',
    'chatWelcome': `Namaste! 🙏 I am the Bindsukh Care Assistant.

Under our lead clinical specialist **THERAPIST: SAURABH PRAJAPATI**, we offer 100% drugless and injection-free natural healing (Acupressure, Acupuncture, Chiropractic) for Paralysis, Sciatica, Sprains & Bone care, Pinched Nerves, Cerebral Palsy (CP Child), and chronic pains.

Feel free to ask me anything about fees, timings, therapies, or tap the mic 🎙️ below to speak directly!`,

    // New Conditions
    'cond_sprain': 'Sprain & Bone Related Issues Treatment',
    'cond_nerve': 'Pinched Nerve & Nerve Compression Relief',
    'cond_cpchild': 'Cerebral Palsy (CP Child) & Delayed Walking Therapy'
  },

  hinglish: {
    // Top Bar & Navigation
    'brandSubtitle': 'Prayagraj • Touch & Magnet Se Natural Healing',
    'all': 'Sabhi Overview',
    'bookSlot': 'Book Karein',
    'photos': 'Clinic Photos',
    'feedback': '+ Feedback Dein',
    'slip': 'Meri Receipt (Parcha)',
    'therapies': 'Natural Therapies',
    'doctor': 'Dr. Saurabh Prajapati',
    'maps': 'Clinic Ka Rasta (Maps)',
    'admin': 'Doctor Login',
    'console': 'Doctor Console',
    'phoneHelp': 'Phone Help',
    'helpShare': 'Help & Share',
    'register': 'Register Karein',
    'directInstall': '⚡ Direct Install App (1-Click)',
    
    // Hero Banner
    'heroTagline': 'Touch Aur Magnet Se Natural Healing (100% Bina Dawa)',
    'heroTitle': 'Bindsukh Acupressure & Acupuncture Center',
    'heroSubtitle': 'Bindsukh Natural Center • Prayagraj | Bina Dawa, Bina Injection Dard Nivaran Sabhi Parivaro Ke Liye',
    'leadSpecialist': 'Lead Specialist • Mukhya Chikitsak',
    'specialistBio': 'Nas dabna, reedh ki haddi, sciatica, kamar aur gardan dard ka bina operation permanent ilaj.',
    'firstVisitRate': 'Pehli Baar ₹500 | Dobara ₹200',
    'firstVisitTitle': '1st Visit / Returning',
    'dedicatedCare': 'Har Ghante 5 Mareez • No Bheed',
    'dedicatedCareTitle': 'Personal Care',
    'drugless': 'Bina Dawa • No Side Effects',
    'druglessTitle': '100% Natural Healing',
    'bookNowBtn': 'Appointment Book Karein',
    'viewPhotosBtn': 'Clinic & Live Photos Dekhein',
    'callBtn': 'Call Karein: +91 9455100097',
    'conditionsHeader': 'In Sabhi Bimariyo Ka Pakka Ilaj',
    'reliefBadge': 'Bina Operation Aaram',
    'operatingHoursHeader': 'Clinic Khulne Ka Samay (Timings):',
    'monSat': 'Somwar se Shanivar:',
    'sunMorning': 'Ravivar Subah:',
    'clinicAddressHeader': 'Clinic Ka Pata (Address):',
    
    // Booking Form
    'bookingTitle': 'Online Appointment Aur Token Book Karein',
    'bookingSubtitle': 'Har 1 ghante ke slot me sirf 5 mareez • Dedicated treatment aur no crowd',
    'step1Title': '1. Patient Ka Naam Aur Phone Number',
    'step2Title': '2. Date Aur 1-Ghante Ka Slot Chunein',
    'step3Title': '3. Therapy Aur Problem Ka Selection',
    'step4Title': '4. Fees Aur Payment Ka Option',
    'patientNameLabel': 'Patient Ka Pura Naam (Full Name)',
    'patientPhoneLabel': 'Mobile Phone Number',
    'appointmentDateLabel': 'Appointment Ki Date',
    'selectSlotLabel': '1-Ghante Ka Time Slot Chunein',
    'selectTherapyLabel': 'Natural Therapy Chunein',
    'selectConditionLabel': 'Khas Samasya / Problem (Condition)',
    'healthNotesLabel': 'Apni Samasya Ke Baare Me Batayein (Optional)',
    'confirmBookingBtn': 'Appointment Confirm Karein & Token Lein',
    'directInstallModalBtn': '⚡ Direct Install App (1-Click)',
    'directInstallModalSub': '1-click me app seedhe phone screen par install karein',

    // Chatbot
    'chatTitle': 'Bindsukh AI Assistant',
    'chatSubtitle': 'Poochhein Ya Bolein (Ask AI)',
    'chatInputPlaceholder': 'Apni samasya likhein ya mic se bolein...',
    'chatListening': 'Aapki aawaz sun rahe hain... (Hinglish)',
    'chatStop': 'Rokein (Stop)',
    'chatSend': 'Bhejein',
    'chatWelcome': `Namaste! 🙏 Main Bindsukh Health Assistant hoon.

Humare specialist **Dr. Saurabh Prajapati** bina dawa aur bina injection natural tarike (Acupressure, Acupuncture, Chiropractic) se Lakwa, Sciatica, Moch-Haddi Ki Samasya, Dabi Hui Nas, CP Child aur chronic pain ka ilaj karte hain.

Aap mujhse fees, timings ya appointment ke baare me poochh sakte hain ya niche mic 🎙️ se bol sakte hain!`,

    // New Conditions
    'cond_sprain': 'Moch Aur Haddi Ki Samasya Ka Samadhan',
    'cond_nerve': 'Sharir Me Kahin Bhi Nas Dabna Ya Nerve Blockage',
    'cond_cpchild': 'CP Child Aur Janam Se Bachhon Ke Na Chal Pane Ka Ilaj'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bindsukh_language') as AppLanguage;
      if (saved && (saved === 'hi' || saved === 'en' || saved === 'hinglish')) {
        return saved;
      }
    }
    return 'hi';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bindsukh_language', lang);
    }
  };

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS['hi']?.[key] ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
