export interface ClinicPhoto {
  id: string;
  category: 'doctor' | 'acupuncture_live' | 'office' | 'treatment_room' | 'therapy_bed' | 'diagnostic';
  imageUrl: string;
  
  // English Fields
  title: string;
  categoryLabel: string;
  description: string;
  highlights: string[];

  // Hindi Fields
  titleHindi: string;
  categoryLabelHindi: string;
  descriptionHindi: string;
  highlightsHindi: string[];

  // Hinglish Fields
  titleHinglish: string;
  categoryLabelHinglish: string;
  descriptionHinglish: string;
  highlightsHinglish: string[];
}

export const THERAPIST_REAL_PHOTO_URL = 'https://i.postimg.cc/5tR8Ypky/IMG-20260922-WA0016.jpg';

export const CLINIC_PHOTOS: ClinicPhoto[] = [
  {
    id: 'consultation-office-real',
    category: 'office',
    imageUrl: 'https://i.postimg.cc/qNk2g2NW/IMG-20261001-WA0048.jpg',
    
    // English
    title: "Therapist Saurabh Consultation Desk & Diagnosis Area",
    categoryLabel: "Consultation",
    description: "Actual consultation room where Therapist Saurabh Prajapati conducts meridian analysis and health counseling.",
    highlights: [
      'Personalized Diagnostic Setup',
      'Clinical Health Counseling',
      'Hygienic Examination Desk',
      'Puramufti Purani Bazar Location'
    ],

    // Hindi
    titleHindi: 'थेरेपिस्ट सौरभ परामर्श डेस्क एवं मरीज जांच क्षेत्र',
    categoryLabelHindi: 'परामर्श कक्ष',
    descriptionHindi: 'वास्तविक परामर्श कक्ष जहां थेरेपिस्ट सौरभ प्रजापति मेरिडियन विश्लेषण, स्वास्थ्य परीक्षण और परामर्श प्रदान करते हैं।',
    highlightsHindi: [
      'व्यक्तिगत निदान सेटअप',
      'क्लिनिकल स्वास्थ्य परामर्श',
      'स्वच्छ परीक्षण डेस्क',
      'पुरामुफ्ती पुरानी बाजार'
    ],

    // Hinglish
    titleHinglish: 'Therapist Saurabh Ka Consultation Desk Aur Diagnosis Area',
    categoryLabelHinglish: 'Consultation Room',
    descriptionHinglish: 'Real clinical consultation area jahan Therapist Saurabh Prajapati diagnostics aur counseling karte hain.',
    highlightsHinglish: [
      'Personalized Diagnosis Setup',
      'Clinical Health Counseling',
      'Clean Examination Desk',
      'Puramufti Purani Bazar'
    ]
  },
  {
    id: 'treatment-beds-1-real',
    category: 'acupuncture_live',
    imageUrl: 'https://i.postimg.cc/bZz1d1ZK/IMG-20261001-WA0052.jpg',
    
    // English
    title: "Main Treatment Room & Acupuncture Beds (View 1)",
    categoryLabel: "Live Treatment",
    description: "Sterilized bed setup for patient safety, spine alignment, and acupuncture therapy.",
    highlights: [
      'Strict Hygiene Standards',
      'Ergonomic Therapy Cushions',
      'Anatomical Alignment Support',
      'Comfortable Patient Spacing'
    ],

    // Hindi
    titleHindi: 'मुख्य उपचार कक्ष एवं एक्यूपंक्चर बेड सेटअप (दृश्य 1)',
    categoryLabelHindi: 'चालू उपचार',
    descriptionHindi: 'मरीजों के आराम और सुरक्षा के लिए पूर्णतः स्टरलाइज्ड बेड सेटअप, जहां रीढ़ संरेखण और एक्यूपंक्चर किया जाता है।',
    highlightsHindi: [
      'सख्त स्वच्छता मानक',
      'आरामदायक थेरेपी कुशन',
      'शारीरिक संरेखण समर्थन',
      'उचित मरीज दूरी'
    ],

    // Hinglish
    titleHinglish: 'Main Treatment Room Aur Acupuncture Beds (View 1)',
    categoryLabelHinglish: 'Live Treatment',
    descriptionHinglish: 'Safi-safai ke sath sanitized beds jo patient safety aur spine alignment ke liye behtar hain.',
    highlightsHinglish: [
      'Strict Hygiene Standards',
      'Ergonomic Therapy Cushions',
      'Anatomical Alignment',
      'Comfortable Patient Spacing'
    ]
  },
  {
    id: 'treatment-beds-2-real',
    category: 'treatment_room',
    imageUrl: 'https://i.postimg.cc/Js1jtjsY/IMG-20261001-WA0056.jpg',
    
    // English
    title: "Main Treatment Room Therapy Stations (View 2)",
    categoryLabel: "Treatment Room",
    description: "Alternate view of Bindsukh Center treatment stations, equipped with anatomical guides and physical therapy supports.",
    highlights: [
      'Clean & Sanitized Beds',
      'Anatomical Poster Guides',
      'Calm Healing Environment',
      'Professional Care Monitoring'
    ],

    // Hindi
    titleHindi: 'मुख्य उपचार कक्ष थेरेपी स्टेशन्स (दृश्य 2)',
    categoryLabelHindi: 'उपचार कक्ष',
    descriptionHindi: 'बिंदसुख सेंटर के मुख्य उपचार कक्ष का दूसरा पहलू, जहां मरीज सुरक्षित और शांतिपूर्ण वातावरण में थेरेपी प्राप्त करते हैं।',
    highlightsHindi: [
      'साफ और स्वच्छ बेड',
      'एनाटॉमी पोस्टर गाइड',
      'शांत हीलिंग वातावरण',
      'पेशेवर निगरानी'
    ],

    // Hinglish
    titleHinglish: 'Main Treatment Room Therapy Stations (View 2)',
    categoryLabelHinglish: 'Treatment Room',
    descriptionHinglish: 'Bindsukh Center ke treatment stations ki ek aur view, safe aur clean environment ke sath.',
    highlightsHinglish: [
      'Clean & Sanitized Beds',
      'Anatomical Poster Guides',
      'Calm Healing Environment',
      'Professional Care Monitoring'
    ]
  },
  {
    id: 'electrotherapy-tools-real',
    category: 'acupuncture_live',
    imageUrl: 'https://i.postimg.cc/RN1cMgZp/IMG-20261001-WA0057.jpg',
    
    // English
    title: "Electrotherapy Equipment & Clinical Treatment Tools Rack",
    categoryLabel: "Therapeutic Equipment",
    description: "Modern clinical equipment rack including sterile disposable acupuncture needles, magnetic stimulators, and therapeutic tools.",
    highlights: [
      'Sterile Single-Use Needles',
      'Nerve Stimulation Equipment',
      'Advanced Therapeutic Tools',
      'Hygienic Safe Storage'
    ],

    // Hindi
    titleHindi: 'इलेक्ट्रोथेरेपी उपकरण एवं उपचार सहायक टूल्स रैक',
    categoryLabelHindi: 'आधुनिक उपकरण',
    descriptionHindi: 'आधुनिक इलेक्ट्रोथेरेपी मशीनें, मैग्नेटिक स्टिमुलेटर और स्टरलाइज्ड नीडल्स का रैक, जो लकवा एवं नसों के इलाज को तेज करता है।',
    highlightsHindi: [
      'स्टरलाइज्ड सिंगल-यूज़ सुइयां',
      'नर्व स्टिमुलेशन उपकरण',
      'उन्नत चिकित्सा उपकरण',
      'सुरक्षित स्वच्छ भंडारण'
    ],

    // Hinglish
    titleHinglish: 'Electrotherapy Equipment Aur Treatment Tools Rack',
    categoryLabelHinglish: 'Therapy Equipment',
    descriptionHinglish: 'Modern equipment rack jisme disposable needles aur magnetic stimulators rakhe hain.',
    highlightsHinglish: [
      'Sterile Disposable Needles',
      'Nerve Stimulation Equipments',
      'Advanced Therapy Tools',
      'Safe Hygienic Storage'
    ]
  },
  {
    id: 'rehab-exercise-real',
    category: 'therapy_bed',
    imageUrl: 'https://i.postimg.cc/qzc8k1vm/IMG-20261001-WA0061.jpg',
    
    // English
    title: "Exercise Therapy & Physical Rehabilitation Area",
    categoryLabel: "Rehabilitation",
    description: "Post-acupressure mobility rehabilitation setup featuring wellness tools and clinical exercise aids to restore joint flexibility.",
    highlights: [
      'Joint Mobility Exercises',
      'Assisted Rehabilitation Aids',
      'Post-Therapy Wellness Practice',
      'Custom Patient Training'
    ],

    // Hindi
    titleHindi: 'व्यायाम चिकित्सा एवं शारीरिक पुनर्वास क्षेत्र',
    categoryLabelHindi: 'पुनर्वास सेटअप',
    descriptionHindi: 'जोड़ों के मूवमेंट, लकवा ग्रस्त अंगों के अभ्यास और शारीरिक लचीलेपन को वापस लाने के लिए समर्पित पुनर्वास क्षेत्र।',
    highlightsHindi: [
      'जोड़ों के मूवमेंट व्यायाम',
      'सहायक पुनर्वास उपकरण',
      'थेरेपी के बाद अभ्यास',
      'अनुकूलित मरीज प्रशिक्षण'
    ],

    // Hinglish
    titleHinglish: 'Exercise Therapy Aur Rehabilitation Area',
    categoryLabelHinglish: 'Rehabilitation',
    descriptionHinglish: 'Joint movement aur paralysis rehabilitation ke liye dedicated exercise area.',
    highlightsHinglish: [
      'Joint Mobility Exercises',
      'Rehab Training Aids',
      'Post-Therapy Practice',
      'Custom Patient Training'
    ]
  },
  {
    id: 'private-therapy-bed-real',
    category: 'acupuncture_live',
    imageUrl: 'https://i.postimg.cc/w75h6wj2/IMG-20261001-WA0062.jpg',
    
    // English
    title: "Private Therapy Bed & Decompression Zone",
    categoryLabel: "Private Therapy Bed",
    description: "Chiropractic adjustment bed and acupressure decompression zone designed for focused manual alignment sessions.",
    highlights: [
      'Chiropractic Adjustments',
      'Focused Spine Decompression',
      'Sanitized Linen & Pillows',
      'Individualized Therapy Attention'
    ],

    // Hindi
    titleHindi: 'निजी थेरेपी बेड एवं डीकंप्रेशन क्षेत्र',
    categoryLabelHindi: 'निजी बेड',
    descriptionHindi: 'कमर दर्द, स्लिप डिस्क और रीढ़ की हड्डी के स्पाइनल अलाइनमेंट के लिए विशेष काइरोप्रैक्टिक एवं डीकंप्रेशन बेड।',
    highlightsHindi: [
      'काइरोप्रैक्टिक समायोजन',
      'स्पाइन डीकंप्रेशन',
      'स्वच्छ लिनेन और तकिए',
      'व्यक्तिगत थेरेपी ध्यान'
    ],

    // Hinglish
    titleHinglish: 'Private Therapy Bed Aur Decompression Zone',
    categoryLabelHinglish: 'Private Therapy Bed',
    descriptionHinglish: 'Kamar dard aur spinal alignment ke liye special chiropractic bed zone.',
    highlightsHinglish: [
      'Chiropractic Adjustments',
      'Spine Decompression',
      'Sanitized Linen & Pillows',
      'Personal Therapy Care'
    ]
  },
  {
    id: 'treatment-room-overview-real',
    category: 'treatment_room',
    imageUrl: 'https://i.postimg.cc/9rPGWLQJ/IMG-20261001-WA0063.jpg',
    
    // English
    title: "Full Treatment Room Overview & Patient Ward",
    categoryLabel: "Full Ward",
    description: "Comprehensive view of the spacious, airy, and well-lit treatment room designed to accommodate multiple slot appointments with maximum safety.",
    highlights: [
      'Spacious & Well-Ventilated',
      'Bright Natural Lighting',
      'Professional Clinical Cleanliness',
      'Safe Multi-Bed Facility'
    ],

    // Hindi
    titleHindi: 'पूर्ण उपचार कक्ष विहंगम दृश्य एवं मरीज वार्ड',
    categoryLabelHindi: 'संपूर्ण दृश्य',
    descriptionHindi: 'बिंदसुख सेंटर के मुख्य विशाल और स्वच्छ हॉल का संपूर्ण दृश्य, जहां अधिकतम सुरक्षा व दूरी के साथ उपचार किया जाता है।',
    highlightsHindi: [
      'विशाल और हवादार कक्ष',
      'प्राकृतिक रोशनी',
      'पेशेवर स्वच्छता',
      'सुरक्षित मल्टी-बेड सुविधा'
    ],

    // Hinglish
    titleHinglish: 'Full Treatment Room Overview Aur Patient Ward',
    categoryLabelHinglish: 'Full Ward',
    descriptionHinglish: 'Spacious aur bright treatment room ka full overview jisme multiple beds safety ke sath rakhe hain.',
    highlightsHinglish: [
      'Spacious & Ventilated',
      'Bright Natural Lighting',
      'Professional Clinical Cleanliness',
      'Safe Multi-Bed Facility'
    ]
  }
];

export const GOOGLE_BUSINESS_INFO = {
  clinicName: 'Bindsukh Acupressure Acupuncture Centre',
  hindiName: 'बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर',
  rating: 5.0,
  reviewCount: 132,
  address: 'PURAMUFTI, PURANI BAZAR, Prayagraj, Uttar Pradesh 212208',
  landmark: 'Near Puramufti Panchayat Bhawan, Tikri Uparhar',
  googleMapsUrl: 'https://maps.google.com/?q=Bindsukh+Acupressure+Acupuncture+Centre+Puramufti+Prayagraj',
  status: 'Open Now • खुला है',
  category: 'Acupuncture clinic in Tikri Uparhar, Uttar Pradesh'
};
