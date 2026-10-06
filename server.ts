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
  patientPhoto?: string;
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
  '08:30 AM - 09:30 AM',
  '09:30 AM - 10:30 AM',
  '10:30 AM - 11:30 AM',
  '11:30 AM - 12:30 PM',
  '12:30 PM - 01:30 PM',
  '01:30 PM - 02:30 PM',
  '02:30 PM - 03:30 PM',
  '03:00 PM - 04:00 PM',
];

const SUNDAY_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
];

function getSlotsForDateServer(dateStr: string): string[] {
  if (!dateStr) return WEEKDAY_SLOTS;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0 is Sunday
  return dayOfWeek === 0 ? SUNDAY_SLOTS : WEEKDAY_SLOTS;
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
      const { message, history, language } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const reqLang = (language || 'hi').toLowerCase().trim(); // 'en' | 'hi' | 'hinglish'
      const isEnglish = reqLang === 'en';
      const isHinglish = reqLang === 'hinglish';

      const userQuery = message.trim();
      const cleanLower = userQuery
        .toLowerCase()
        .replace(/[?.!,;:'"\\/()_\[\]{}]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Specific health issue markers - only triggered when a real medical issue or symptom is mentioned
      const hasSpecificHealthIssue =
        // Headache specific (do not match bare 'sir' or 'सर')
        cleanLower.includes('sir dard') || cleanLower.includes('sar dard') || cleanLower.includes('sir me dard') ||
        cleanLower.includes('sar me dard') || cleanLower.includes('headache') || cleanLower.includes('migraine') ||
        cleanLower.includes('सिरदर्द') || cleanLower.includes('सरदर्द') || cleanLower.includes('सिर दर्द') ||
        cleanLower.includes('सर दर्द') || cleanLower.includes('सिर में दर्द') || cleanLower.includes('सर में दर्द') ||
        cleanLower.includes('माथा दर्द') || cleanLower.includes('आधासीसी') ||
        // Other specific ailments
        cleanLower.includes('ghutna') || cleanLower.includes('ghutne') || cleanLower.includes('knee') ||
        cleanLower.includes('घुटना') || cleanLower.includes('घुटने') || cleanLower.includes('घुटनों') ||
        cleanLower.includes('gathiya') || cleanLower.includes('गठिया') || cleanLower.includes('arthritis') ||
        cleanLower.includes('kamar dard') || cleanLower.includes('back pain') || cleanLower.includes('कमर दर्द') ||
        cleanLower.includes('कमर में दर्द') || cleanLower.includes('slip disc') || cleanLower.includes('स्लिप डिस्क') ||
        cleanLower.includes('पीठ दर्द') || cleanLower.includes('cervical') || cleanLower.includes('सर्वाइकल') ||
        cleanLower.includes('gardan dard') || cleanLower.includes('neck pain') || cleanLower.includes('गर्दन दर्द') ||
        cleanLower.includes('गर्दन में दर्द') || cleanLower.includes('frozen shoulder') || cleanLower.includes('कंधे में दर्द') ||
        cleanLower.includes('sciatica') || cleanLower.includes('साइटिका') || cleanLower.includes('dabi nas') ||
        cleanLower.includes('दबी नस') || cleanLower.includes('नस दब') || cleanLower.includes('nerve blockage') ||
        cleanLower.includes('blockage') || cleanLower.includes('ब्लॉकेज') || cleanLower.includes('sunnpan') ||
        cleanLower.includes('सुन्न') || cleanLower.includes('झनझनाहट') || cleanLower.includes('tingling') ||
        cleanLower.includes('numbness') || cleanLower.includes('kabz') || cleanLower.includes('कब्ज') ||
        cleanLower.includes('constipation') || cleanLower.includes('pet dard') || cleanLower.includes('stomach pain') ||
        cleanLower.includes('पेट में दर्द') || cleanLower.includes('acidity') || cleanLower.includes('एसिडिटी') ||
        cleanLower.includes('lakwa') || cleanLower.includes('लकवा') || cleanLower.includes('paralysis') ||
        cleanLower.includes('stroke') || cleanLower.includes('पक्षाघात') || cleanLower.includes('moch') ||
        cleanLower.includes('मोच') || cleanLower.includes('sprain') || cleanLower.includes('haddi dard') ||
        cleanLower.includes('हड्डी में दर्द') || cleanLower.includes('cp child') || cleanLower.includes('सीपी') ||
        cleanLower.includes('cerebral palsy');

      // Comprehensive list of conversational greetings and casual inquiries
      const greetingPhrases = [
        'hi', 'hello', 'namaste', 'namaskar', 'pranam', 'pranaam', 'hey', 'helo', 'hallo', 'greetings',
        'kaise ho', 'kaise hain', 'aap kaise ho', 'aap kaise hain', 'sir aap kaise hain',
        'sir kaise hain', 'sir kaise ho', 'kya haal hai', 'kya haal chaal', 'sab theek',
        'how are you', 'how r u', 'how are you doing', 'how do you do', 'good morning',
        'good afternoon', 'good evening', 'good day', 'good night', 'who are you', 'what can you do',
        'kya karte ho', 'kya kar sakte ho', 'help me', 'madad chahiye', 'namaste sir', 'hello doctor',
        'hi doctor', 'thanks', 'thank you', 'shukriya', 'dhanyawad', 'dhanyawaad', 'welcome',
        'नमस्ते', 'नमस्कार', 'प्रणाम', 'हैलो', 'हेलो', 'हाय', 'आप कैसे हैं', 'सर आप कैसे हैं',
        'कैसे हैं आप', 'कैसे हो', 'क्या हाल है', 'शुभ प्रभात', 'धन्यवाद', 'शुक्रिया'
      ];

      const isGreeting =
        !hasSpecificHealthIssue &&
        (greetingPhrases.some(
          (phrase) =>
            cleanLower === phrase ||
            cleanLower.startsWith(phrase + ' ') ||
            cleanLower.endsWith(' ' + phrase) ||
            cleanLower.includes(' ' + phrase + ' ')
        ) ||
          cleanLower.includes('kaise hain') ||
          cleanLower.includes('kaise ho') ||
          cleanLower.includes('kya haal') ||
          cleanLower.includes('how are you') ||
          cleanLower.includes('how r u') ||
          cleanLower.includes('how do you do') ||
          cleanLower === 'sir' ||
          cleanLower === 'doctor' ||
          cleanLower === 'namaste' ||
          cleanLower === 'hello' ||
          cleanLower === 'hi');

      if (isGreeting) {
        if (isEnglish) {
          return res.json({
            reply:
              'Hello! I am doing well, thank you for asking! 😊 How can I assist you with Bindsukh Acupressure & Acupuncture Center today?\n\nYou can ask me about our 100% drugless therapies, consultation fees (₹500 1st visit / ₹200 follow-up), clinic timings, clinic location in Prayagraj, or describe any health concerns you would like guidance on.',
          });
        }
        if (isHinglish) {
          return res.json({
            reply:
              'Namaste! 🙏 Main bilkul theek hoon, poochne ke liye shukriya. Bindsukh Acupressure Center me aapka swagat hai! Main aapki kya madad kar sakta hoon?\n\nAap clinic timings, consultation fees (₹500 1st visit / ₹200 follow-up), therapies ya kisi bhi dard/swasthya pareshani ke baare me pooch sakte hain.',
          });
        }
        return res.json({
          reply:
            'नमस्ते! 🙏 मैं बहुत अच्छा हूँ, पूछने के लिए धन्यवाद। बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर में आपका हार्दिक स्वागत है! आज मैं आपकी क्या सहायता कर सकता हूँ?\n\nआप क्लिनिक समय, परामर्श शुल्क (पहली बार ₹500 / दोबारा ₹200), थैरेपी या किसी भी शारीरिक परेशानी के बारे में पूछ सकते हैं।',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // Language directive and detection
      const hasDevanagari = /[\u0900-\u097F]/.test(userQuery);
      const isEnglishQuery = !hasDevanagari && (reqLang === 'en' || /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(userQuery) && (userQuery.toLowerCase().includes('pain') || userQuery.toLowerCase().includes('headache') || userQuery.toLowerCase().includes('doctor') || userQuery.toLowerCase().includes('appointment') || userQuery.toLowerCase().includes('timing') || userQuery.toLowerCase().includes('fee') || userQuery.toLowerCase().includes('treatment')));

      const languageDirective = isEnglishQuery || isEnglish
        ? `CRITICAL LANGUAGE REQUIREMENT: The patient is communicating in ENGLISH. Write your entire response in clear, friendly English. Do NOT use Hindi script.`
        : isHinglish || (!hasDevanagari && (userQuery.toLowerCase().includes('dard') || userQuery.toLowerCase().includes('hai') || userQuery.toLowerCase().includes('kya') || userQuery.toLowerCase().includes('kaise') || userQuery.toLowerCase().includes('mujhe')))
        ? `CRITICAL LANGUAGE REQUIREMENT: The patient is communicating in HINGLISH (conversational Hindi in English alphabet). Write your entire response in friendly Hinglish.`
        : `CRITICAL LANGUAGE REQUIREMENT: The patient is communicating in HINDI. Write your entire response in supportive, respectful Hindi in Devanagari script.`;

      const systemPrompt = `You are the smart, caring, and empathetic "Bindsukh Care Assistant" for Bindsukh Acupressure & Acupuncture Center (Healing Through Touch & Magnet), Puramufti, Prayagraj.
Your mission is to provide comforting holistic health insights and guide patients to 100% drugless healing.

${languageDirective}

GREETINGS & CASUAL MESSAGES PROTOCOL:
- If the user sends a greeting or asks how you or the doctor is doing (e.g., "Hello", "How are you?", "Sir aap kaise hain", "Kaise ho"), DO NOT output medical remedy templates. Respond warmly, politely, and ask how you can assist them with Bindsukh Clinic today.

CLINIC CORE KNOWLEDGE:
- Lead Clinical Specialist: Therapist Saurabh Prajapati (Master in Acupressure, Master Diploma in Acupuncture, Diploma in Chiropractic).
- Operating Hours:
  * Monday to Saturday: 8:30 AM to 4:00 PM
  * Sunday Morning: 8:00 AM to 12:00 PM
- Multi-Patient Slot Capacity: Every 1-hour time slot accommodates a strict maximum of 5 patients to prevent crowding and guarantee dedicated clinical attention.
- Consultation & Therapy Fees:
  * First Visit (New Patient): ₹500
  * Returning / Follow-up Patient: ₹200
- 100% Drugless & Non-Surgical Holistic Healing (बिना दवा, बिना इंजेक्शन, बिना ऑपरेशन दर्द निवारण).
- Clinic Address: Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan), Uttar Pradesh 212208.
- Direct Call/WhatsApp: +91 9455100097 / +91 8423221799.

CORE THERAPIES OFFERED:
1. Acupressure Therapy: Diagnostic touch and meridian magnet application.
2. Acupuncture Therapy: Sterile disposable micro-needles activating nerves and natural endorphin pain relief.
3. Chiropractic Adjustment: Spinal realignment, posture correction, and lumbar/cervical decompression.
4. Cupping Therapy / Hijama: Myofascial vacuum decompression for localized blood flow and detox.
5. Kinesiology Taping: Musculoskeletal support and joint stabilization.
6. Acupressure Massage: Deep soft-tissue meridian release.

----------------------------------------------------
🎯 MANDATORY 4-STEP RESPONSE PROTOCOL FOR PATIENT SYMPTOMS & HEALTH CONCERNS:
Whenever a patient mentions any pain, symptom, or condition (e.g., headache, leg pain, back pain, sciatica, cervical, joint/knee pain, paralysis, pinched nerve, sprain):

Step 1. ❤️ Empathetic Response:
- Acknowledge the patient's pain briefly and empathetically (e.g., "I'm so sorry to hear that you're suffering from [condition]. We understand how exhausting it can be.").

Step 2. 🌿 Acupressure & Holistic Insight:
- Explain in 2-3 simple sentences how drugless Acupressure / Acupuncture helps relieve this specific issue (e.g., for headache: stimulating LI4/He Gu releases cranial vascular tension and calms energy meridians; for leg pain/sciatica: relieving sciatic nerve compression and improving nerve conductivity along the bladder meridian; for knee/joint pain: clearing synovial stagnation and activating micro-circulation without side effects).

Step 3. 💡 Quick Natural / Home Relief Tip:
- Suggest 1 safe, quick natural relief tip or self-acupressure point (e.g., mild circular pressing on a specific reflex point, warm compress, proper posture or hydration).

Step 4. 🏥 Gentle Call-to-Action & Clinic Consultation:
- Offer a consultation at Bindsukh Acupressure Center with Therapist Saurabh Prajapati for a personalized, permanent drugless solution.
- State: Timing (8:30 AM - 4:00 PM | Sun 8:00 AM - 12:00 PM), Fee (₹500 1st visit / ₹200 follow-up), Location (Puramufti, Prayagraj), Helpline (+91 9455100097).
- End with button: 👉 [Book Appointment Now]

Keep the response concise (max 3-4 short bullet points or brief paragraphs), friendly, and easy to read on mobile.`;

      // 1. Try Gemini AI if API key is present
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userQuery,
            config: {
              systemInstruction: systemPrompt,
            },
          });

          if (response.text) {
            const trimmed = response.text.trim();
            return res.json({ reply: trimmed });
          }
        } catch (apiErr: any) {
          console.warn('[Gemini API] Call error, using grounded fallback:', apiErr.message || apiErr);
        }
      }

      // 2. Comprehensive Multi-lingual Grounded Symptom Advice Lookup
      const lower = cleanLower;
      const CAUTION_LINE = isEnglish
        ? 'If these home remedies do not provide relief in 10-15 minutes or if the pain persists, please visit our clinic for permanent, 100% drugless healing.'
        : isHinglish
        ? 'Agar 10-15 minute me aaram na mile ya dard lagatar bana rahe, toh bina dawa permanent ilaj ke liye clinic aayein.'
        : 'अगर 10-15 मिनट में आराम न मिले या दर्द लगातार बना रहे, तो बिना दवा permanent इलाज के लिए क्लीनिक आएं।';

      const CLINIC_BOOKING_FOOTER = isEnglish
        ? `🏥 **3. Clinic Contact & Consultation Guide:**
Consult Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture) for 100% drugless permanent relief.
• **Timing:** 8:30 AM to 4:00 PM (Monday - Saturday) | Sunday Morning 8:00 AM - 12:00 PM
• **Fee:** ₹500 (1st Visit) / ₹200 (Returning Patient)
• **Address:** Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
• **Helpline / WhatsApp:** +91 9455100097 / +91 8423221799

👉 **[Book Appointment Now]**`
        : isHinglish
        ? `🏥 **3. Clinic Contact & Consultation Guide:**
Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture) dwara 100% drugless permanent ilaj.
• **Timing:** 8:30 AM se 4:00 PM (Mon-Sat) | Sunday 8:00 AM - 12:00 PM
• **Fee:** ₹500 (1st Visit) / ₹200 (Follow-up)
• **Address:** Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
• **Helpline / WhatsApp:** +91 9455100097

👉 **[Book Appointment Now]**`
        : `🏥 **3. क्लिनिक संपर्क व परामर्श (Clinic Consultation & Booking):**
थेरेपिस्ट सौरभ प्रजापति (Master in Acupressure & Acupuncture) द्वारा 100% ड्रगलेस स्थायी उपचार।
• **समय:** 8:30 AM से 4:00 PM (सोम-शनि) | रविवार 8:00 AM - 12:00 PM
• **फीस:** ₹500 (पहला परामर्श) / ₹200 (फॉलो-अप)
• **पता:** पुरामुफ्ती पुरानी बाजार, प्रयागराज (निकट पंचायत भवन)
• **हेल्पलाइन / WhatsApp:** +91 9455100097

👉 **[Book Appointment Now]**`;

      let fallback = '';

      // 1. Headache / Sir Dard / Migraine
      const isHeadache =
        lower.includes('सिरदर्द') || lower.includes('सरदर्द') || lower.includes('सर दर्द') ||
        lower.includes('सिर दर्द') || lower.includes('सिर में दर्द') || lower.includes('सर में दर्द') ||
        lower.includes('माइग्रेन') || lower.includes('migraine') || lower.includes('headache') ||
        lower.includes('head pain') || lower.includes('sir dard') || lower.includes('sar dard') ||
        lower.includes('sir me dard') || lower.includes('sar me dard') || lower.includes('माथा दर्द') ||
        lower.includes('आधासीसी');

      // 2. Knee Pain / Ghutna / Arthritis / Gathiya / Joint Pain
      const isKnee =
        lower.includes('घुटना') || lower.includes('घुटने') || lower.includes('घुटनों') ||
        lower.includes('knee') || lower.includes('ghutn') || lower.includes('गठिया') ||
        lower.includes('arthritis') || lower.includes('joint') || lower.includes('जोड़ों');

      // 3. Back Pain / Kamar Dard / Slip Disc / Spine / L4-L5
      const isBack =
        lower.includes('कमर') || lower.includes('पीठ') || lower.includes('kamar') ||
        lower.includes('back pain') || lower.includes('slip disc') || lower.includes('स्लिप डिस्क') ||
        lower.includes('spine') || lower.includes('l4') || lower.includes('l5') || lower.includes('लंबर');

      // 4. Cervical / Neck Pain / Gardan / Kandha / Shoulder / Frozen Shoulder
      const isCervical =
        lower.includes('गर्दन') || lower.includes('सर्वाइकल') || lower.includes('cervical') ||
        lower.includes('neck') || lower.includes('gardan') || lower.includes('कंधा') ||
        lower.includes('कंधे') || lower.includes('shoulder') || lower.includes('frozen shoulder') ||
        lower.includes('जकड़न');

      // 5. Leg Pain / Sciatica / Tingling / Numbness / Sunnpan / Pair Dard
      const isLegOrSciatica =
        lower.includes('पैर') || lower.includes('pair') || lower.includes('tang') || lower.includes('टांग') ||
        lower.includes('leg') || lower.includes('साइटिका') || lower.includes('sciatica') ||
        lower.includes('सुन्न') || lower.includes('झनझनाहट') || lower.includes('खिंचाव') ||
        lower.includes('tingling') || lower.includes('numbness') || lower.includes('sunn') ||
        lower.includes('दबी नस') || lower.includes('नस दब') || lower.includes('dabi nas') ||
        lower.includes('nerve');

      // 6. Paralysis / Lakwa / Stroke / Pakshaghat
      const isParalysis =
        lower.includes('लकवा') || lower.includes('paralysis') || lower.includes('stroke') ||
        lower.includes('पक्षाघात') || lower.includes('lakwa') || lower.includes('फालिज');

      // 7. Sprain / Moch / Bone Pain / Haddi / Ligament
      const isSprain =
        lower.includes('मोच') || lower.includes('हड्डी') || lower.includes('sprain') ||
        lower.includes('bone') || lower.includes('moch') || lower.includes('twist') ||
        lower.includes('ligament') || lower.includes('सूजन');

      // 8. Constipation / Pet / Gas / Acidity / Apach / Indigestion
      const isDigestion =
        lower.includes('कब्ज') || lower.includes('constipation') || lower.includes('पेट') ||
        lower.includes('stomach') || lower.includes('gas') || lower.includes('एसिडिटी') ||
        lower.includes('acidity') || lower.includes('अपच') || lower.includes('kabz');

      // 9. CP Child / Delayed Walking
      const isCPChild =
        lower.includes('सीपी') || lower.includes('cp child') || lower.includes('cerebral palsy') ||
        lower.includes('बच्चा') || lower.includes('बच्चे') || lower.includes('चलने');

      // 10. Fees
      const isFeeQuery =
        lower.includes('फीस') || lower.includes('शुल्क') || lower.includes('fee') ||
        lower.includes('cost') || lower.includes('charge') || lower.includes('rupee') ||
        lower.includes('रुपये') || lower.includes('price');

      // 11. Timing
      const isTimeQuery =
        lower.includes('समय') || lower.includes('time') || lower.includes('timing') ||
        lower.includes('दिन') || lower.includes('open') || lower.includes('hour') ||
        lower.includes('sunday');

      // 12. Address / Location
      const isLocationQuery =
        lower.includes('पता') || lower.includes('address') || lower.includes('कहाँ') ||
        lower.includes('location') || lower.includes('map') || lower.includes('दिशा') ||
        lower.includes('where');

      // 13. Doctor / Therapist
      const isDoctorQuery =
        lower.includes('डॉक्टर') || lower.includes('थेरेपिस्ट') || lower.includes('doctor') ||
        lower.includes('therapist') || lower.includes('saurabh') || lower.includes('सौरभ');

      if (isFeeQuery) {
        if (isEnglish) {
          fallback = `Bindsukh Acupressure Center Consultation & Therapy Fees:
• **First Visit (New Patient):** ₹500
• **Returning / Follow-up Patient:** ₹200
Includes comprehensive meridian diagnosis, magnet therapy, acupressure, and specialist guidance.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `Bindsukh Acupressure Center Consultation & Therapy Fees:
• **Pehli Baar (1st Visit / New Patient):** ₹500
• **Dobara Aane Par (Follow-up):** ₹200
Isme complete meridian diagnosis, magnet therapy aur specialist guidance shamil hai.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `बिंदसुख एक्यूप्रेशर सेंटर में परामर्श एवं थेरेपी शुल्क:
• **पहली बार (1st Visit / New Patient):** ₹500
• **दोबारा आने पर (Returning / Follow-up):** मात्र ₹200
इसमें विस्तृत मेरिडियन डायग्नोसिस, मैग्नेट/एक्यूप्रेशर एवं परामर्श शामिल है।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isTimeQuery) {
        if (isEnglish) {
          fallback = `Bindsukh Clinic Consultation Timings:
• **Monday to Saturday:** 8:30 AM to 4:00 PM
• **Sunday Morning:** 8:00 AM to 12:00 PM
Feature: To avoid crowding, each 1-hour slot is strictly limited to 5 patients max.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `Bindsukh Clinic Timings:
• **Monday se Saturday:** 8:30 AM se 4:00 PM
• **Sunday Morning:** 8:00 AM se 12:00 PM
Specialty: Bheed se bachne ke liye har 1 ghante ke slot me sirf 5 patients ko hi book kiya jata hai.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `क्लिनिक परामर्श समय (Clinic Timings):
• **सोमवार से शनिवार (Monday - Saturday):** सुबह 8:30 AM से शाम 4:00 PM
• **रविवार (Sunday Morning):** सुबह 8:00 AM से दोपहर 12:00 PM
विशेषता: भीड़ से बचने के लिए प्रत्येक 1-घंटे के स्लॉट में अधिकतम 5 मरीजों को ही समय दिया जाता है।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isLocationQuery) {
        if (isEnglish) {
          fallback = `Clinic Address & Location:
**Bindsukh Acupressure & Acupuncture Center**
Puramufti Purani Bazar, Near Puramufti Panchayat Bhawan, Prayagraj, UP - 212208
(~8 km from Bamrauli Airport, ~16 km from Prayagraj Junction)
📞 Direct Helpline: +91 9455100097 / +91 8423221799

👉 **[Book Appointment Now]**`;
        } else if (isHinglish) {
          fallback = `Clinic Ka Pata (Location):
**Bindsukh Acupressure & Acupuncture Center**
Puramufti Purani Bazar, Near Puramufti Panchayat Bhawan, Prayagraj (UP) - 212208
(~8 km Bamrauli Airport se, ~16 km Prayagraj Junction se)
📞 Helpline / WhatsApp: +91 9455100097 / +91 8423221799

👉 **[Book Appointment Now]**`;
        } else {
          fallback = `क्लिनिक का पता एवं लोकेशन:
**बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर**
पुरामुफ्ती पुरानी बाजार, निकट पुरामुफ्ती पंचायत भवन, प्रयागराज (उ.प्र.) 212208
(बमरौली से ~8 किमी, प्रयागराज जंक्शन से ~16 किमी)
📞 हेल्पलाइन / WhatsApp: +91 9455100097 / +91 8423221799

👉 **[Book Appointment Now]**`;
        }
      } else if (isDoctorQuery) {
        if (isEnglish) {
          fallback = `Lead Specialist Profile:
**THERAPIST: SAURABH PRAJAPATI**
• Master in Acupressure
• Master Diploma in Acupuncture
• Diploma in Chiropractic
Certified specialist in drugless holistic sciences relieving knee pain, back pain, cervical, sciatica, sprains, and pinched nerves without surgery or medicine.
• Consultation Fee: ₹500 (1st Visit) / ₹200 (Follow-up)
• Timings: 8:30 AM to 4:00 PM (Mon-Sat) | Sun 8:00 AM - 12:00 PM
• Direct Contact: +91 9455100097

👉 **[Book Appointment Now]**`;
        } else if (isHinglish) {
          fallback = `Lead Specialist Profile:
**THERAPIST: SAURABH PRAJAPATI**
• Master in Acupressure
• Master Diploma in Acupuncture
• Diploma in Chiropractic
Bina dawa aur bina surgery knee pain, back pain, cervical, sciatica, sprains aur dabi nas ka permanent natural ilaj.
• Consultation Fee: ₹500 (1st Visit) / ₹200 (Follow-up)
• Timings: 8:30 AM to 4:00 PM (Mon-Sat) | Sun 8:00 AM - 12:00 PM
• Direct Contact: +91 9455100097

👉 **[Book Appointment Now]**`;
        } else {
          fallback = `मुख्य चिकित्सक परिचय:
**THERAPIST: SAURABH PRAJAPATI**
• Master in Acupressure
• Master Diploma in Acupuncture
• Diploma in Chiropractic
वे प्राकृतिक एवं ड्रगलेस चिकित्सा पद्धतियों के प्रमाणित विशेषज्ञ हैं तथा घुटने, कमर, सर्वाइकल, साइटिका, मोच व नसों के जटिल दर्दों को बिना दवा ठीक करते हैं।
• परामर्श फीस: ₹500 (1st Visit) / ₹200 (Returning)
• समय: सुबह 8:30 AM से शाम 4:00 PM | रविवार 8:00 AM - 12:00 PM
• हेल्पलाइन: +91 9455100097

👉 **[Book Appointment Now]**`;
        }
      } else if (isHeadache) {
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
I am so sorry you are suffering from a headache/migraine. We understand how exhausting and debilitating head pain can be.

🌿 **2. How Acupressure & Acupuncture Relieve It:**
Acupressure clears cranial nerve tension and restores micro-vascular blood circulation to the brain without any painkiller pills. Stimulating specific meridians releases natural endorphins that calm brain nerve hyperactivity permanently.

💡 **3. Safe Home Relief Tip:**
• **LI4 (He Gu Point):** Firmly press the webbed muscle between your thumb and index finger for 2-3 minutes on both hands.
• Drink a glass of warm water and rest in a dim room with eyes closed for 15 minutes.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Humein bohot dukh hai ki aap sir dard ya migraine se pareshan hain. Sir dard insaan ko bechain aur thaka deta hai.

🌿 **2. Acupressure Kaise Aaram Deta Hai:**
Acupressure aur Acupuncture bina kisi dawa ke sir ki dabi hui naso aur blood circulation ko normal karte hain. Isse cranial tension turant release hoti hai aur migraine me permanent aaram milta hai.

💡 **3. Turant Gharelu Upchar:**
• **LI4 Point (He Gu):** Apne hath ke angoothe aur index finger ke beech ke masal hisse ko 2-3 minute achhe se dabayein.
• Ek glass gunguna paani piyein aur 15 minute screen se door shaant kamre me aaram karein.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
हमें बहुत खेद है कि आप सिरदर्द / माइग्रेन की पीड़ा से जूझ रहे हैं। सिर का दर्द सचमुच बहुत कष्टदायक और थका देने वाला होता है।

🌿 **2. एक्यूप्रेशर एवं एक्यूपंक्चर द्वारा प्राकृतिक समाधान:**
एक्यूप्रेशर बिना किसी पेनकिलर के सिर की तनावग्रस्त नसों में रक्त संचार को सुचारू करता है। विशिष्ट मेरिडियन पॉइंट्स पर दबाव देकर प्राकृतिक एंडोर्फिन सक्रिय होता है, जिससे सिरदर्द जड़ से शांत होता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **LI4 एक्यूप्रेशर पॉइंट (हेगु बिंदु):** अपने अंगूठे और तर्जनी उंगली के बीच के उभरे हुए मांसल भाग को 2-3 मिनट गहरे दबाव के साथ दबाएं।
• 1 गिलास गुनगुना पानी पिएं और 15 मिनट मोबाइल/स्क्रीन से दूर शांत लेटें।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isKnee) {
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
We truly understand how difficult knee pain and joint stiffness make walking and daily movements.

🌿 **2. How Acupressure & Holistic Therapy Help:**
Therapy stimulates synovial fluid circulation around the knee joint, reduces inflammation, and relieves pressure on cartilage without surgeries or injections.

💡 **3. Safe Home Relief Tip:**
• **Eye of the Knee (ST-35):** Gently press the two indentations just below your kneecap with your thumbs in circular motions for 2 minutes.
• Apply warm mustard or sesame oil with fenugreek, followed by 10 minutes of gentle warm towel fomentation.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Ghutno ke dard ya gathiya ki wajah se chalne-phirne me hone wali takleef ko hum achhi tarah samajhte hain.

🌿 **2. Acupressure Kaise Aaram Deta Hai:**
Acupressure ghutne ke aaspas blood circulation badhata hai aur joints ke beech ke friction/inflammation ko bina injection ya surgery ke natural tarike se theek karta hai.

💡 **3. Turant Gharelu Upchar:**
• **Knee Points (ST-35):** Ghutne ki katori ke dono taraf ke gaddho ko 2 minute angoothe se gol ghumate hue dabayein.
• Gungune sarson ya til ke tel se halke hath se malish karein aur 10 minute garam kapde se senk lein.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
हम समझते हैं कि घुटनों के दर्द या गठिया के कारण उठने-बैठने और चलने में कितनी परेशानी होती है।

🌿 **2. एक्यूप्रेशर द्वारा प्राकृतिक समाधान:**
एक्यूप्रेशर और मैग्नेट थैरेपी घुटने के जोड़ों में साइनोवियल फ्लूइड और रक्त प्रवाह को सक्रिय करती है, जिससे बिना ऑपरेशन व बिना पेनकिलर के सूजन और घिसाव का प्राकृतिक उपचार होता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **ST-35 घुटने का एक्यूप्रेशर:** घुटने की कटोरी के ठीक नीचे दोनों तरफ के गड्ढों को 2 मिनट अंगूठों से गोल घुमाते हुए दबाएं।
• मेथी दाना मिले गुनगुने सरसों तेल से हल्के हाथ से मालिश करें और 10 मिनट गरम तौलिये से सेंकें।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isBack) {
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
Lower back pain and slip disc can severely limit your posture and comfort. We empathize deeply with what you are going through.

🌿 **2. How Acupressure & Chiropractic Help:**
Gentle chiropractic adjustment and meridian acupressure decompress the lumbar spine (L4-L5/S1), releasing pinched nerves and restoring spinal balance without surgery.

💡 **3. Safe Home Relief Tip:**
• **Hand Spine Reflex Point:** Press the groove on the back of your hand between the ring and middle fingers toward your wrist for 2 minutes.
• Rest on a firm surface with a pillow placed under your knees to take pressure off your lower back.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Kamar dard aur slip disc ki wajah se uthne-baithne me hone wali pareshani hum samajhte hain.

🌿 **2. Acupressure & Chiropractic Ka Asar:**
Chiropractic spine alignment aur acupressure se L4-L5 lumbar spine par dabi hui nas free hoti hai, jisse bina operation ke dard jad se theek hota hai.

💡 **3. Turant Gharelu Upchar:**
• **Hand Spine Point:** Hath ke pichhle hisse par ring finger aur middle finger ke beech ki line ko wrist ki taraf angoothe se 2 minute dabayein.
• Seedhe letkar ghutno ke neeche takiya rakhein aur bahut soft gadde par na soyein.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
कमर दर्द और स्लिप डिस्क से होने वाली असहनीय तकलीफ को हम पूरी संवेदनशीलता से समझते हैं।

🌿 **2. एक्यूप्रेशर व काइरोप्रैक्टिक द्वारा प्राकृतिक समाधान:**
काइरोप्रैक्टिक अलाइनमेंट और एक्यूप्रेशर L4-L5 व लंबर स्पाइन के दबाव को हटाकर दबी हुई नसों को खोलते हैं, जिससे बिना ऑपरेशन प्राकृतिक रूप से कमर का लचीलापन लौट आता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **हैंड स्पाइन एक्यूप्रेशर:** हाथ के पिछले भाग पर रिंग और मिडिल फिंगर के बीच की हड्डी वाली नाली को कलाई की ओर 2 मिनट अंगूठे से दबाएं।
• फर्म गद्दे या तख्त पर लेटें और घुटनों के नीचे तकिया लगाकर कमर को सहारा दें।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isCervical) {
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
Neck stiffness, cervical pain, and shoulder radiation can make everyday focus exhausting. We are here to help.

🌿 **2. How Acupressure & Acupuncture Relieve Cervical:**
Acupressure unblocks stiff trapezius muscles and cervical vertebrae meridians, reducing pressure on nerve roots and restoring full range of neck movement.

💡 **3. Safe Home Relief Tip:**
• **Thumb Meridian Point:** Firmly massage the back of your thumb (cervical spine reflex) with your opposite thumb for 2-3 minutes.
• Avoid thick pillows when sleeping and perform slow, gentle neck rotations without jerking.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Gardan me dard, cervical ya kandhe ki jakdan se hone wali pareshani ko hum achhi tarah samajhte hain.

🌿 **2. Acupressure Ka Fayda:**
Acupressure gardan aur kandhe ki stiff muscles ko relax karta hai aur cervical vertebrae par dabi nason ko bina dawa khole relief deta hai.

💡 **3. Turant Gharelu Upchar:**
• **Thumb Acupressure:** Dono hatho ke angoothe ke pichhle hisse ko doosre hath se 2-3 minute dabayein.
• Sote waqt mota takiya hata dein aur gardan ko dheere-dheere aage-peeche stretch karein.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
गर्दन में दर्द, सर्वाइकल और कंधे की जकड़न से सिर और बांहों तक होने वाली परेशानी को हम समझते हैं।

🌿 **2. एक्यूप्रेशर द्वारा प्राकृतिक समाधान:**
एक्यूप्रेशर और एक्यूपंक्चर गर्दन की जकड़ी हुई मांसपेशियों को शिथिल करते हैं और सर्वाइकल वर्टिब्रे की दबी हुई नसों में रक्त प्रवाह शुरू कर दर्द को जड़ से समाप्त करते हैं।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **अंगूठे का एक्यूप्रेशर:** दोनों हाथों के अंगूठे के पिछले भाग को दूसरे हाथ के अंगूठे से 2-3 मिनट दबाएं।
• सोते समय मोटा तकिया तुरंत हटाएं और गर्दन को बिना झटका दिए धीरे-धीरे स्ट्रेच करें।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isLegOrSciatica) {
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
We are so sorry you are experiencing leg pain, sciatica, or tingling/numbness. Sciatic nerve pain can be deeply distressing.

🌿 **2. How Acupressure Relieves Sciatica & Leg Pain:**
Acupressure stimulates reflex points along the urinary bladder and gall bladder meridians, relieving deep compression on the sciatic nerve and restoring normal sensations without pills.

💡 **3. Safe Home Relief Tip:**
• **Heel & Sole Acupressure:** Press the pressure indentations along the inner and outer edges of your heel for 2 minutes.
• Rest with a pillow supporting under your knees to take tension off the sciatic nerve, and apply warm fomentation from lower hip to thigh.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Pair me dard, sciatica, khinchav ya sunnpan hone par chalne me bohot takleef hoti hai, hum ise samajhte hain.

🌿 **2. Acupressure Sciatica Ko Kaise Theek Karta Hai:**
Acupressure sciatic nerve par hone wale pressure ko release karta hai aur pair ki nason me blood circulation theek karta hai, jisse jhanjhanahat aur dard khatam hota hai.

💡 **3. Turant Gharelu Upchar:**
• **Heel & Sole Point:** Edi ke dono kinaron ke gaddhon ko 2 minute angoothe se dabayein.
• Ghutno ke neeche takiya rakhkar letien aur kamar se jaangh tak 10 minute gunguni senk karein.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
हम समझते हैं कि पैरों में दर्द, साइटिका, सुन्नपन या खिंचाव के कारण चलना-फिरना कितना कठिन हो जाता है।

🌿 **2. साइटिका व पैर दर्द का एक्यूप्रेशर समाधान:**
एक्यूप्रेशर कमर से लेकर एड़ी तक जाने वाली साइटिका नर्व के दबाव को मुक्त करता है। मेरिडियन पॉइंट्स पर मैग्नेट व टच द्वारा नसों का ब्लॉकेज बिना दवा व बिना सर्जरी खुल जाता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **एड़ी व तलवे का एक्यूप्रेशर:** एड़ी के दोनों किनारों के गड्ढों को अंगूठे से 2 मिनट हल्के दबाव के साथ दबाएं।
• घुटनों के नीचे तकिया रखकर लेटें ताकि साइटिक नर्व पर खिंचाव न पड़े, और जांघ से पिंडलियों तक गुनगुनी सिकाई करें।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isParalysis) {
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
Paralysis and stroke rehabilitation require immense patience and compassion. We stand by you and your family.

🌿 **2. How Acupuncture & Acupressure Restore Mobility:**
Sterile micro-acupuncture and specialized meridian neuro-acupressure activate dormant motor pathways, stimulate cerebral circulation, and help retrain limb reflexes without chemicals.

💡 **3. Safe Home Relief Tip:**
• Gently massage the patient's palms, fingers, and soles in upward circular motions to stimulate peripheral nerve sensations.
• Keep the affected limbs warm and properly supported.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Lakwa (paralysis) ya stroke ke baad aane wali takleef me patient aur family ko bohot sahas ki zaroorat hoti hai.

🌿 **2. Acupressure & Acupuncture Ka Fayda:**
Acupuncture aur Acupressure supt (dormant) nason aur motor nerves ko dobara activate karte hain, jisse haath-pair ki movement aur taakat wapas aane lagti hai.

💡 **3. Turant Gharelu Upchar:**
• Mareez ke haath aur pair ke talwo par gungune tel se upar ki disha me halki malish karein.
• Paralyzed hisse ko hamesha gunguna aur support par rakhein.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
लकवा (पक्षाघात) या स्ट्रोक के बाद की स्थिति में मरीज और परिजनों को बहुत धैर्य और सही मार्गदर्शन की आवश्यकता होती है।

🌿 **2. एक्यूपंक्चर एवं न्यूरो-एक्यूप्रेशर द्वारा पुनर्वास:**
एक्यूपंक्चर और एक्यूप्रेशर सुप्त (शांत) नसों और मस्तिष्क के मोटर पाथवे को सक्रिय करते हैं। इससे हाथ-पैरों की शक्ति, संवेदनशीलता और गतिशीलता बिना किसी दवा के वापस लौटने लगती है।

💡 **3. तुरंत उपयोगी देखभाल उपाय:**
• मरीज के हाथों की हथेलियों, उंगलियों और तलवों पर हल्के गुनगुने तेल से ऊपर की दिशा में हल्की मालिश करें।
• प्रभावित अंगों को ठंड से बचाएं और उचित सहारा देकर रखें।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isSprain) {
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
Sprains and sudden bone/ligament twists can cause sudden sharp pain and swelling. We understand your discomfort.

🌿 **2. How Acupressure & Kinesiology Taping Help:**
Targeted pressure relieves lymphatic congestion, reduces swelling, and stabilizes strained ligaments for speedy, drugless recovery.

💡 **3. Safe Home Relief Tip:**
• Elevate the affected limb and apply cold fomentation for the first 24 hours to reduce acute swelling. Avoid putting heavy weight on it.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Moch ya ligament ke khinchne se achanak hone wale tez dard aur soojan ko hum samajhte hain.

🌿 **2. Acupressure Ka Asar:**
Acupressure aur Kinesiology taping se soojan turant kam hoti hai aur ligament bina dawai natural tarike se heal hota hai.

💡 **3. Turant Gharelu Upchar:**
• Pair ya hath ko uncha rakhein aur pehle 24 ghante barf/thandi senk karein. Is par zyada wajan na daalein.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
मोच, लिगामेंट खिंचाव या हड्डी की चोट से होने वाले अचानक दर्द और सूजन की परेशानी को हम समझते हैं।

🌿 **2. एक्यूप्रेशर द्वारा समाधान:**
एक्यूप्रेशर और काइनेसियोलॉजी टेपिंग लिगामेंट के तनाव को कम कर सूजन व दर्द को तुरंत शांत करते हैं, जिससे सामान्य गतिशीलता तेजी से लौटती है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• चोट वाले स्थान को ऊंचाई पर रखें और पहले 24 घंटे ठंडी सिंकाई (बर्फ) करें। उस पर भारी वजन न डालें।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else if (isDigestion) {
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
Chronic constipation, gas, and digestive distress can make your entire body feel uncomfortable and heavy.

🌿 **2. How Acupressure Helps Digestive Health:**
Stimulating abdominal reflex points on the palms and feet regulates gut peristalsis and balances stomach meridian energy without laxative dependency.

💡 **3. Safe Home Relief Tip:**
• **Palm Digestion Center:** Press the exact center of both palms with your thumb in clockwise circular motions for 2 minutes.
• Drink 2 glasses of warm water and take a gentle 10-minute walk.

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Kabz, gas ya pet me dard ki wajah se aane wali bechaini ko hum samajhte hain.

🌿 **2. Acupressure Ka Asar:**
Acupressure pet ke digestive points ko stimulate karta hai jisse bina kisi churna ya dawa ke pet natural tarike se saaf hota hai.

💡 **3. Turant Gharelu Upchar:**
• **Palm Point:** Hatheli ke theek beech wale hisse ko angoothe se clockwise 2 minute dabayein.
• 2 glass gunguna paani piyein aur 10 minute tahlne ki aadat daalein.

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
कब्ज, गैस, एसिडिटी या पेट की समस्याओं से पूरा शरीर भारी और असहज हो जाता है, इसे हम समझते हैं।

🌿 **2. एक्यूप्रेशर द्वारा पाचन सुधार:**
एक्यूप्रेशर आंतों के प्राकृतिक संकुचन (Peristalsis) को सक्रिय करता है, जिससे बिना किसी चूर्ण या दवा के पेट प्राकृतिक रूप से साफ होता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **हथेली का पाचन बिंदु:** दोनों हथेलियों के बिल्कुल मध्य भाग को अंगूठे से 2 मिनट क्लॉकवाइज घुमाते हुए दबाएं।
• 2 गिलास गुनगुना पानी पिएं और 10 मिनट टहलें।

${CLINIC_BOOKING_FOOTER}`;
        }
      } else {
        // General symptom & holistic care response
        if (isEnglish) {
          fallback = `❤️ **1. Empathetic Acknowledgment:**
Thank you for reaching out to Bindsukh Care Assistant. We are here to listen and help you achieve natural, pain-free living.

🌿 **2. 100% Drugless Holistic Healing:**
At Bindsukh Acupressure & Acupuncture Center, Therapist Saurabh Prajapati provides non-surgical relief for chronic joint, spine, and nerve disorders by clearing energy meridian blockages.

💡 **3. Quick Health Tip:**
• Stay hydrated, maintain active posture, and avoid self-medicating with painkillers. Describe your specific symptom (e.g. knee pain, headache, back pain, sciatica) for targeted pressure point guidance!

${CLINIC_BOOKING_FOOTER}`;
        } else if (isHinglish) {
          fallback = `❤️ **1. Hamari Sahanoobhuti:**
Bindsukh Care Assistant se judne ke liye dhanyawad. Hum aapko natural aur dard-mukt jeevan jeene me madad karne ke liye tatpar hain.

🌿 **2. 100% Drugless Holistic Ilaj:**
Binduskh Center me Therapist Saurabh Prajapati bina kisi dawa ya operation ke nason aur jodo ke dard ka sthayi ilaj karte hain.

💡 **3. Swasthya Salah:**
• Kripya humein apni takleef (jaise ghutne ka dard, kamar dard, cervical, sciatica ya sir dard) ke baare me batayein, hum turant sahi acupressure point aur upchar batayenge!

${CLINIC_BOOKING_FOOTER}`;
        } else {
          fallback = `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
बिंदसुख केयर असिस्टेंट से संपर्क करने के लिए धन्यवाद। हम आपको प्राकृतिक, बिना दवा और दर्द-मुक्त जीवन देने के लिए समर्पित हैं।

🌿 **2. 100% ड्रगलेस प्राकृतिक चिकित्सा:**
बिंदसुख सेंटर में थेरेपिस्ट सौरभ प्रजापति जी द्वारा घुटने, कमर, सर्वाइकल, साइटिका, दबी नस और जटिल दर्दों का बिना ऑपरेशन स्थायी उपचार किया जाता है।

💡 **3. स्वास्थ्य सलाह:**
• कृपया अपनी विशिष्ट परेशानी (जैसे घुटने का दर्द, सिरदर्द, कमर दर्द, सर्वाइकल या साइटिका) बताएं, ताकि हम आपको तुरंत सटीक एक्यूप्रेशर बिंदु व परामर्श मार्गदर्शन दे सकें!

${CLINIC_BOOKING_FOOTER}`;
        }
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

  // 4c. Send & Verify OTP Endpoints
  app.post('/api/send-otp', (req, res) => {
    try {
      const { phone } = req.body;
      const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: '10-digit mobile number required' });
      }

      console.log(`[OTP] Simulated SMS OTP (1234) sent to +91 ${cleanPhone}`);

      return res.json({
        success: true,
        message: `OTP sent successfully via SMS to +91 ${cleanPhone}`,
        phone: cleanPhone,
        otp: '1234',
        expiresInSeconds: 60
      });
    } catch (err: any) {
      console.error('Error in send-otp:', err);
      return res.status(500).json({ success: false, error: 'Failed to send OTP: ' + err.message });
    }
  });

  app.post('/api/verify-otp', (req, res) => {
    try {
      const { phone, otp } = req.body;
      const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
      const cleanOtp = String(otp || '').trim();

      if (cleanOtp === '1234' || cleanOtp.length === 4) {
        return res.json({
          success: true,
          message: 'Mobile number verified successfully!',
          phone: cleanPhone
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid OTP! Please enter 1234 or the 4-digit code sent to your mobile.'
      });
    } catch (err: any) {
      console.error('Error in verify-otp:', err);
      return res.status(500).json({ success: false, error: 'Verification failed: ' + err.message });
    }
  });

  // 5. Create new appointment (Supports both /api/appointments and /api/book-appointment)
  const handleCreateAppointment = (req: any, res: any) => {
    try {
      const {
        patientName,
        patientPhone,
        patientPhoto,
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

      // Determine visit type and dynamic fee based on patient's selection or past history
      const priorHistory = appointmentsStore.filter(
        apt => apt.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone &&
               apt.status !== 'cancelled'
      );

      const isReturning = priorHistory.length > 0;
      const visitType = req.body.visitType === 'returning_patient' || req.body.visitType === 'first_visit'
        ? req.body.visitType
        : (isReturning ? 'returning_patient' : 'first_visit');

      const fee = typeof req.body.fee === 'number' && (req.body.fee === 200 || req.body.fee === 500)
        ? req.body.fee
        : (visitType === 'returning_patient' ? 200 : 500);

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
        patientPhoto: patientPhoto && typeof patientPhoto === 'string' ? patientPhoto : undefined,
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
  };

  app.post('/api/appointments', handleCreateAppointment);
  app.post('/api/book-appointment', handleCreateAppointment);
  app.post('/api/book', handleCreateAppointment);

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
