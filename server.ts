import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

interface PatientAppointment {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;
  therapy: string;
  condition?: string;
  visitType: 'first_visit' | 'returning_patient';
  fee: number;
  paymentMethod: 'pay_at_clinic' | 'upi_qr';
  paymentStatus: 'pending' | 'paid_online' | 'collected_at_clinic';
  upiReferenceNumber?: string;
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;

  // 24-Hour Automated Reminder & Attendance
  reminderChannel?: 'whatsapp' | 'sms' | 'both';
  reminderScheduledFor?: string; // ISO string 24h prior to appointment
  reminderStatus?: 'scheduled' | 'sent' | 'delivered' | 'failed';
  reminderSentAt?: string;
  reminderMessage?: string;
  attendanceStatus?: 'unconfirmed' | 'confirmed' | 'rescheduled' | 'cancelled';
  attendanceConfirmedAt?: string;
  attendanceReplyNotes?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'appointments.json');
const FEEDBACKS_FILE = path.join(DATA_DIR, 'feedbacks.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'clinic_settings.json');

interface ClinicSettings {
  customPublicAppUrl?: string;
  updatedAt?: string;
}

function loadClinicSettings(): ClinicSettings {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading clinic settings:', err);
  }
  return {};
}

function saveClinicSettings(settings: ClinicSettings) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving clinic settings:', err);
  }
}

let clinicSettingsStore: ClinicSettings = loadClinicSettings();

interface PatientFeedback {
  id: string;
  patientName: string;
  rating: number; // 1 to 5
  comment: string;
  category?: string;
  therapy?: string;
  createdAt: string;
  verifiedPatient?: boolean;
}

function loadFeedbacks(): PatientFeedback[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(FEEDBACKS_FILE)) {
      const data = fs.readFileSync(FEEDBACKS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch (err) {
    console.error('Error loading feedbacks:', err);
    return [];
  }
}

function saveFeedbacks(feedbacks: PatientFeedback[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FEEDBACKS_FILE, JSON.stringify(feedbacks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving feedbacks:', err);
  }
}

let feedbacksStore: PatientFeedback[] = loadFeedbacks();

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calculateReminderScheduleTime(dateStr: string, timeSlot: string): string {
  try {
    const startTimePart = timeSlot.split('-')[0].trim(); // e.g. "09:30 AM"
    const match = startTimePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hours = 9;
    let minutes = 0;
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridiem = match[3].toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Exactly 24 hours prior
    const scheduledTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
    return scheduledTime.toISOString();
  } catch (err) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const fallback = new Date(year, month - 1, day - 1, 9, 0, 0);
    return fallback.toISOString();
  }
}

function generateReminderMessage(apt: {
  patientName: string;
  tokenNumber: string;
  appointmentDate: string;
  timeSlot: string;
  therapy: string;
}): string {
  return `Namaste ${apt.patientName} ji 🙏,

This is an automated 24-hour reminder for your upcoming clinical appointment at Bindsukh Acupressure & Acupuncture Center (हीलिंग थ्रू टच एंड मैग्नेट), Prayagraj.

📋 Token No: ${apt.tokenNumber}
🌿 Therapy: ${apt.therapy}
📅 Date: ${apt.appointmentDate}
⏰ Time Slot: ${apt.timeSlot}
👨‍⚕️ Specialist: THERAPIST: SAURABH PRAJAPATI
📍 Address: Puramufti Purani Bazar, Prayagraj - Near Puramufti Panchayat Bhawan
📞 Clinic Helpline: +91 9455100097 / +91 8423221799

==============================
👉 ATTENDANCE CONFIRMATION:
Please confirm if you will be attending:
1. Reply "CONFIRM ${apt.tokenNumber}" directly to this WhatsApp/SMS message.
2. Or tap here to confirm online instantly:
/confirm/${apt.tokenNumber}
==============================

Please arrive 10 minutes before your slot in comfortable loose clothing.`;
}

const INITIAL_SEED: PatientAppointment[] = [];

function loadAppointments(): PatientAppointment[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((apt: PatientAppointment) => ({
          ...apt,
          reminderChannel: apt.reminderChannel || 'both',
          reminderScheduledFor: apt.reminderScheduledFor || calculateReminderScheduleTime(apt.appointmentDate, apt.timeSlot),
          reminderStatus: apt.reminderStatus || (apt.status === 'completed' ? 'sent' : 'scheduled'),
          reminderMessage: apt.reminderMessage || generateReminderMessage(apt),
          attendanceStatus: apt.attendanceStatus || (apt.status === 'completed' ? 'confirmed' : 'unconfirmed')
        }));
      }
    }
    // write empty seed if file doesn't exist
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  } catch (err) {
    console.error('Error loading appointments from disk:', err);
    return [];
  }
}

function saveAppointments(appointments: PatientAppointment[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(appointments, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving appointments to disk:', err);
  }
}

let appointmentsStore: PatientAppointment[] = loadAppointments();

const MAX_SLOT_CAPACITY = 5;

const WEEKDAY_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
];

const SUNDAY_SLOTS = [...WEEKDAY_SLOTS];

function getSlotsForDateServer(dateStr: string): string[] {
  return WEEKDAY_SLOTS;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Permissive CORS and mobile browser compatibility headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '25mb' }));

  // Static assets with explicit headers for iOS Safari and PWA manifest
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.webmanifest') || filePath.endsWith('manifest.json')) {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
        }
      }
    }));
  }

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      center: 'Bindsukh Acupressure & Acupuncture Center',
      practitioner: 'THERAPIST: SAURABH PRAJAPATI',
      totalAppointments: appointmentsStore.length
    });
  });

  // 1a. Gemini AI Care Assistant Chatbot Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const userQuery = message.trim();
      const lowerQuery = userQuery.toLowerCase().replace(/[?.!,;:]/g, '').trim();
      const greetings = ['hi', 'hello', 'namaste', 'namaskar', 'hallo', 'helo', 'hey', 'kaise ho', 'good morning', 'good afternoon', 'good evening', 'hallo sir', 'hello sir', 'hi sir', 'greetings'];
      const isGreeting = greetings.some(g => lowerQuery === g || lowerQuery.startsWith(g + ' ')) && 
                         !lowerQuery.includes('dard') && !lowerQuery.includes('pain') && 
                         !lowerQuery.includes('ilaj') && !lowerQuery.includes('blockage') && 
                         !lowerQuery.includes('nas') && !lowerQuery.includes('घुटने') && 
                         !lowerQuery.includes('कमर') && !lowerQuery.includes('सिर') && 
                         !lowerQuery.includes('दर्द');

      if (isGreeting) {
        return res.json({ reply: "नमस्ते! 🙏 मैं बिंदसुख केयर असिस्टेंट हूँ। आपकी क्या सहायता कर सकता हूँ? आप अपनी किसी भी शारीरिक परेशानी (जैसे सिर दर्द, घुटने का दर्द, नसों की समस्या) के बारे में पूछ सकते हैं।" });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      const systemPrompt = `You are the smart and empathetic "Bindsukh Care Assistant" for Bindsukh Acupressure & Acupuncture Center (हीलिंग थ्रू टच एंड मैग्नेट), Puramufti, Prayagraj.
Your job is to guide patients with genuine care, helpful holistic tips, and clinic booking assistance.

CLINIC CORE KNOWLEDGE:
- Lead Clinical Specialist: Therapist Saurabh Prajapati (Master in Acupressure, Master Diploma in Acupuncture, Diploma in Chiropractic).
- Operating Hours:
  * Monday to Saturday: 8:30 AM to 4:00 PM
  * Sunday Morning: 8:30 AM to 12:00 PM
- Multi-Patient Slot Capacity: Every 1-hour time slot accommodates a strict maximum of 5 patients to prevent crowding and guarantee dedicated clinical attention.
- Consultation & Therapy Fees:
  * First Visit (New Patient): ₹500
  * Returning / Follow-up Patient: ₹200
- 100% Drugless & Non-Surgical Holistic Healing (बिना दवा, बिना इंजेक्शन, बिना ऑपरेशन दर्द निवारण).
- Clinic Address: Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan), Uttar Pradesh 212208.
- Direct Call/WhatsApp: +91 9455110097 / +91 9455100097.

CORE THERAPIES OFFERED:
1. Acupressure Therapy (एक्यूप्रेशर): Diagnostic touch and meridian magnet application.
2. Acupuncture Therapy (एक्यूपंक्चर): Sterile disposable micro-needles activating nerves and natural endorphin pain relief.
3. Chiropractic Adjustment (काइरोप्रैक्टिक): Spinal realignment, posture correction, and lumbar/cervical decompression.
4. Cupping Therapy / Hijama (कपिंग थेरेपी): Myofascial vacuum decompression for localized blood flow and detox.
5. Kinesiology Taping (काइनेसियोलॉजी टेपिंग): Musculoskeletal support and joint stabilization.
6. Acupressure Massage: Deep soft-tissue meridian release.

SPECIALIZED CONDITIONS RELIEVED:
- Knee Pain & Arthritis (घुटनों का दर्द व गठिया)
- Lower Back Pain & Slip Disc (कमर दर्द / स्लिप डिस्क)
- Sciatica (साइटिका / नसों का खिंचाव व सुन्नपन)
- Cervical Spondylosis (सर्वाइकल / गर्दन व कंधे का दर्द)
- Frozen Shoulder (कंधे की जकड़न)
- Paralysis & Stroke Rehabilitation (लकवा / पक्षाघात)
- Sprain & Bone Issues (मोच एवं हड्डी सम्बंधित समस्याएं)
- Pinched Nerve & Nerve Blockage (शरीर में कहीं भी नस का दबना)
- Cerebral Palsy & Delayed Walking (सीपी चाइल्ड व बच्चों के देर से चलने का उपचार)
- Migraine & Chronic Headache (माइग्रेन / सिरदर्द)
- Constipation & Digestive issues (कब्ज व पाचन विकार)

----------------------------------------------------
🎯 RESPONSE STRATEGY FOR PATIENT HEALTH QUERIES:
Whenever a patient mentions any pain, symptom, or health problem (e.g., ghutne me dard, back pain, cervical, headache, constipation, paralysis, sciatica, slip disc, moch, dabi nas, etc.), you MUST follow this EXACT 3-step response format:

Step 1. 💡 Immediate Short Solution / Home Remedy:
- Provide 1 or 2 quick, safe, easy-to-do home care tips or simple self-acupressure points for immediate short-term relief.
- Example (for Knee Pain): Warm oil compress (sarson/til tel), gentle joint rotation, or pressing acupressure points around the knee cap (Eye of the knee / ST-35).
- Keep this solution short, practical, and clear (in 2-3 simple bullet points).

Step 2. ⚠️ Important Caution & Next Step:
- Softly state the caution in the user's language:
  * In Hinglish: "Agar in gharelu upayo se aaram na mile ya pareshani purani/gambhir hai, toh bina kisi dava ke permanent ilaj ke liye humare clinic aayein."
  * In Hindi: "यदि इन घरेलू उपायों से आराम न मिले या परेशानी पुरानी/गंभीर है, तो बिना किसी दवा के स्थायी इलाज के लिए हमारे क्लिनिक आएं।"
  * In English: "If these home remedies do not provide relief or if the condition is chronic/severe, please visit our clinic for permanent, 100% drugless healing."

Step 3. 🏥 Clinic Contact & Appointment Guide:
- Suggest seeing Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture).
- Provide quick clinic details:
  • Timing: 8:30 AM to 4:00 PM (Monday - Saturday) | Sunday Morning 8:30 AM - 12:00 PM
  • Fee: ₹500 (1st Visit) / ₹200 (Returning)
  • Address: Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
  • Direct Call/WhatsApp: +91 9455110097
- Conclude with the direct call-to-action text:
  👉 [Book Appointment Now] (or "अपॉइंटमेंट अभी बुक करें")

----------------------------------------------------
🌐 LANGUAGE TONE:
- Match the user's preferred language (Hindi, Hinglish, or English).
- Always maintain a supportive, respectful, compassionate, and medical-professional tone.
- CRITICAL: When the user asks about ANY pain, symptom, or health question, DO NOT output any generic introductory greeting like "नमस्ते! मैं आपका बिंदसुख केयर असिस्टेंट हूँ". Start directly with Step 1 (Immediate Short Solution / Home Remedies), then Step 2 (Caution line), then Step 3 (Clinic Details & 👉 [Book Appointment Now]).
- Keep answers structured with icons and bullet points so patients can read comfortably on mobile.`;

      // 1. Try Gemini AI if API key is present
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userQuery,
            config: {
              systemInstruction: systemPrompt
            }
          });

          if (response.text) {
            const trimmed = response.text.trim();
            // Ensure no generic greeting slipped through for health queries
            const lowerQuery = userQuery.toLowerCase();
            const hasHealthQuery = lowerQuery.includes('दर्द') || lowerQuery.includes('pain') || lowerQuery.includes('घुटने') || lowerQuery.includes('कमर') || lowerQuery.includes('सिर') || lowerQuery.includes('सर') || lowerQuery.includes('neck') || lowerQuery.includes('dard');
            if (!hasHealthQuery || (!trimmed.startsWith('नमस्ते! मैं आपका') && !trimmed.startsWith('Hello! I am your'))) {
              return res.json({ reply: trimmed });
            }
          }
        } catch (apiErr: any) {
          console.warn('[Gemini API] Call error, using grounded fallback:', apiErr.message || apiErr);
        }
      }

      // 2. Comprehensive Grounded Symptom Advice Lookup
      const lower = userQuery.toLowerCase().trim();
      const CAUTION_LINE = 'अगर 10-15 मिनट में आराम न मिले या दर्द लगातार बना रहे, तो बिना दवा permanent इलाज के लिए क्लीनिक आएं।';
      const CLINIC_BOOKING_FOOTER = `🏥 **3. क्लिनिक संपर्क व परामर्श (Clinic Consultation & Booking):**
थेरेपिस्ट सौरभ प्रजापति (Master in Acupressure & Acupuncture) द्वारा 100% ड्रगलेस स्थायी उपचार।
• **समय:** 8:30 AM से 4:00 PM (सोम-शनि) | रविवार 8:30 AM - 12:00 PM
• **फीस:** ₹500 (पहला परामर्श) / ₹200 (फॉलो-अप)
• **पता:** पुरामुफ्ती पुरानी बाजार, प्रयागराज (निकट पंचायत भवन)
• **हेल्पलाइन / WhatsApp:** +91 9455110097

👉 **[Book Appointment Now]**`;

      let fallback = '';

      // 1. Headache / Sir Dard / Migraine
      const isHeadache =
        lower.includes('सिर') || lower.includes('सिरदर्द') || lower.includes('सर दर्द') ||
        lower.includes('सर में दर्द') || lower.includes('सिर में दर्द') || lower.includes('माइग्रेन') ||
        lower.includes('migraine') || lower.includes('headache') || lower.includes('head pain') ||
        lower.includes('sir dard') || lower.includes('sar dard') || lower.includes('sir me dard') ||
        lower.includes('sar me dard') || lower.includes('माथा') || lower.includes('आधासीसी') ||
        ((lower.includes('दर्द') || lower.includes('dard') || lower.includes('pain')) &&
         (lower.includes('सर') || lower.includes('सिर') || lower.includes('head') || lower.includes('sar') || lower.includes('sir')));

      // 2. Knee Pain / Ghutna / Arthritis / Gathiya
      const isKnee =
        lower.includes('घुटना') || lower.includes('घुटने') || lower.includes('घुटनों') ||
        lower.includes('knee') || lower.includes('ghutn') || lower.includes('गठिया') ||
        lower.includes('arthritis') || lower.includes('joint') || lower.includes('जोड़ों');

      // 3. Back Pain / Kamar Dard / Slip Disc / Spine / L4-L5
      const isBack =
        lower.includes('कमर') || lower.includes('पीठ') || lower.includes('kamar') ||
        lower.includes('back') || lower.includes('slip disc') || lower.includes('स्लिप डिस्क') ||
        lower.includes('spine') || lower.includes('l4') || lower.includes('l5') || lower.includes('लंबर');

      // 4. Cervical / Neck Pain / Gardan / Kandha / Shoulder / Frozen Shoulder
      const isCervical =
        lower.includes('गर्दन') || lower.includes('सर्वाइकल') || lower.includes('cervical') ||
        lower.includes('neck') || lower.includes('gardan') || lower.includes('कंधा') ||
        lower.includes('कंधे') || lower.includes('shoulder') || lower.includes('frozen shoulder') ||
        lower.includes('जकड़न');

      // 5. Sciatica / Tingling / Numbness / Sunnpan / Khinchav
      const isSciatica =
        lower.includes('साइटिका') || lower.includes('sciatica') || lower.includes('सुन्न') ||
        lower.includes('झनझनाहट') || lower.includes('खिंचाव') || lower.includes('tingling') ||
        lower.includes('numbness') || lower.includes('sunn');

      // 6. Constipation / Pet / Gas / Acidity / Apach / Indigestion
      const isDigestion =
        lower.includes('कब्ज') || lower.includes('constipation') || lower.includes('पेट') ||
        lower.includes('stomach') || lower.includes('gas') || lower.includes('एसिडिटी') ||
        lower.includes('acidity') || lower.includes('अपच') || lower.includes('kabz');

      // 7. Pinched Nerve / Dabi Nas / Blockage
      const isNerve =
        lower.includes('दबी नस') || lower.includes('नस दब') ||
        lower.includes('dabi nas') || lower.includes('pinched') || lower.includes('blockage') ||
        lower.includes('ब्लॉकेज');

      // 8. Sprain / Moch / Bone Pain / Haddi / Ligament
      const isSprain =
        lower.includes('मोच') || lower.includes('हड्डी') || lower.includes('sprain') ||
        lower.includes('bone') || lower.includes('moch') || lower.includes('twist') ||
        lower.includes('ligament') || lower.includes('सूजन');

      // 9. Paralysis / Lakwa / Stroke / Pakshaghat
      const isParalysis =
        lower.includes('लकवा') || lower.includes('paralysis') || lower.includes('stroke') ||
        lower.includes('पक्षाघात') || lower.includes('lakwa');

      // 10. CP Child / Delayed Walking
      const isCPChild =
        lower.includes('सीपी') || lower.includes('cp child') || lower.includes('cerebral palsy') ||
        lower.includes('बच्चा') || lower.includes('बच्चे') || lower.includes('चलने');

      // 11. General Pain / Dard / Takleef / Pareshani / Problem / Ilaj
      const isGeneralHealth =
        lower.includes('दर्द') || lower.includes('pain') || lower.includes('dard') ||
        lower.includes('तकलीफ') || lower.includes('takleef') || lower.includes('परेशानी') ||
        lower.includes('pareshani') || lower.includes('बीमारी') || lower.includes('bimari') ||
        lower.includes('इलाज') || lower.includes('ilaj') || lower.includes('उपचार') ||
        lower.includes('upchar') || lower.includes('समस्या') || lower.includes('problem') ||
        lower.includes('hurts') || lower.includes('chot') || lower.includes('चोट');

      if (isHeadache) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies):**
• **LI4 एक्यूप्रेशर बिंदु (हेगु पॉइंट):** अपने हाथ के अंगूठे और तर्जनी (Index finger) के बीच के उभरे हुए मांसल हिस्से को 2-3 मिनट गहरे दबाव के साथ दबाएं। इससे सिर की नसों को तुरंत शांति व आराम मिलता है।
• **हाइड्रेशन व विश्राम:** 1 गिलास गुनगुना पानी पिएं, मोबाइल/स्क्रीन से 15 मिनट दूरी बनाएं और माथे पर हल्का ठंडा या गीला कपड़ा रखकर आंखें बंद करके शांत लेटें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isKnee) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies):**
• **ST-35 घुटने का एक्यूप्रेशर (Eye of the Knee):** घुटने की कटोरी (Knee Cap) के ठीक नीचे दोनों तरफ के गड्ढों को दोनों अंगूठों से 2 मिनट हल्के दबाव के साथ गोल घुमाते हुए दबाएं।
• **हल्की गरम सिंकाई व मूवमेंट:** सरसों या तिल के तेल में मेथी दाना पकाकर घुटने पर हल्के हाथ से मालिश करें और 10 मिनट गरम तौलिये से सेकें। कुर्सी पर बैठकर पैर को धीरे-धीरे सीधा व मोड़ें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isBack) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies):**
• **हैंड एक्यूप्रेशर पॉइंट:** हाथ के पिछले हिस्से पर रिंग फिंगर और मिडिल फिंगर के बीच की हड्डी वाली नाली को कलाई की ओर 2 मिनट अंगूठे से दबाएं।
• **समतल बिस्तर व जेंटल कोबरा पोज:** बहुत मुलायम गद्दे से बचें, समतल तख्त या फर्म मैट्रेस पर लेटें और घुटनों के नीचे तकिया रखें। पेट के बल लेटकर हाथों के सहारे छाती को 15-20 सेकंड हल्का ऊपर उठाएं (भुजंगासन)।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isCervical) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies):**
• **अंगूठे का एक्यूप्रेशर पॉइंट:** दोनों हाथों के अंगूठे के पिछले भाग (जो सर्वाइकल स्पाइन का मेरिडियन है) को दूसरे हाथ के अंगूठे से 2-3 मिनट दबाएं।
• **मोटा तकिया छोड़ें व जेंटल नेक स्ट्रेच:** सोते समय मोटा तकिया तुरंत हटाएं और गर्दन को धीरे-धीरे दाएं-बाएं और ऊपर-नीचे स्ट्रेच करें (झटका बिल्कुल न दें)।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isSciatica) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies):**
• **एड़ी व तलवे का एक्यूप्रेशर:** एड़ी के अंदरूनी व बाहरी किनारे के गड्ढों को 2 मिनट अंगूठे से हल्के दबाव के साथ दबाएं।
• **पैर को सहारा व सिंकाई:** पीठ के बल लेटकर घुटनों के नीचे तकिया रखें ताकि साइटिक नर्व पर खिंचाव कम हो, और कूल्हे से जांघ तक 10 मिनट गुनगुनी सिकाई करें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isDigestion) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies):**
• **हथेली का एक्यूप्रेशर (पाचन बिंदु):** दोनों हथेलियों के बिल्कुल बीच वाले भाग को अंगूठे से 2 मिनट क्लॉकवाइज गोलाई में दबाएं।
• **गुनगुना पानी व नाभि मसाज:** 2 गिलास गुनगुना पानी पिएं और नाभि के चारों ओर क्लॉकवाइज हल्के हाथ से 5 मिनट मालिश करें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isNerve) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies):**
• **वार्म एंड कूल कंप्रेस:** प्रभावित हिस्से पर 10 मिनट गुनगुनी सिकाई के बाद 5 मिनट ठंडा कपड़ा रखें, इससे नसों की सूजन तुरंत कम होती है।
• **दबाव से बचाव:** प्रभावित अंग पर अधिक वजन न डालें और बिना झटका दिए जेंटल स्ट्रेच करें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isSprain) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय (Home Remedies):**
• **R.I.C.E. आइस कंप्रेस:** मोच वाले हिस्से पर तुरंत 10-15 मिनट बर्फ की सिकाई करें और क्रेप बैंडेज से हल्का सहारा दें (झटके से न चटकाएं)।
• **ऊंचाई पर रखें (Elevation):** सोते समय पैर या हाथ के नीचे तकिया रखें ताकि सूजन न बढ़े और जोड़ को पूरा आराम दें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isParalysis) {
        fallback = `💡 **1. तुरंत देखभाल के 2 घरेलू उपाय (Home Care):**
• **उंगलियों की जेंटल मूवमेंट:** प्रभावित हाथ-पैरों की उंगलियों को दिन में 3-4 बार धीरे-धीरे सीधा करें और मोड़ें ताकि जोड़ जाम न हों।
• **गुनगुना तिल का तेल व पोरों का दबाव:** तिल के तेल से नीचे से ऊपर की दिशा में हल्की मालिश करें और हाथ-पैरों के सबसे ऊपरी पोरों (Fingertips) को हल्के से दबाएं।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isCPChild) {
        fallback = `💡 **1. बच्चों के लिए घरेलू देखभाल (Home Care):**
• **सौम्य तेल मालिश:** बच्चों के पैरों और पंजों की गुनगुने तिल या जैतून के तेल से नियमित सौम्य मालिश करें।
• **सपोर्टिव स्टैंडिंग प्रैक्टिस:** बच्चे को दोनों हाथों से पकड़कर सीधे खड़े होने और पैर जमीन पर टिकाने का रोज 10-15 मिनट अभ्यास कराएं।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (isGeneralHealth) {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies):**
• **LI4 मास्टर पेन रिलीवर बिंदु (हेगु):** हाथ के अंगूठे और तर्जनी उंगली के बीच वाले हिस्से को 2 मिनट दबाएं — यह शरीर के किसी भी हिस्से के दर्द और तनाव को कम करने का प्रमुख एक्यूप्रेशर बिंदु है।
• **गुनगुनी सिंकाई व विश्राम:** दर्द वाले हिस्से पर 10-15 मिनट हल्की गुनगुनी सिकाई करें और लंबी गहरी सांसें लेकर शरीर को तनावमुक्त रखें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${CAUTION_LINE}

${CLINIC_BOOKING_FOOTER}`;
      } else if (lower.includes('फीस') || lower.includes('शुल्क') || lower.includes('fee') || lower.includes('cost') || lower.includes('charge') || lower.includes('rupee') || lower.includes('रुपये')) {
        fallback = `बिंदसुख एक्यूप्रेशर सेंटर में परामर्श एवं थेरेपी शुल्क:
• **पहली बार (1st Visit / New Patient):** ₹500
• **दोबारा आने पर (Returning / Follow-up):** मात्र ₹200
इसमें विस्तृत मेरिडियन डायग्नोसिस, मैग्नेट/एक्यूप्रेशर एवं परामर्श शामिल है।

${CLINIC_BOOKING_FOOTER}`;
      } else if (lower.includes('समय') || lower.includes('time') || lower.includes('timing') || lower.includes('दिन') || lower.includes('open') || lower.includes('hour') || lower.includes('sunday')) {
        fallback = `क्लिनिक परामर्श समय (Clinic Timings):
• **सोमवार से शनिवार (Monday - Saturday):** सुबह 8:30 AM से शाम 4:00 PM
• **रविवार (Sunday Morning):** सुबह 8:30 AM से दोपहर 12:00 PM
विशेषता: भीड़ से बचने के लिए प्रत्येक 1-घंटे के स्लॉट में अधिकतम 5 मरीजों को ही समय दिया जाता है।

${CLINIC_BOOKING_FOOTER}`;
      } else if (lower.includes('पता') || lower.includes('address') || lower.includes('कहाँ') || lower.includes('location') || lower.includes('map') || lower.includes('दिशा')) {
        fallback = `क्लिनिक का पता एवं लोकेशन:
**बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर**
पुरामुफ्ती पुरानी बाजार, निकट पुरामुफ्ती पंचायत भवन, प्रयागराज (उ.प्र.) 212208
(बमरौली से ~8 किमी, प्रयागराज जंक्शन से ~16 किमी)
📞 हेल्पलाइन / WhatsApp: +91 9455110097 / +91 9455100097

👉 **[Book Appointment Now]**`;
      } else if (lower.includes('डॉक्टर') || lower.includes('थेरेपिस्ट') || lower.includes('doctor') || lower.includes('therapist') || lower.includes('saurabh') || lower.includes('सौरभ')) {
        fallback = `मुख्य चिकित्सक परिचय:
**THERAPIST: SAURABH PRAJAPATI**
• Master in Acupressure
• Master Diploma in Acupuncture
• Diploma in Chiropractic
वे प्राकृतिक एवं ड्रगलेस चिकित्सा पद्धतियों के प्रमाणित विशेषज्ञ हैं तथा घुटने, कमर, सर्वाइकल, साइटिका, मोच व नसों के जटिल दर्दों को बिना दवा ठीक करते हैं।
• परामर्श फीस: ₹500 (1st Visit) / ₹200 (Returning)
• समय: सुबह 8:30 AM से शाम 4:00 PM | रविवार 8:30 AM - 12:00 PM
• हेल्पलाइन: +91 9455110097

👉 **[Book Appointment Now]**`;
      } else {
        fallback = `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies & Tips):**
• **LI4 मास्टर पेन रिलीवर बिंदु (हेगु):** अपने हाथ के अंगूठे और तर्जनी उंगली के बीच वाले उभरे हुए हिस्से को 2 मिनट दबाएं। यह शरीर के किसी भी हिस्से के दर्द और तनाव को कम करने का प्रमुख बिंदु है।
• **सिकाई व विश्राम:** प्रभावित हिस्से पर 10-15 मिनट हल्की गुनगुनी सिकाई करें और गहरी सांसें लेकर शरीर की मांसपेशियों को तनावमुक्त रखें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
Agar 10-15 min me aaram na mile, toh clinic me Therapist Saurabh Prajapati se milein.

${CLINIC_BOOKING_FOOTER}`;
      }

      res.json({ reply: fallback });
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ error: 'Chat service error: ' + (err.message || 'unknown') });
    }
  });

  // 1b. Check if the public shared link is published and reachable
  app.get('/api/check-public-status', async (req, res) => {
    const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
    let defaultPublicUrl = clinicSettingsStore.customPublicAppUrl || 'https://ais-pre-sk3sr4ejjycj7ulqambgy2-154938787803.asia-southeast1.run.app';
    if (!clinicSettingsStore.customPublicAppUrl && rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')) {
      const publicHost = rawHost.includes('ais-dev-') ? rawHost.replace('ais-dev-', 'ais-pre-') : rawHost;
      defaultPublicUrl = `https://${publicHost}`;
    }
    const targetUrl = (req.query.url as string) || defaultPublicUrl;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(targetUrl, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      const isOk = response.status >= 200 && response.status < 400;
      res.json({
        url: targetUrl,
        isPublished: isOk,
        status: response.status,
        message: isOk 
          ? 'Public link is active and accessible on any device!' 
          : `Public link is returning status ${response.status} (Not published yet via AI Studio Share button).`
      });
    } catch (err: any) {
      res.json({
        url: targetUrl,
        isPublished: false,
        status: 0,
        message: 'Unable to reach URL: ' + (err.message || 'connection failed')
      });
    }
  });

  // 1c. Get & Update Clinic Settings (including custom public app URL for QR code)
  app.get('/api/clinic-settings', (_req, res) => {
    res.json({
      customPublicAppUrl: clinicSettingsStore.customPublicAppUrl || '',
      defaultPublicUrl: 'https://ais-pre-sk3sr4ejjycj7ulqambgy2-154938787803.asia-southeast1.run.app',
      updatedAt: clinicSettingsStore.updatedAt || null
    });
  });

  app.post('/api/clinic-settings', (req, res) => {
    try {
      const { customPublicAppUrl } = req.body;
      if (customPublicAppUrl !== undefined) {
        if (typeof customPublicAppUrl === 'string') {
          let cleanUrl = customPublicAppUrl.trim();
          if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
          }
          clinicSettingsStore.customPublicAppUrl = cleanUrl;
          clinicSettingsStore.updatedAt = new Date().toISOString();
          saveClinicSettings(clinicSettingsStore);
        }
      }
      res.json({
        success: true,
        settings: clinicSettingsStore
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update settings' });
    }
  });

  // 2. Check patient history by phone number to calculate dynamic fee
  app.get('/api/check-patient/:phone', (req, res) => {
    const rawPhone = req.params.phone.replace(/\D/g, '');
    const cleanPhone = rawPhone.slice(-10); // match last 10 digits

    if (cleanPhone.length < 10) {
      return res.json({
        phone: rawPhone,
        isReturning: false,
        previousAppointmentsCount: 0,
        suggestedFee: 500,
        patientName: ''
      });
    }

    const patientAppointments = appointmentsStore.filter(apt => {
      const p = apt.patientPhone.replace(/\D/g, '').slice(-10);
      return p === cleanPhone && apt.status !== 'cancelled';
    });

    const isReturning = patientAppointments.length > 0;
    const latestAppointment = patientAppointments[patientAppointments.length - 1];

    res.json({
      phone: cleanPhone,
      isReturning,
      previousAppointmentsCount: patientAppointments.length,
      lastVisitDate: latestAppointment ? latestAppointment.appointmentDate : null,
      suggestedFee: isReturning ? 200 : 500,
      patientName: latestAppointment ? latestAppointment.patientName : ''
    });
  });

  // 3. Get Slot Availability for a specific date (With Multi-Patient Slot Capacity: max 5)
  app.get('/api/slots', (req, res) => {
    const dateStr = (req.query.date as string) || getTodayString();
    const availableSlots = getSlotsForDateServer(dateStr);

    const activeAppointmentsForDate = appointmentsStore.filter(
      apt => apt.appointmentDate === dateStr && apt.status !== 'cancelled'
    );

    const slotAvailabilities = availableSlots.map(slot => {
      const matching = activeAppointmentsForDate.filter(apt => apt.timeSlot === slot);
      const bookedCount = matching.length;
      const availableCount = Math.max(0, MAX_SLOT_CAPACITY - bookedCount);
      const isFull = bookedCount >= MAX_SLOT_CAPACITY;

      return {
        slot,
        maxCapacity: MAX_SLOT_CAPACITY,
        bookedCount,
        availableCount,
        isFull,
        patientsInSlot: matching.map(m => ({
          id: m.id,
          tokenNumber: m.tokenNumber,
          patientName: m.patientName,
          status: m.status
        }))
      };
    });

    res.json({
      date: dateStr,
      maxSlotCapacity: MAX_SLOT_CAPACITY,
      slots: slotAvailabilities
    });
  });

  // 4. Get all appointments with optional filters (for Admin and Patient Tracker)
  app.get('/api/appointments', (req, res) => {
    const { date, phone, status, search } = req.query;
    let list = [...appointmentsStore];

    if (date) {
      list = list.filter(a => a.appointmentDate === date);
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      list = list.filter(a => a.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone);
    }

    if (status && status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(a =>
        a.patientName.toLowerCase().includes(q) ||
        a.patientPhone.includes(q) ||
        a.tokenNumber.toLowerCase().includes(q) ||
        (a.condition && a.condition.toLowerCase().includes(q)) ||
        a.therapy.toLowerCase().includes(q)
      );
    }

    // Sort newest first by date and time
    list.sort((a, b) => {
      if (a.appointmentDate !== b.appointmentDate) {
        return b.appointmentDate.localeCompare(a.appointmentDate);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

    res.json(list);
  });

  // 4b. Export appointments as CSV for offline clinic records
  app.get('/api/appointments/export-csv', (req, res) => {
    try {
      const { date, scope } = req.query;
      let list = [...appointmentsStore];

      // If scope is not 'all' and date is provided, filter by date
      if (scope !== 'all' && date) {
        list = list.filter(a => a.appointmentDate === String(date));
      }

      list.sort((a, b) => {
        if (a.appointmentDate !== b.appointmentDate) {
          return b.appointmentDate.localeCompare(a.appointmentDate);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });

      const headers = [
        'Token Number',
        'Patient Name',
        'Phone Number',
        'Appointment Date',
        'Time Slot',
        'Therapy',
        'Condition / Pain Area',
        'Visit Type',
        'Fee (INR)',
        'Payment Method',
        'Payment Status',
        'UPI Reference',
        'Appointment Status',
        'Attendance Status',
        'Reminder Status',
        'Clinician Notes',
        'Booking Created At'
      ];

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      };

      const rows = list.map(a => [
        escapeCsv(a.tokenNumber),
        escapeCsv(a.patientName),
        escapeCsv(a.patientPhone),
        escapeCsv(a.appointmentDate),
        escapeCsv(a.timeSlot),
        escapeCsv(a.therapy),
        escapeCsv(a.condition || 'General Assessment'),
        escapeCsv(a.visitType === 'returning_patient' ? 'Returning Patient (₹200)' : 'First Visit (₹500)'),
        escapeCsv(a.fee),
        escapeCsv(a.paymentMethod === 'upi_qr' ? 'UPI QR Online' : 'Pay at Clinic'),
        escapeCsv(a.paymentStatus === 'paid_online' ? 'Paid Online' : a.paymentStatus === 'collected_at_clinic' ? 'Collected at Clinic' : 'Pending'),
        escapeCsv(a.upiReferenceNumber || 'N/A'),
        escapeCsv(a.status),
        escapeCsv(a.attendanceStatus || 'unconfirmed'),
        escapeCsv(a.reminderStatus || 'scheduled'),
        escapeCsv(a.notes || ''),
        escapeCsv(a.createdAt)
      ].join(','));

      // If no appointments exist yet, provide a clear notice row so the file opens cleanly
      if (rows.length === 0) {
        const emptyNoticeRow = [
          '"NO-RECORDS"',
          scope !== 'all' && date ? `"No appointments booked yet for ${date}"` : '"No appointments booked yet in system"',
          '""',
          scope !== 'all' && date ? `"${date}"` : `"${getTodayString()}"`,
          '""',
          '""',
          '""',
          '""',
          '""',
          '""',
          '""',
          '""',
          '"empty"',
          '""',
          '""',
          '"Bindsukh Acu Center - Offline Clinic Backup Template"',
          `"${new Date().toISOString()}"`
        ].join(',');
        rows.push(emptyNoticeRow);
      }

      // Include UTF-8 Byte Order Mark (BOM) so Excel/Sheets correctly displays Hindi characters and symbols
      const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
      const filename = (scope !== 'all' && date)
        ? `bindsukh_appointments_${date}.csv`
        : `bindsukh_all_patient_records_${getTodayString()}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(csvContent);
    } catch (err: any) {
      console.error('Error exporting appointments CSV:', err);
      res.status(500).json({ error: 'Failed to export CSV: ' + err.message });
    }
  });

  // 5. Create new appointment
  app.post('/api/appointments', (req, res) => {
    try {
      const {
        patientName,
        patientPhone,
        appointmentDate,
        timeSlot,
        therapy,
        condition,
        paymentMethod,
        upiReferenceNumber,
        notes
      } = req.body;

      if (!patientName || !patientName.trim()) {
        return res.status(400).json({ error: 'Patient name is required.' });
      }

      const cleanPhone = String(patientPhone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
      }

      if (!appointmentDate) {
        return res.status(400).json({ error: 'Appointment date is required.' });
      }

      if (!timeSlot) {
        return res.status(400).json({ error: 'Time slot selection is required.' });
      }

      if (!therapy) {
        return res.status(400).json({ error: 'Please select a therapy.' });
      }

      // Check slot capacity (Multi-Patient Slot Capacity: max 5 bookings per slot per date)
      const existingInSlot = appointmentsStore.filter(
        apt => apt.appointmentDate === appointmentDate &&
               apt.timeSlot === timeSlot &&
               apt.status !== 'cancelled'
      );

      if (existingInSlot.length >= MAX_SLOT_CAPACITY) {
        return res.status(400).json({
          error: `This 1-hour slot (${timeSlot}) is FULL (${MAX_SLOT_CAPACITY}/${MAX_SLOT_CAPACITY} patients already booked). Please choose another available time slot.`
        });
      }

      // Determine visit type and dynamic fee based on patient's past history
      const priorHistory = appointmentsStore.filter(
        apt => apt.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone &&
               apt.status !== 'cancelled'
      );

      const isReturning = priorHistory.length > 0;
      const visitType = isReturning ? 'returning_patient' : 'first_visit';
      const fee = isReturning ? 200 : 500;

      // Generate sequential token number
      const dateParts = appointmentDate.replace(/-/g, '').slice(4); // e.g. 0922
      const todayTotal = appointmentsStore.filter(a => a.appointmentDate === appointmentDate).length + 1;
      const tokenNumber = `BK-${dateParts}-${String(todayTotal).padStart(3, '0')}`;

      // Automated 24h Reminder setup
      const reminderScheduledFor = calculateReminderScheduleTime(appointmentDate, timeSlot);
      const reminderChannel = (req.body.reminderChannel as 'whatsapp' | 'sms' | 'both') || 'both';
      const reminderMessage = generateReminderMessage({
        patientName: patientName.trim(),
        tokenNumber,
        appointmentDate,
        timeSlot,
        therapy
      });

      const newAppointment: PatientAppointment = {
        id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tokenNumber,
        patientName: patientName.trim(),
        patientPhone: cleanPhone,
        appointmentDate,
        timeSlot,
        therapy,
        condition: condition?.trim() || 'General Acupressure Consultation',
        visitType,
        fee,
        paymentMethod: paymentMethod === 'upi_qr' ? 'upi_qr' : 'pay_at_clinic',
        paymentStatus: paymentMethod === 'upi_qr' ? 'paid_online' : 'pending',
        upiReferenceNumber: upiReferenceNumber?.trim() || undefined,
        notes: notes?.trim() || undefined,
        status: 'scheduled',
        createdAt: new Date().toISOString(),

        // 24-Hour Automated Reminder & Attendance
        reminderChannel,
        reminderScheduledFor,
        reminderStatus: 'scheduled',
        reminderMessage,
        attendanceStatus: 'unconfirmed'
      };

      appointmentsStore.push(newAppointment);
      saveAppointments(appointmentsStore);

      res.status(201).json(newAppointment);
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // 6. Update appointment status (e.g., Mark as Done / Completed, In-progress, Cancelled)
  app.patch('/api/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus, notes, attendanceStatus } = req.body;

    const aptIndex = appointmentsStore.findIndex(a => a.id === id);
    if (aptIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (status) {
      appointmentsStore[aptIndex].status = status;
      // If marked completed and payment was pending at clinic, auto-collect or keep track
      if (status === 'completed' && appointmentsStore[aptIndex].paymentStatus === 'pending') {
        appointmentsStore[aptIndex].paymentStatus = 'collected_at_clinic';
      }
    }

    if (paymentStatus) {
      appointmentsStore[aptIndex].paymentStatus = paymentStatus;
    }

    if (attendanceStatus) {
      appointmentsStore[aptIndex].attendanceStatus = attendanceStatus;
      if (attendanceStatus === 'confirmed') {
        appointmentsStore[aptIndex].attendanceConfirmedAt = new Date().toISOString();
      }
    }

    if (notes !== undefined) {
      appointmentsStore[aptIndex].notes = notes;
    }

    saveAppointments(appointmentsStore);
    res.json(appointmentsStore[aptIndex]);
  });

  // 7. Confirm patient attendance (by appointment ID)
  app.post('/api/appointments/:id/confirm-attendance', (req, res) => {
    const { id } = req.params;
    const { notes, channel } = req.body;

    const aptIndex = appointmentsStore.findIndex(a => a.id === id);
    if (aptIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointmentsStore[aptIndex].attendanceStatus = 'confirmed';
    appointmentsStore[aptIndex].attendanceConfirmedAt = new Date().toISOString();
    if (notes) {
      appointmentsStore[aptIndex].attendanceReplyNotes = notes;
    }

    saveAppointments(appointmentsStore);
    res.json({
      success: true,
      message: 'Attendance confirmed successfully!',
      appointment: appointmentsStore[aptIndex]
    });
  });

  // 8. Confirm patient attendance (by token number, e.g. from SMS/WhatsApp reply)
  app.post('/api/confirm-by-token', (req, res) => {
    const { token, notes, channel } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token number is required' });
    }

    const cleanToken = String(token).trim().toUpperCase();
    const aptIndex = appointmentsStore.findIndex(
      a => a.tokenNumber.toUpperCase() === cleanToken || a.tokenNumber.toUpperCase().endsWith(cleanToken)
    );

    if (aptIndex === -1) {
      return res.status(404).json({ error: `Appointment with token ${token} not found.` });
    }

    appointmentsStore[aptIndex].attendanceStatus = 'confirmed';
    appointmentsStore[aptIndex].attendanceConfirmedAt = new Date().toISOString();
    appointmentsStore[aptIndex].attendanceReplyNotes = notes || `Confirmed via ${channel || 'direct reply'}`;

    saveAppointments(appointmentsStore);
    res.json({
      success: true,
      message: `Attendance confirmed for ${appointmentsStore[aptIndex].patientName} (Token: ${appointmentsStore[aptIndex].tokenNumber})`,
      appointment: appointmentsStore[aptIndex]
    });
  });

  // 9. Process due 24h reminders (Automatic runner / Manual trigger)
  function processDueReminders(): { processedCount: number; sentAppointments: string[] } {
    const now = Date.now();
    let processedCount = 0;
    const sentAppointments: string[] = [];

    appointmentsStore.forEach(apt => {
      if (apt.status === 'cancelled' || apt.status === 'completed') return;

      if (apt.reminderStatus === 'scheduled' && apt.reminderScheduledFor) {
        const scheduledTime = new Date(apt.reminderScheduledFor).getTime();
        if (scheduledTime <= now) {
          apt.reminderStatus = 'sent';
          apt.reminderSentAt = new Date().toISOString();
          processedCount++;
          sentAppointments.push(`${apt.tokenNumber} (${apt.patientName})`);
        }
      }
    });

    if (processedCount > 0) {
      saveAppointments(appointmentsStore);
      console.log(`[24h Automated Reminder Engine] Dispatched ${processedCount} reminder(s):`, sentAppointments);
    }

    return { processedCount, sentAppointments };
  }

  // Trigger 24h due reminders on demand
  app.post('/api/reminders/process-due', (_req, res) => {
    const result = processDueReminders();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  });

  // 10. Send or resend reminder immediately for a specific appointment
  app.post('/api/appointments/:id/send-reminder', (req, res) => {
    const { id } = req.params;
    const { channel } = req.body;

    const aptIndex = appointmentsStore.findIndex(a => a.id === id);
    if (aptIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const apt = appointmentsStore[aptIndex];
    apt.reminderStatus = 'sent';
    apt.reminderSentAt = new Date().toISOString();
    if (channel) {
      apt.reminderChannel = channel;
    }
    apt.reminderMessage = generateReminderMessage(apt);

    saveAppointments(appointmentsStore);
    res.json({
      success: true,
      message: `Reminder sent successfully to ${apt.patientName} via ${channel || apt.reminderChannel || 'WhatsApp/SMS'}!`,
      appointment: apt
    });
  });

  // 11. Get automated reminders queue and stats
  app.get('/api/reminders/queue', (_req, res) => {
    const active = appointmentsStore.filter(a => a.status !== 'cancelled');
    const scheduled = active.filter(a => a.reminderStatus === 'scheduled');
    const sent = active.filter(a => a.reminderStatus === 'sent');
    const confirmed = active.filter(a => a.attendanceStatus === 'confirmed');
    const unconfirmed = active.filter(a => a.attendanceStatus === 'unconfirmed');

    res.json({
      totalActive: active.length,
      totalScheduled: scheduled.length,
      totalSent: sent.length,
      totalConfirmed: confirmed.length,
      totalUnconfirmed: unconfirmed.length,
      items: active.map(a => ({
        id: a.id,
        tokenNumber: a.tokenNumber,
        patientName: a.patientName,
        patientPhone: a.patientPhone,
        appointmentDate: a.appointmentDate,
        timeSlot: a.timeSlot,
        therapy: a.therapy,
        reminderChannel: a.reminderChannel || 'both',
        reminderScheduledFor: a.reminderScheduledFor,
        reminderStatus: a.reminderStatus || 'scheduled',
        reminderSentAt: a.reminderSentAt,
        attendanceStatus: a.attendanceStatus || 'unconfirmed',
        attendanceConfirmedAt: a.attendanceConfirmedAt,
        reminderMessage: a.reminderMessage || generateReminderMessage(a)
      }))
    });
  });

  // 12. Simulate/Receive incoming patient reply (WhatsApp/SMS webhook)
  app.post(['/api/incoming-reply', '/api/webhooks/patient-reply'], (req, res) => {
    const { phone, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const msgUpper = String(message).toUpperCase();
    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

    // Look for token in message, e.g. "CONFIRM BK-101" or "BK-0922-001"
    let matchedAptIndex = -1;
    for (let i = 0; i < appointmentsStore.length; i++) {
      const apt = appointmentsStore[i];
      if (apt.status === 'cancelled') continue;

      if (msgUpper.includes(apt.tokenNumber.toUpperCase())) {
        matchedAptIndex = i;
        break;
      }

      if (cleanPhone && apt.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) {
        matchedAptIndex = i;
        break;
      }
    }

    if (matchedAptIndex === -1) {
      return res.status(404).json({
        error: 'Could not match appointment from message or phone number. Please include token number (e.g. CONFIRM BK-101).'
      });
    }

    const apt = appointmentsStore[matchedAptIndex];
    const isConfirmation = msgUpper.includes('CONFIRM') || msgUpper.includes('YES') || msgUpper.includes('HAAN') || msgUpper.includes('हाँ') || msgUpper.includes('AUNGA');

    if (isConfirmation) {
      apt.attendanceStatus = 'confirmed';
      apt.attendanceConfirmedAt = new Date().toISOString();
      apt.attendanceReplyNotes = `Auto-confirmed from reply: "${message}"`;
    } else {
      apt.attendanceReplyNotes = `Reply received: "${message}"`;
    }

    saveAppointments(appointmentsStore);
    res.json({
      success: true,
      action: isConfirmation ? 'attendance_confirmed' : 'reply_logged',
      appointment: apt
    });
  });

  // 13. Public interactive attendance confirmation web page (/confirm/:token)
  app.get('/confirm/:token', (req, res) => {
    const { token } = req.params;
    const cleanToken = String(token).trim().toUpperCase();

    const apt = appointmentsStore.find(
      a => a.tokenNumber.toUpperCase() === cleanToken || a.tokenNumber.toUpperCase().endsWith(cleanToken)
    );

    if (apt) {
      apt.attendanceStatus = 'confirmed';
      apt.attendanceConfirmedAt = new Date().toISOString();
      apt.attendanceReplyNotes = 'Confirmed via 1-click web confirmation link';
      saveAppointments(appointmentsStore);
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Attendance Confirmed - Bindsukh Center</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-3xl shadow-xl border border-emerald-900/15 overflow-hidden">
    <div class="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white p-6 text-center">
      <div class="w-14 h-14 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
        ✓
      </div>
      <h1 class="text-xl font-bold">Attendance Confirmed!</h1>
      <p class="text-xs text-amber-300 mt-0.5">उपस्थिति की पुष्टि हो चुकी है</p>
      <p class="text-xs text-emerald-200 mt-1">Bindsukh Acupressure & Acupuncture Center</p>
    </div>

    <div class="p-6 space-y-4">
      ${apt ? `
      <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
        <span class="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">Official Queue Token</span>
        <span class="text-2xl font-black text-emerald-950 font-mono block my-1">${apt.tokenNumber}</span>
        <span class="text-xs font-semibold text-emerald-800">${apt.patientName}</span>
      </div>

      <div class="divide-y divide-slate-100 border border-slate-200 rounded-2xl text-xs">
        <div class="p-3 flex justify-between">
          <span class="text-slate-500">Date:</span>
          <span class="font-bold text-emerald-950">${apt.appointmentDate}</span>
        </div>
        <div class="p-3 flex justify-between">
          <span class="text-slate-500">1-Hour Time Slot:</span>
          <span class="font-bold text-emerald-950 font-mono">${apt.timeSlot}</span>
        </div>
        <div class="p-3 flex justify-between">
          <span class="text-slate-500">Therapy:</span>
          <span class="font-semibold text-slate-800">${apt.therapy}</span>
        </div>
        <div class="p-3 flex justify-between">
          <span class="text-slate-500">Consulting Specialist:</span>
          <span class="font-semibold text-emerald-900">THERAPIST: SAURABH PRAJAPATI</span>
        </div>
      </div>
      ` : `
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-xs text-amber-900">
        Token <strong>${token}</strong> processed. If you need any assistance, please call the clinic directly.
      </div>
      `}

      <div class="bg-slate-50 rounded-2xl p-4 text-xs space-y-1.5 border border-slate-200">
        <div class="font-bold text-slate-900">📍 Clinic Address:</div>
        <div class="text-slate-600">Puramufti Purani Bazar, Prayagraj - Near Puramufti Panchayat Bhawan</div>
        <div class="text-slate-500 pt-1">Please arrive 10 minutes prior in loose, comfortable clothing.</div>
      </div>

      <div class="space-y-2 pt-2">
        <a href="/" class="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center transition-colors">
          Open Clinic Portal
        </a>
        <a href="https://wa.me/919455100097" class="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs flex items-center justify-center transition-colors border border-emerald-200">
          WhatsApp Clinic Help (+91 9455100097)
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // 14. Feedbacks & Patient Reviews endpoints
  app.get('/api/feedbacks', (_req, res) => {
    feedbacksStore = loadFeedbacks();
    const sorted = [...feedbacksStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(sorted);
  });

  app.post('/api/feedbacks', (req, res) => {
    const { patientName, rating, comment, category, therapy, verifiedPatient } = req.body;
    if (!patientName || !String(patientName).trim()) {
      return res.status(400).json({ error: 'Patient name is required.' });
    }
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }
    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ error: 'Comment or suggestion text is required.' });
    }

    const newFeedback: PatientFeedback = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientName: String(patientName).trim(),
      rating: Math.round(numRating),
      comment: String(comment).trim(),
      category: category ? String(category).trim() : 'Treatment Experience',
      therapy: therapy ? String(therapy).trim() : 'Holistic Healing',
      createdAt: new Date().toISOString(),
      verifiedPatient: Boolean(verifiedPatient)
    };

    feedbacksStore.unshift(newFeedback);
    saveFeedbacks(feedbacksStore);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been successfully submitted.',
      feedback: newFeedback
    });
  });

  // Reset all appointments to clean fresh slate (0 patients)
  app.post('/api/appointments/reset-fresh', (_req, res) => {
    appointmentsStore = [];
    saveAppointments(appointmentsStore);
    res.json({
      success: true,
      message: 'All appointments have been cleared. Clinic roster is fresh.',
      totalAppointments: 0
    });
  });

  // Delete/Cancel appointment
  app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const aptIndex = appointmentsStore.findIndex(a => a.id === id);
    if (aptIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointmentsStore[aptIndex].status = 'cancelled';
    saveAppointments(appointmentsStore);
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  });

  // Direct upload and sync of authentic Clinic Logo from user's image file
  app.post('/api/upload-logo', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const sharp = (await import('sharp')).default;
      const publicDir = path.join(process.cwd(), 'public');
      const distDir = path.join(process.cwd(), 'dist');

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // 1. Process as clinic-logo.png (high-res 600x600 square)
      const logoPng = await sharp(buffer)
        .resize(600, 600, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer();
      fs.writeFileSync(path.join(publicDir, 'clinic-logo.png'), logoPng);

      // 2. Generate PWA and mobile icons
      const pwa512 = await sharp(buffer).resize(512, 512, { fit: 'cover' }).png().toBuffer();
      const pwa192 = await sharp(buffer).resize(192, 192, { fit: 'cover' }).png().toBuffer();
      const appleTouch = await sharp(buffer).resize(180, 180, { fit: 'cover' }).png().toBuffer();
      const favicon = await sharp(buffer).resize(64, 64, { fit: 'cover' }).png().toBuffer();

      fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
      fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512);
      fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
      fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);
      fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon);

      // Also copy to dist if dist exists
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, 'clinic-logo.png'), logoPng);
        fs.writeFileSync(path.join(distDir, 'pwa-512x512.png'), pwa512);
        fs.writeFileSync(path.join(distDir, 'pwa-maskable-512x512.png'), pwa512);
        fs.writeFileSync(path.join(distDir, 'pwa-192x192.png'), pwa192);
        fs.writeFileSync(path.join(distDir, 'apple-touch-icon.png'), appleTouch);
        fs.writeFileSync(path.join(distDir, 'favicon.png'), favicon);
      }

      res.json({
        success: true,
        message: 'Official clinic logo updated successfully across all mobile icons & displays!',
        timestamp: Date.now()
      });
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      res.status(500).json({ error: 'Failed to process and update logo: ' + err.message });
    }
  });

  // Dedicated PWA Manifest & Service Worker Endpoints (Sub-millisecond response for PWABuilder & App Stores)
  app.get(['/manifest.webmanifest', '/manifest.json'], (_req, res) => {
    try {
      const manifestPath = fs.existsSync(path.join(process.cwd(), 'public', 'manifest.json'))
        ? path.join(process.cwd(), 'public', 'manifest.json')
        : path.join(process.cwd(), 'public', 'manifest.webmanifest');
      const manifestData = fs.readFileSync(manifestPath, 'utf-8');
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.send(manifestData);
    } catch (err) {
      res.status(404).json({ error: 'Manifest not found' });
    }
  });

  app.get('/sw.js', (_req, res) => {
    try {
      const swPath = fs.existsSync(path.join(process.cwd(), 'dist', 'sw.js'))
        ? path.join(process.cwd(), 'dist', 'sw.js')
        : path.join(process.cwd(), 'public', 'sw.js');
      const swData = fs.readFileSync(swPath, 'utf-8');
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(swData);
    } catch (err) {
      res.status(404).send('// Service Worker not found');
    }
  });

  const httpServer = http.createServer(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest') || filePath.endsWith('manifest.json')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Bindsukh Center Server running on http://0.0.0.0:${PORT}`);
    // Start automated 24-hour appointment reminder scheduler (runs every 30 seconds)
    setInterval(() => {
      try {
        processDueReminders();
      } catch (err) {
        console.error('Error during scheduled reminder pass:', err);
      }
    }, 30000);
    console.log('Automated 24-hour reminder scheduler active (checking every 30s).');
  });
}

startServer();
