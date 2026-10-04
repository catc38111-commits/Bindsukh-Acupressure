import React, { useState, useEffect, useRef } from 'react';
import { CLINIC_INFO, CONDITIONS_TREATED, SERVICES_OFFERED } from '../data/clinicData';
import { useClinicLogo } from '../utils/logoHelper';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useLanguage } from '../context/LanguageContext';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import {
  Bot,
  Calendar,
  ChevronDown,
  Clock,
  HeartHandshake,
  HelpCircle,
  MapPin,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
  Zap
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionType?: 'book' | 'call' | 'map';
}

interface AiCareAssistantModalProps {
  onNavigateToBooking: () => void;
  onNavigateToMaps?: () => void;
}

const DOCTOR_PHOTO_URL = 'https://i.postimg.cc/5tR8Ypky/IMG-20260922-WA0016.jpg';
const CHAT_STORAGE_KEY = 'bindsukh_chat_history';

export const AiCareAssistantModal: React.FC<AiCareAssistantModalProps> = ({
  onNavigateToBooking,
  onNavigateToMaps
}) => {
  const clinicLogo = useClinicLogo();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  useLockBodyScroll(isOpen);
  const isHistoryPushedRef = useRef(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'hi-IN' | 'en-IN'>(language === 'en' ? 'en-IN' : 'hi-IN');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening
  } = useVoiceRecognition({
    onResult: (text) => {
      setInputText(text);
    }
  });

  // Safe handler to open chat and push dummy history state
  const handleOpenChat = () => {
    setIsOpen(true);
    try {
      window.history.pushState({ chatOpen: true }, '');
      isHistoryPushedRef.current = true;
    } catch (e) {
      console.warn('[Chatbot] History push error:', e);
    }
  };

  // Safe handler to close chat from UI buttons and pop dummy history state
  const handleCloseChat = () => {
    if (isListening) stopListening();
    if (speakingMessageId) {
      window.speechSynthesis?.cancel?.();
      setSpeakingMessageId(null);
    }
    setIsOpen(false);
    if (isHistoryPushedRef.current) {
      isHistoryPushedRef.current = false;
      try {
        if (window.history.state?.chatOpen) {
          window.history.back();
        }
      } catch (e) {
        console.warn('[Chatbot] History back error:', e);
      }
    }
  };

  // Intercept Android / System back button & swipe-back gesture to close the chat drawer safely
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        if (isListening) stopListening();
        if (speakingMessageId) {
          window.speechSynthesis?.cancel?.();
          setSpeakingMessageId(null);
        }
        setIsOpen(false);
        isHistoryPushedRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, isListening, speakingMessageId, stopListening]);

  // Clean up history state on unmount if chat was open
  useEffect(() => {
    return () => {
      if (isHistoryPushedRef.current) {
        isHistoryPushedRef.current = false;
        try {
          if (window.history.state?.chatOpen) {
            window.history.back();
          }
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // 1. Load persisted chat history from localStorage on component mount
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem(CHAT_STORAGE_KEY);
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[Chatbot] Failed to load chat history from localStorage:', err);
      }
    }
    return [
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text: t('chatWelcome'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // 2. Persist messages to localStorage whenever messages state updates
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (err) {
        console.warn('[Chatbot] Failed to persist chat history to localStorage:', err);
      }
    }
  }, [messages]);

  // Keep welcome message text synced with language toggle if there's only the default initial message
  useEffect(() => {
    setActiveLang(language === 'en' ? 'en-IN' : 'hi-IN');
    setMessages((prev) => {
      if (prev.length === 1 && (prev[0].id === 'welcome-msg' || prev[0].id.startsWith('welcome-'))) {
        return [{
          id: prev[0].id,
          sender: 'assistant',
          text: t('chatWelcome'),
          timestamp: prev[0].timestamp
        }];
      }
      return prev;
    });
  }, [language, t]);

  // Explicit Clear Chat function: only clears when manually requested
  const handleClearChat = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } catch (err) {
        console.warn('[Chatbot] Error removing chat history:', err);
      }
    }
    const freshWelcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      text: t('chatWelcome'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([freshWelcomeMsg]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([freshWelcomeMsg]));
      } catch (e) {
        // ignore
      }
    }
  };

  // Keep input text in sync when transcript updates
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Disable background page scrolling when the drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Text to Speech playback
  const handleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = activeLang;
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isLoading) return;

    if (isListening) {
      stopListening();
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: language,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      let replyText = data.reply || '';

      if (!replyText) {
        replyText = generateFallbackReply(textToSend);
      }

      let actionType: 'book' | 'call' | 'map' | undefined = 'book';
      const lower = replyText.toLowerCase();
      if (lower.includes('मैप') || lower.includes('पता') || lower.includes('location') || lower.includes('address') || lower.includes('rasta')) {
        actionType = 'map';
      } else if (lower.includes('कॉल') || lower.includes('फोन') || lower.includes('helpline') || lower.includes('call')) {
        actionType = 'call';
      } else {
        actionType = 'book';
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('[Chatbot] Fallback reply trigger:', err);
      const fallbackReply = generateFallbackReply(textToSend);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'book'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackReply = (query: string): string => {
    const q = query
      .toLowerCase()
      .replace(/[?.!,;:'"\\/()_\[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const isEnglish = language === 'en';
    const isHinglish = language === 'hinglish';

    // Specific health issue markers
    const hasSpecificHealthIssue =
      q.includes('sir dard') || q.includes('sar dard') || q.includes('sir me dard') ||
      q.includes('sar me dard') || q.includes('headache') || q.includes('migraine') ||
      q.includes('सिरदर्द') || q.includes('सरदर्द') || q.includes('सिर दर्द') ||
      q.includes('सर दर्द') || q.includes('सिर में दर्द') || q.includes('सर में दर्द') ||
      q.includes('माथा दर्द') || q.includes('आधासीसी') ||
      q.includes('ghutna') || q.includes('ghutne') || q.includes('knee') ||
      q.includes('घुटना') || q.includes('घुटने') || q.includes('घुटनों') ||
      q.includes('gathiya') || q.includes('गठिया') || q.includes('arthritis') ||
      q.includes('kamar dard') || q.includes('back pain') || q.includes('कमर दर्द') ||
      q.includes('कमर में दर्द') || q.includes('slip disc') || q.includes('स्लिप डिस्क') ||
      q.includes('पीठ दर्द') || q.includes('cervical') || q.includes('सर्वाइकल') ||
      q.includes('gardan dard') || q.includes('neck pain') || q.includes('गर्दन दर्द') ||
      q.includes('गर्दन में दर्द') || q.includes('frozen shoulder') || q.includes('कंधे में दर्द') ||
      q.includes('sciatica') || q.includes('साइटिका') || q.includes('dabi nas') ||
      q.includes('दबी नस') || q.includes('नस दब') || q.includes('nerve blockage') ||
      q.includes('blockage') || q.includes('ब्लॉकेज') || q.includes('sunnpan') ||
      q.includes('सुन्न') || q.includes('झनझनाहट') || q.includes('tingling') ||
      q.includes('numbness') || q.includes('kabz') || q.includes('कब्ज') ||
      q.includes('constipation') || q.includes('pet dard') || q.includes('stomach pain') ||
      q.includes('पेट में दर्द') || q.includes('acidity') || q.includes('एसिडिटी') ||
      q.includes('lakwa') || q.includes('लकवा') || q.includes('paralysis') ||
      q.includes('stroke') || q.includes('पक्षाघात') || q.includes('moch') ||
      q.includes('मोच') || q.includes('sprain') || q.includes('haddi dard') ||
      q.includes('हड्डी में दर्द') || q.includes('cp child') || q.includes('सीपी') ||
      q.includes('cerebral palsy');

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
          q === phrase ||
          q.startsWith(phrase + ' ') ||
          q.endsWith(' ' + phrase) ||
          q.includes(' ' + phrase + ' ')
      ) ||
        q.includes('kaise hain') ||
        q.includes('kaise ho') ||
        q.includes('kya haal') ||
        q.includes('how are you') ||
        q.includes('how r u') ||
        q.includes('how do you do') ||
        q === 'sir' ||
        q === 'doctor' ||
        q === 'namaste' ||
        q === 'hello' ||
        q === 'hi');

    if (isGreeting) {
      if (isEnglish) {
        return "Hello! I am doing well, thank you for asking! 😊 How can I assist you with Bindsukh Acupressure & Acupuncture Center today?\n\nYou can ask me about our 100% drugless therapies, consultation fees (₹500 1st visit / ₹200 follow-up), clinic timings, clinic location in Prayagraj, or describe any health concerns you would like guidance on.";
      }
      if (isHinglish) {
        return "Namaste! 🙏 Main bilkul theek hoon, poochne ke liye shukriya. Bindsukh Acupressure Center me aapka swagat hai! Main aapki kya madad kar sakta hoon?\n\nAap clinic timings, consultation fees (₹500 1st visit / ₹200 follow-up), therapies ya kisi bhi dard/swasthya pareshani ke baare me pooch sakte hain.";
      }
      return "नमस्ते! 🙏 मैं बहुत अच्छा हूँ, पूछने के लिए धन्यवाद। बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर में आपका हार्दिक स्वागत है! आज मैं आपकी क्या सहायता कर सकता हूँ?\n\nआप क्लिनिक समय, परामर्श शुल्क (पहली बार ₹500 / दोबारा ₹200), थैरेपी या किसी भी शारीरिक परेशानी के बारे में पूछ सकते हैं।";
    }

    // Common caution & clinic footer according to language
    const cautionText = isEnglish
      ? 'If these home remedies do not provide relief in 10-15 minutes or if the condition persists, please visit our clinic for permanent, 100% drugless healing.'
      : isHinglish
      ? 'Agar 10-15 minute me aaram na mile ya dard lagatar bana rahe, toh bina dawa permanent ilaj ke liye clinic aayein.'
      : 'अगर 10-15 मिनट में आराम न मिले या दर्द लगातार बना रहे, तो बिना दवा permanent इलाज के लिए क्लीनिक आएं।';

    const clinicFooter = isEnglish
      ? `🏥 **3. Clinic Contact & Appointment Guide:**
Consult Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture) for 100% drugless permanent relief.
• **Timing:** 8:30 AM to 4:00 PM (Monday - Saturday) | Sunday Morning 8:30 AM - 12:00 PM
• **Fee:** ₹500 (1st Visit) / ₹200 (Returning Patient)
• **Address:** Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
• **Direct Call/WhatsApp:** +91 9455110097 / +91 9455100097

👉 **[Book Appointment Now]**`
      : isHinglish
      ? `🏥 **3. Clinic Contact & Appointment Guide:**
Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture) dwara bina dawa ke permanent treatment kiya jata hai.
• **Timing:** 8:30 AM to 4:00 PM (Monday - Saturday) | Sunday Morning 8:30 AM - 12:00 PM
• **Fee:** ₹500 (1st Visit) / ₹200 (Returning)
• **Address:** Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
• **Direct Call/WhatsApp:** +91 9455110097

👉 **[Book Appointment Now]**`
      : `🏥 **3. क्लिनिक संपर्क व परामर्श गाइड (Clinic Guide):**
थेरेपिस्ट सौरभ प्रजापति जी (Master in Acupressure & Acupuncture) द्वारा 100% ड्रगलेस स्थायी उपचार किया जाता है।
• **समय:** सुबह 8:30 AM से शाम 4:00 PM (सोम-शनि) | रविवार सुबह 8:30 AM - 12:00 PM
• **फीस:** ₹500 (पहली बार) / ₹200 (दोबारा)
• **पता:** पुरामुफ्ती पुरानी बाजार, प्रयागराज (पंचायत भवन के पास)
• **हेल्पलाइन / WhatsApp:** +91 9455110097

👉 **[Book Appointment Now]**`;

    // 1. Headache / Sir Dard / Sar Dard / Migraine
    const isHeadache =
      q.includes('सिरदर्द') || q.includes('सरदर्द') || q.includes('सर दर्द') ||
      q.includes('सिर दर्द') || q.includes('सिर में दर्द') || q.includes('सर में दर्द') ||
      q.includes('माइग्रेन') || q.includes('migraine') || q.includes('headache') ||
      q.includes('head pain') || q.includes('sir dard') || q.includes('sar dard') ||
      q.includes('sir me dard') || q.includes('sar me dard') || q.includes('माथा दर्द') ||
      q.includes('आधासीसी');

    if (isHeadache) {
      if (isEnglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Headache & Migraine):**
• **LI4 Acupressure Point (Hegu):** Press the highest spot of the muscle between your thumb and index finger firmly for 2-3 minutes. This immediately relieves cranial tension and headache.
• **Hydration & Rest:** Drink a glass of warm water, step away from screens for 15 minutes, and place a cool compress on your forehead in a dim room.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Sir Dard & Migraine):**
• **LI4 Acupressure Point (Hegu Point):** Angoothe aur index finger ke beech ke ubhre hue masal hisse ko 2-3 minute achhi tarah dabayein. Isse sir ki naso ko turant aaram milta hai.
• **Garam Paani & Thandi Senk:** 1 glass gunguna paani piyein, 15 minute screen se door rahein aur maathe par geela/thanda kapda rakhkar aaram karein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Home Remedies):**
• **LI4 एक्यूप्रेशर बिंदु (हेगु पॉइंट):** अपने हाथ के अंगूठे और तर्जनी (Index finger) के बीच के उभरे हुए मांसल हिस्से को 2-3 मिनट गहरे दबाव के साथ दबाएं। इससे सिर की नसों को तुरंत शांति व आराम मिलता है।
• **हाइड्रेशन व विश्राम:** 1 गिलास गुनगुना पानी पिएं, मोबाइल/स्क्रीन से 15 मिनट दूरी बनाएं और माथे पर हल्का ठंडा या गीला कपड़ा रखकर आंखें बंद करके शांत लेटें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 2. Knee Pain & Arthritis
    if (q.includes('घुटने') || q.includes('घुटना') || q.includes('घुटनों') || q.includes('knee') || q.includes('ghutna') || q.includes('ghutne') || q.includes('गठिया') || q.includes('arthritis') || q.includes('joint')) {
      if (isEnglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Knee Pain & Arthritis):**
• **ST-35 Knee Acupressure (Eye of the Knee):** Gently press the indentations just below both sides of the knee cap with your thumbs for 1-2 minutes in circular motions.
• **Warm Oil Compress & Gentle Movement:** Gently massage warm mustard or sesame oil with fenugreek seeds around the knee, followed by warm fomentation for 10 minutes. Slowly straighten and bend knee 5-10 times.

⚠️ **2. Important Caution & Next Step:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Ghutne Ka Dard):**
• **Knee Acupressure Point (Eye of the Knee):** Ghutne ki katori ke dono kinaron ke gaddhon ko angoothe se 1-2 minute halke pressure ke sath dabayein.
• **Garam Tel Ki Malish:** Gungune sarson ya til ke tel se ghutne ke aaspas halke haath se malish karein aur 10 minute garam kapde se senk lein. Chair par baithkar pair ko dheere-dheere aage seedha karein aur modein.

⚠️ **2. Important Caution & Next Step:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **ST-35 घुटने का एक्यूप्रेशर (Eye of the Knee):** घुटने की कटोरी (Knee Cap) के दोनों किनारों के गड्ढों को अंगूठे से 1-2 मिनट हल्के दबाव के साथ गोल घुमाते हुए दबाएं।
• **हल्की गरम सिंकाई व मूवमेंट:** सरसों या तिल के तेल में मेथी दाना पकाकर घुटनों पर हल्के हाथ से मालिश करें और 10 मिनट गरम तौलिये से सेकें। कुर्सी पर बैठकर पैर को धीरे-धीरे आगे सीधा करें और फिर मोड़ें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 3. Back Pain & Slip Disc
    if (q.includes('कमर') || q.includes('back') || q.includes('kamar') || q.includes('disc') || q.includes('स्लिप डिस्क') || q.includes('spine') || q.includes('पीठ')) {
      if (isEnglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Back Pain & Slip Disc):**
• **Hand Spine Acupressure Point:** Press the groove on the back of your hand between the ring finger and middle finger toward the wrist for 2 minutes with your thumb.
• **Firm Bed & Gentle Cobra Stretch:** Avoid ultra-soft mattresses, rest on a firm bed with a pillow under your knees, and practice gentle cobra pose for 15-20 seconds.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Kamar Dard & Slip Disc):**
• **Hand Spine Point:** Hath ke pichhle hisse par ring finger aur middle finger ke beech ki bone groove ko wrist ki taraf angoothe se 2 minute dabayein.
• **Firm Bed Rest:** Bahut mulayam gadde se bachein, seedhe let kar ghutno ke neeche takiya rakhein aur halka cobra stretch karein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **हैंड एक्यूप्रेशर पॉइंट:** हाथ के पिछले हिस्से पर रिंग फिंगर और मिडिल फिंगर के बीच की हड्डी को कलाई की ओर 2 मिनट अंगूठे से दबाएं।
• **फर्म बेड रेस्ट व जेंटल कोबरा पोज:** अत्यधिक मुलायम गद्दे से बचें, समतल फर्म मैट्रेस या तख्त पर लेटें और घुटनों के नीचे तकिया रखें। पेट के बल लेटकर हाथों के सहारे छाती को 15-20 सेकंड हल्का ऊपर उठाएं (भुजंगासन)।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 4. Cervical & Neck Pain / Frozen Shoulder
    if (q.includes('गर्दन') || q.includes('सर्वाइकल') || q.includes('cervical') || q.includes('neck') || q.includes('कंधा') || q.includes('कंधे') || q.includes('shoulder')) {
      if (isEnglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Cervical & Neck Pain):**
• **Thumb Acupressure Point:** Press the back of your thumb (cervical spine reflex meridian) with your other thumb for 2-3 minutes.
• **Pillow Adjustment & Gentle Neck Rotation:** Remove thick pillows when sleeping and gently rotate your neck side-to-side and up-and-down without jerking.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Cervical & Gardan Dard):**
• **Thumb Acupressure Point:** Angoothe ke pichhle hisse ko doosre hath ke angoothe se 2-3 minute dabayein.
• **Mota Takiya Hatayein:** Sote waqt mota takiya na lagayein aur gardan ko dheere-dheere stretch karein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **अंगूठे का एक्यूप्रेशर पॉइंट:** हाथ के अंगूठे के पीछे वाले भाग (गर्दन का मेरिडियन) को दूसरे हाथ के अंगूठे से 2-3 मिनट दबाएं।
• **मोटा तकिया हटाएं व जेंटल नेक स्ट्रेच:** सोते समय बहुत मोटे तकिए का प्रयोग बंद करें और गर्दन को धीरे-धीरे दाएं-बाएं और ऊपर-नीचे घुमाएं, कभी भी झटका न दें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 5. Sciatica / Tingling & Numbness
    if (q.includes('साइटिका') || q.includes('sciatica') || q.includes('झनझनाहट') || q.includes('सुन्न') || q.includes('tingling') || q.includes('numbness') || q.includes('khinchav')) {
      if (isEnglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Sciatica & Tingling):**
• **Heel & Sole Acupressure:** Press the pressure indentations around the inner and outer edge of your heel for 2 minutes with moderate pressure.
• **Pillow Elevation & Fomentation:** Lie on your back with a pillow supporting under your knees to ease sciatic nerve tension, and apply warm fomentation from lower hip to thigh for 10 minutes.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Sciatica & Sunnpan):**
• **Heel & Sole Point:** Edi ke dono kinaron ke gaddhon ko 2 minute angoothe se halka dabayein.
• **Pillow Support & Senk:** Ghutno ke neeche takiya rakhkar letien aur kamar se pair tak 10 minute gunguni senk karein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **तलवे व एड़ी का एक्यूप्रेशर:** एड़ी के अंदरूनी व बाहरी किनारे पर 1-2 मिनट हल्का दबाव दें।
• **पैर को सहारा व सिंकाई:** पीठ के बल लेटते समय घुटने के नीचे तकिया रखें ताकि नसों पर खिंचाव न पड़े और 10-15 मिनट गुनगुनी सिकाई करें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 6. Sprain & Bone Related Issues
    if (q.includes('मोच') || q.includes('हड्डी') || q.includes('sprain') || q.includes('bone') || q.includes('moch') || q.includes('twist') || q.includes('ligament')) {
      if (isEnglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Sprain & Bone Issues):**
• **R.I.C.E. Technique:** Apply an ice pack wrapped in a cloth to the sprained area for 10-15 minutes and rest the joint completely.
• **Elevation & Support:** Rest the sprained limb elevated on a pillow to reduce swelling, and gently support with a crepe bandage (never jerk or crack the joint).

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Moch & Haddi):**
• **Barf Ki Senk:** Moch wale hisse par turant barf ki senk karein (10-15 minute) aur poora aaram dein.
• **Elevation & Bandage:** Sote waqt takiya lagakar ang ko thoda upar rakhein aur crepe bandage se halka support dein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय (Immediate Short Solution):**
• **R.I.C.E. तकनीक:** मोच वाले हिस्से पर तुरंत बर्फ की सिकाई करें (10-15 मिनट) और अंग को पूरा आराम दें।
• **एलिवेशन (ऊंचाई) व सपोर्ट:** सोते समय मोच वाले पैर या हाथ के नीचे तकिया रखें ताकि सूजन न बढ़े और क्रेप बैंडेज से हल्का सहारा दें (झटके से न चटकाएं)।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 7. Pinched Nerve & Nerve Compression
    if (q.includes('नस') || q.includes('दबी') || q.includes('ब्लॉकेज') || q.includes('nerve') || q.includes('pinched') || q.includes('nas')) {
      if (isEnglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Pinched Nerve & Blockage):**
• **Warm & Cool Compress:** Apply 10 minutes of warm fomentation followed by 5 minutes of cool compress to reduce nerve inflammation.
• **Posture & Gentle Stretch:** Avoid sudden heavy lifting, maintain an ergonomic posture, and practice gentle stretching without jerking.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Dabi Nas & Blockage):**
• **Garam & Thandi Senk:** 10 minute gunguni senk ke baad 5 minute thandi senk karne se naso ki sujan kam hoti hai.
• **Posture Ka Dhyan:** Galat posture se bachein aur achanak bhari wajan na uthayein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय (Immediate Short Solution):**
• **वार्म एंड कूल कंप्रेस:** 10 मिनट गुनगुनी सिंकाई के बाद 5 मिनट ठंडी सिंकाई करने से नसों की सूजन कम होती है।
• **दबाव से बचाव:** जिस अंग में नस दबी महसूस हो, उस पर ज्यादा वजन या गलत पोस्चर न बनाएं और हल्का जेंटल स्ट्रेच दें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 8. Cerebral Palsy (CP Child) & Delayed Walking
    if (q.includes('सीपी') || q.includes('चाइल्ड') || q.includes('cp child') || q.includes('cerebral') || q.includes('बच्च') || q.includes('walking')) {
      if (isEnglish) {
        return `💡 **1. Immediate Home Care (Cerebral Palsy & Delayed Walking):**
• **Gentle Limb Massage:** Gently massage the child's legs and feet with warm sesame or olive oil twice daily.
• **Supportive Standing Practice:** Hold the child securely and practice supported standing and foot-placement exercises for 10-15 minutes daily.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Home Care (CP Child & Walking Therapy):**
• **Gentle Tel Malish:** Bachho ke pairon ki gungune til ya olive oil se halki malish karein.
• **Standing Practice:** Bachhe ko sahara dekar seedha khade hone ka 10-15 minute roz abhyas karayein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. बच्चों के लिए घरेलू देखभाल (Immediate Home Care):**
• **जेंटल लिम्ब मसाज:** बच्चों के पैरों और पंजों की गुनगुने तिल/जैतून तेल से सौम्य मालिश करें।
• **सपोर्टिव स्टैंडिंग प्रैक्टिस:** बच्चे को दोनों हाथों से पकड़कर सीधे खड़े होने और पैर टिकाने का रोज 10-15 मिनट अभ्यास कराएं।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 9. Constipation & Digestion
    if (q.includes('कब्ज') || q.includes('constipation') || q.includes('pet') || q.includes('gas') || q.includes('अपच') || q.includes('acidity') || q.includes('एसिडिटी')) {
      if (isEnglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Constipation & Digestion):**
• **Palm Acupressure Point (Digestive Center):** Press the center of both palms with your thumb in clockwise circular motions for 2 minutes.
• **Warm Water & Navel Massage:** Drink 2 glasses of warm water in the morning and gently massage around your navel in a clockwise direction for 5 minutes.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Short Solution / Home Remedies (Kabz & Digestion):**
• **Palm Digestion Point:** Hatheli ke bilkul beech wale hisse ko angoothe se clockwise 2 minute dabayein.
• **Gunguna Paani & Nabhi Massage:** 2 glass gunguna paani piyein aur nabhi ke charo taraf halke hath se circular massage karein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **हथेली का एक्यूप्रेशर:** हथेली के बीच के पाचन बिंदु को अंगूठे से 2 मिनट क्लॉकवाइज दबाएं।
• **सुबह गुनगुना पानी व नाभि मसाज:** सुबह खाली पेट 2 गिलास गुनगुना पानी पिएं और नाभि के चारों ओर क्लॉकवाइज हल्के हाथ से मालिश करें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 10. Paralysis & Stroke
    if (q.includes('लकवा') || q.includes('paralysis') || q.includes('stroke') || q.includes('पक्षाघात')) {
      if (isEnglish) {
        return `💡 **1. Immediate Home Care (Paralysis & Stroke Rehabilitation):**
• **Gentle Passive Range of Motion:** Gently bend and straighten the fingers and joints of affected limbs 3-4 times daily.
• **Warm Oil Massage & Meridian Touch:** Massage upwards towards the heart with warm sesame oil and gently stimulate fingertips and toes.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (isHinglish) {
        return `💡 **1. Immediate Home Care (Lakwa & Paralysis Care):**
• **Finger & Limb Movement:** Prabhavit hath-pairon ki ungliyo ko din me 3-4 baar dheere se seedha aur modein.
• **Gunguna Tel Malish:** Til ke tel se neeche se upar ki disha me halki malish karein.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      return `💡 **1. घर पर तुरंत देखभाल के 2 उपाय (Immediate Home Care):**
• **निष्क्रिय अंगों की जेंटल मूवमेंट:** प्रभावित हाथ-पैरों की उंगलियों को दिन में 3-4 बार सीधा और मोड़ें।
• **गुनगुना तेल मालिश व पोरों का दबाव:** तिल के तेल से नीचे से ऊपर की दिशा में हल्की मालिश करें और हाथ-पैरों के सबसे ऊपरी पोरों को हल्के से दबाएं।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // Fees, Timing, Location Queries
    if (q.includes('फीस') || q.includes('शुल्क') || q.includes('fee') || q.includes('charge') || q.includes('cost')) {
      if (isEnglish) {
        return `Bindsukh Center Consultation & Therapy Fees:
• **First Visit (New Patient):** ₹500
• **Returning / Follow-up Patient:** ₹200
Includes comprehensive meridian diagnostic touch, magnet application, and specialist consultation.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `Bindsukh Center Consultation & Therapy Fees:
• **Pehli Baar (1st Visit / New Patient):** ₹500
• **Dobara Aane Par (Follow-up):** ₹200
Isme complete meridian diagnosis, magnet therapy aur specialist consultation shamil hai.

${clinicFooter}`;
      }
      return `बिंदसुख सेंटर में परामर्श एवं थेरेपी शुल्क:
• **पहली बार (1st Visit / New Patient):** ₹500
• **दोबारा आने पर (Returning / Follow-up):** मात्र ₹200
इसमें विस्तृत मेरिडियन परीक्षण व थैरेपी सत्र शामिल है।

${clinicFooter}`;
    }

    if (q.includes('समय') || q.includes('time') || q.includes('timing') || q.includes('hours') || q.includes('दिन')) {
      if (isEnglish) {
        return `Bindsukh Clinic Timings:
• **Monday to Saturday:** 8:30 AM to 4:00 PM
• **Sunday Morning:** 8:30 AM to 12:00 PM
Feature: To avoid crowding, each 1-hour slot is strictly limited to 5 patients max.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `Bindsukh Clinic Timings:
• **Monday se Saturday:** 8:30 AM se 4:00 PM
• **Sunday Morning:** 8:30 AM se 12:00 PM
Specialty: Bheed se bachne ke liye har 1 ghante ke slot me sirf 5 patients ko hi book kiya jata hai.

${clinicFooter}`;
      }
      return `क्लिनिक का समय (Clinic Timings):
• **सोमवार से शनिवार:** सुबह 8:30 AM से शाम 4:00 PM तक
• **रविवार (Sunday Morning):** सुबह 8:30 AM से दोपहर 12:00 PM तक
नोट: हर 1 घंटे के स्लॉट में भीड़ से बचने के लिए अधिकतम 5 मरीजों को ही समय दिया जाता है।

${clinicFooter}`;
    }

    if (q.includes('पता') || q.includes('address') || q.includes('कहाँ') || q.includes('location')) {
      if (isEnglish) {
        return `Clinic Address & Location:
**Bindsukh Acupressure & Acupuncture Center**
Puramufti Purani Bazar, Near Puramufti Panchayat Bhawan, Prayagraj (UP) - 212208
📞 Helpline / WhatsApp: +91 9455110097 / +91 9455100097

${clinicFooter}`;
      }
      if (isHinglish) {
        return `Clinic Ka Pata (Location):
**Bindsukh Acupressure & Acupuncture Center**
Puramufti Purani Bazar, Near Puramufti Panchayat Bhawan, Prayagraj (UP) - 212208
📞 Helpline / WhatsApp: +91 9455110097 / +91 9455100097

${clinicFooter}`;
      }
      return `क्लिनिक का पता:
**बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर**
पुरामुफ्ती पुरानी बाजार, निकट पुरामुफ्ती पंचायत भवन, प्रयागराज (उ.प्र.) 212208
📞 हेल्पलाइन / WhatsApp: +91 9455110097 / +91 9455100097

${clinicFooter}`;
    }

    // Default Friendly Clinic Guide (instead of forcing LI4 points)
    if (isEnglish) {
      return `Hello! 🙏 I am the Bindsukh Care Assistant. How can I best assist you today?

• **100% Drugless Therapies:** Acupressure, Acupuncture, Chiropractic, Cupping & Natural Magnet Therapy.
• **Specialist:** Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture)
• **Consultation Fee:** ₹500 (1st Visit) / ₹200 (Follow-up)
• **Timings:** Monday to Saturday 8:30 AM to 4:00 PM | Sunday Morning 8:30 AM to 12:00 PM
• **Address:** Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
• **Helpline / WhatsApp:** +91 9455110097

Please let me know if you have pain or a specific condition (like Knee pain, Back pain, Sciatica, Cervical, Pinched nerve, Migraine, or Sprain) and I will provide immediate home care tips and appointment guidance!

${clinicFooter}`;
    }

    if (isHinglish) {
      return `Namaste! 🙏 Main Bindsukh Care Assistant hoon. Main aapki kya madad kar sakta hoon?

• **100% Drugless Therapies:** Acupressure, Acupuncture, Chiropractic & Magnet Therapy
• **Specialist:** Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture)
• **Consultation Fee:** ₹500 (1st Visit) / ₹200 (Follow-up)
• **Timings:** Monday se Saturday 8:30 AM se 4:00 PM | Sunday Morning 8:30 AM se 12:00 PM
• **Address:** Puramufti Purani Bazar, Prayagraj
• **Helpline:** +91 9455110097

Aap humein apni takleef ya dard (jaise ghutna dard, kamar dard, cervical, sciatica, dabi nas ya sir dard) ke baare me batayein, hum turant gharelu upchar aur clinic margdarshan pradan karenge!

${clinicFooter}`;
    }

    return `नमस्ते! 🙏 मैं बिंदसुख केयर असिस्टेंट हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?

• **100% प्राकृतिक पद्धतियाँ:** एक्यूप्रेशर, एक्यूपंक्चर, काइरोप्रैक्टिक व मैग्नेट थैरेपी
• **विशेषज्ञ:** थेरेपिस्ट सौरभ प्रजापति (Master in Acupressure & Acupuncture)
• **परामर्श शुल्क:** ₹500 (पहला परामर्श) / ₹200 (फॉलो-अप)
• **समय:** सोमवार से शनिवार 8:30 AM से 4:00 PM | रविवार 8:30 AM से 12:00 PM
• **पता:** पुरामुफ्ती पुरानी बाजार, प्रयागराज (निकट पंचायत भवन)
• **हेल्पलाइन:** +91 9455110097

कृपया अपनी किसी भी शारीरिक परेशानी या दर्द (जैसे घुटने का दर्द, कमर दर्द, सर्वाइकल, साइटिका, दबी नस, सिरदर्द) के बारे में बताएं, हम आपको तुरंत उपयोगी घरेलू देखभाल व क्लिनिक परामर्श की जानकारी देंगे!

${clinicFooter}`;
  };

  const lowerCaseIncludes = (str: string, words: string[]) => words.some((w) => str.includes(w));

  const quickPrompts = language === 'en' ? [
    'Headache / Migraine relief?',
    'Knee pain home remedy & treatment?',
    'Back pain & slip disc solution?',
    'Cervical & neck pain relief?',
    'Constipation & digestion relief?',
    'Sprain & Bone issues treatment?',
    'Pinched nerve & compression relief?',
    'Consultation fees & clinic timings?'
  ] : language === 'hinglish' ? [
    'Sir dard / migraine ka turant upchar?',
    'Ghutne me dard ka gharelu upchar?',
    'Kamar dard aur slip disc ka ilaj?',
    'Cervical aur gardan dard ka ilaj?',
    'Kabz aur digestion ki dikkat?',
    'Moch aur haddi ka ilaj kaise hota hai?',
    'Sharir me dabi nas ya blockage ka ilaj?',
    'Doctor fees aur clinic timing?'
  ] : [
    'सर दर्द / माइग्रेन का तुरंत घरेलू उपाय?',
    'घुटने के दर्द का तुरंत घरेलू उपाय?',
    'कमर दर्द व स्लिप डिस्क का इलाज?',
    'सर्वाइकल व गर्दन दर्द का उपाय?',
    'कब्ज व पाचन विकार का उपचार?',
    'मोच व हड्डी दर्द का उपचार?',
    'दबी नस (Pinched Nerve) का क्या इलाज है?',
    'परामर्श फीस व क्लिनिक समय?'
  ];

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <button
          id="bindsukh-ai-assistant-btn"
          type="button"
          onClick={handleOpenChat}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-gradient-to-r from-emerald-800 via-emerald-900 to-amber-900 text-white rounded-full p-3 sm:px-5 sm:py-3.5 shadow-2xl shadow-emerald-950/40 border-2 border-amber-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group cursor-pointer"
          title="Bindsukh AI Care Assistant (बिंदसुख स्वास्थ्य सहायक)"
        >
          <div className="relative">
            <img
              src={DOCTOR_PHOTO_URL}
              alt="Therapist Saurabh Prajapati"
              className="w-10 h-10 rounded-full object-cover object-[center_18%] border-2 border-amber-400 shadow-md shrink-0 bg-emerald-950"
            />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-emerald-900 animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-emerald-900" />
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-xs font-black text-amber-300 flex items-center gap-1">
              <span>{t('chatTitle')}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            </div>
            <div className="text-[11px] text-emerald-100 font-medium flex items-center gap-1">
              <span>{t('chatSubtitle')}</span>
              <Mic className="w-3 h-3 text-amber-400" />
            </div>
          </div>
        </button>
      )}

      {/* Chatbot Modal / Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseChat();
            }
          }}
        >
          <div className="bg-white w-full sm:max-w-md h-[92vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-amber-950 text-white p-4 flex items-center justify-between border-b border-amber-400/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={DOCTOR_PHOTO_URL}
                    alt="Therapist Saurabh Prajapati"
                    className="w-11 h-11 rounded-full object-cover object-[center_18%] border-2 border-amber-400 shadow-md bg-emerald-950"
                  />
                  <img
                    src={clinicLogo}
                    alt="Clinic Logo"
                    className="w-4 h-4 rounded-full absolute -bottom-0.5 -right-0.5 border border-emerald-500 object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1">
                      <span>Bindsukh AI Assistant</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>बिंदसुख स्वास्थ्य सहायक • 24/7 सक्रिय</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Clear Chat Button */}
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg bg-emerald-900/90 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-emerald-700/60 transition-colors"
                  title={language === 'en' ? 'Clear Chat History' : language === 'hinglish' ? 'Chat Clear Karein' : 'चैट साफ़ करें'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Language Switcher */}
                <button
                  type="button"
                  onClick={() => setActiveLang(activeLang === 'hi-IN' ? 'en-IN' : 'hi-IN')}
                  className="px-2 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-amber-300 text-[10px] font-bold border border-emerald-600 transition-colors"
                  title="Switch Voice Recognition Language"
                >
                  {activeLang === 'hi-IN' ? 'हिंदी' : 'EN'}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleCloseChat}
                  className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  title="Close Assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-2 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap min-w-max">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  त्वरित सवाल:
                </span>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-950 border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice listening indicator bar */}
            {isListening && (
              <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800 font-semibold animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span>{t('chatListening')}</span>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  className="text-xs text-rose-700 underline font-bold cursor-pointer"
                >
                  {t('chatStop')}
                </button>
              </div>
            )}

            {voiceError && (
              <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[11px] text-amber-900 font-medium">
                {voiceError}
              </div>
            )}

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faf9] overscroll-contain"
              style={{ overscrollBehavior: 'contain' }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Action buttons inside assistant messages */}
                    {msg.sender === 'assistant' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        {/* Direct 1-Click Book Appointment Now CTA */}
                        <button
                          type="button"
                          onClick={() => {
                            handleCloseChat();
                            onNavigateToBooking();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-emerald-950 font-black text-xs shadow-md hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-500/30"
                          title="Click to select 1-hour time slot & confirm appointment"
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-950" />
                          <span>{language === 'en' ? 'Book Appointment Now' : language === 'hinglish' ? 'Book Appointment Now' : 'अपॉइंटमेंट अभी बुक करें'}</span>
                        </button>

                        {/* Direct Call +91 9455100097 */}
                        <a
                          href="tel:+919455100097"
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
                          title="Call Therapist Saurabh: +91 9455100097"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>+91 9455100097</span>
                        </a>

                        {/* Direct WhatsApp +91 9455100097 */}
                        <a
                          href={`https://wa.me/919455100097?text=${encodeURIComponent(
                            'नमस्ते डॉ. सौरभ प्रजापति जी, मुझे बिन्दसुख क्लिनिक में परामर्श व अपॉइंटमेंट चाहिए।'
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
                          title="WhatsApp Doctor directly"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-white" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Location / Maps Button if queried */}
                        {onNavigateToMaps && (msg.actionType === 'map' || msg.text.includes('पता') || msg.text.includes('Address') || msg.text.includes('Location') || msg.text.includes('लोकेशन')) && (
                          <button
                            type="button"
                            onClick={() => {
                              handleCloseChat();
                              onNavigateToMaps();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-950 border border-amber-300 font-bold text-xs shadow-2xs hover:bg-amber-100 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-600" />
                            <span>मैप्स पर लोकेशन</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message footer with timestamp & Voice read-aloud */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`hover:text-emerald-800 transition-colors flex items-center gap-0.5 ${
                          speakingMessageId === msg.id ? 'text-emerald-700 font-bold' : ''
                        }`}
                        title={speakingMessageId === msg.id ? 'आवाज़ बंद करें' : 'उत्तर सुनें (Listen)'}
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-emerald-700" />
                            <span>बंद करें</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>सुनें</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="font-medium text-emerald-900 ml-1">बिंदसुख AI उत्तर लिख रहा है...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form with Voice Mic Button */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      startListening(activeLang);
                    }
                  }}
                  className={`p-2.5 rounded-full transition-all shrink-0 cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white shadow-md ring-4 ring-rose-200 animate-pulse'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                  title={isListening ? 'बोलना बंद करें (Stop listening)' : 'बोलकर पूछें (Speak your question)'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('chatInputPlaceholder')}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50 focus:bg-white"
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white transition-all shrink-0 cursor-pointer"
                  title="Send Question"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
                <span>🎙️ {language === 'en' ? 'Voice Enabled' : language === 'hinglish' ? 'Voice Enabled' : 'वॉइस समर्थित'}</span>
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="hover:text-slate-600 underline cursor-pointer"
                >
                  {language === 'en' ? 'Clear Chat' : language === 'hinglish' ? 'Chat Clear Karein' : 'चैट साफ़ करें'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
