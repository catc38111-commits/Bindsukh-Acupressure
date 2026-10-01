export const CLINIC_INFO = {
  name: 'Bindsukh Acupressure & Acupuncture Center',
  taglineHindi: 'हीलिंग थ्रू टच एंड मैग्नेट',
  taglineEnglish: 'Healing Through Touch & Magnet',
  leadPractitioner: 'THERAPIST: SAURABH PRAJAPATI',
  qualifications: 'Master in Acupressure, Master Diploma in Acupuncture, Diploma in Chiropractic',
  address: 'Puramufti Purani Bazar, Prayagraj - Near Puramufti Panchayat Bhawan',
  phones: ['+91 9455100097', '+91 8423221799'],
  whatsapp: '+919455100097',
  email: 'kumarsaurabh1608@gmail.com',
  instagram: '@bindsukhacucenter',
  instagramUrl: 'https://instagram.com/bindsukhacucenter',
  upiId: '9455110097@upi',
  merchantName: 'Bindsukh Acupressure Acupuncture Center',
  maxSlotCapacity: 5,
  fees: {
    firstVisit: 500,
    returningPatient: 200,
  }
};

export const SERVICES_OFFERED = [
  {
    id: 'acupressure',
    name: 'Acupressure Therapy',
    hindi: 'एक्यूप्रेशर थेरेपी',
    description: 'Targeted pressure point stimulation using precise manual touch and therapeutic magnets to balance energy meridians.',
    iconName: 'Fingerprint',
    imageUrl: '/images/acupuncture-hands-pressure.jpg',
  },
  {
    id: 'acupuncture',
    name: 'Acupuncture Therapy',
    hindi: 'एक्यूपंक्चर थेरेपी',
    description: 'Sterile ultra-fine needle placement on anatomical meridian points to stimulate nerve pathways and self-healing.',
    iconName: 'Sparkles',
    imageUrl: '/images/acupuncture-live-treatment.jpg',
  },
  {
    id: 'chiropractic',
    name: 'Chiropractic Adjustment',
    hindi: 'काइरोप्रैक्टिक स्पाइनल एडजस्टमेंट',
    description: 'Expert spinal and musculoskeletal joint manipulation to restore alignment, alleviate nerve compression, and improve posture.',
    iconName: 'Activity',
    imageUrl: '/images/therapy-couch.jpg',
  },
  {
    id: 'cupping',
    name: 'Cupping Therapy',
    hindi: 'कपिंग (हिजामा / ड्राई कपिंग) थेरेपी',
    description: 'Decompression vacuum cup application to increase localized blood circulation, release myofascial tension, and detoxify.',
    iconName: 'CircleDot',
    imageUrl: '/images/acupuncture-back-spine.jpg',
  },
  {
    id: 'kinesiology_tape',
    name: 'Kinesiology Tape',
    hindi: 'काइनेसियोलॉजी टेपिंग',
    description: 'Elastic therapeutic tape application providing structural joint stability, muscular support, and lymphatic drainage.',
    iconName: 'Bandage',
    imageUrl: '/images/acupuncture-knee-joints.jpg',
  },
  {
    id: 'massage_therapy',
    name: 'Acupressure Massage Therapy',
    hindi: 'एक्यूप्रेशर मसाज थेरेपी',
    description: 'Deep therapeutic soft tissue and meridian massage to dissolve chronic muscle knots and promote systemic relaxation.',
    iconName: 'HeartHandshake',
    imageUrl: '/images/acupuncture-needles-meridian.jpg',
  },
];

export interface ConditionTreated {
  name: string;
  hindi: string;
  hinglish: string;
  severity: 'High' | 'Medium' | 'Low';
}

export const CONDITIONS_TREATED: ConditionTreated[] = [
  // 3 New Specialized Clinical Categories from Doctor's Notes
  {
    name: 'Sprain & Bone Related Issues Treatment',
    hindi: 'मोच एवं हड्डी से सम्बंधित समस्याओं का समाधान',
    hinglish: 'Moch Aur Haddi Ki Samasya Ka Samadhan',
    severity: 'High'
  },
  {
    name: 'Pinched Nerve & Nerve Compression Relief',
    hindi: 'शरीर में कहीं भी नस का दबना (नसों की ब्लॉकेज)',
    hinglish: 'Sharir Me Kahin Bhi Nas Dabna Ya Nerve Blockage',
    severity: 'High'
  },
  {
    name: 'Cerebral Palsy (CP Child) & Delayed Walking Therapy',
    hindi: 'सीपी चाइल्ड (CP Child) एवं जन्म से बच्चों के न चल पाने का इलाज',
    hinglish: 'CP Child Aur Janam Se Bachhon Ke Na Chal Pane Ka Ilaj',
    severity: 'High'
  },

  // Core Chronic Ailments
  {
    name: 'Paralysis & Stroke Care',
    hindi: 'लकवा / पक्षाघात',
    hinglish: 'Lakwa Aur Stroke Ka Ilaj',
    severity: 'High'
  },
  {
    name: 'Sciatica Nerve Pain Relief',
    hindi: 'साईटिका / नसों का खिंचाव',
    hinglish: 'Sciatica Aur Nas Khinchav Ka Ilaj',
    severity: 'High'
  },
  {
    name: 'Cervical Spondylosis & Neck Pain',
    hindi: 'सर्वाइकल स्पोंडिलाइटिस व गर्दन दर्द',
    hinglish: 'Cervical Aur Gardan Dard Ka Ilaj',
    severity: 'Medium'
  },
  {
    name: 'Lower Back Pain & Slip Disc',
    hindi: 'कमर / रीढ़ दर्द व स्लिप डिस्क (Back Pain)',
    hinglish: 'Kamar Dard Aur Slip Disc Ka Ilaj',
    severity: 'Medium'
  },
  {
    name: 'Arthritis & Knee Joint Pain',
    hindi: 'गठिया / घुटनों का दर्द',
    hinglish: 'Gathiya Aur Ghutno Ke Dard Ka Ilaj',
    severity: 'Medium'
  },
  {
    name: 'Chronic Constipation & Digestion',
    hindi: 'क्रोनिक कब्ज (Constipation)',
    hinglish: 'Purani Kabz Ka Natural Ilaj',
    severity: 'Low'
  },
  {
    name: 'Frozen Shoulder & Arm Stiffness',
    hindi: 'फ्रोजन शोल्डर / कंधे की जकड़न',
    hinglish: 'Frozen Shoulder Aur Kandhe Ki Jakdan',
    severity: 'Medium'
  },
  {
    name: 'Kidney Stones Natural Care',
    hindi: 'गुर्दे की पथरी (Kidney Stones)',
    hinglish: 'Gurde Ki Pathri (Kidney Stone)',
    severity: 'High'
  },
  {
    name: 'Headache & Chronic Migraine',
    hindi: 'माइग्रेन / पुराना सिरदर्द',
    hinglish: 'Migraine Aur Purana Sirdard',
    severity: 'Low'
  },
];

export const WEEKDAY_SLOTS = [
  '08:30 AM - 09:30 AM',
  '09:30 AM - 10:30 AM',
  '10:30 AM - 11:30 AM',
  '11:30 AM - 12:30 PM',
  '12:30 PM - 01:30 PM',
  '01:30 PM - 02:30 PM',
  '02:30 PM - 03:30 PM',
  '03:00 PM - 04:00 PM',
];

export const SUNDAY_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
];

export function getSlotsForDate(dateStr: string): string[] {
  if (!dateStr) return WEEKDAY_SLOTS;
  // Parse date without timezone offset issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay(); // 0 is Sunday
  return dayOfWeek === 0 ? SUNDAY_SLOTS : WEEKDAY_SLOTS;
}
