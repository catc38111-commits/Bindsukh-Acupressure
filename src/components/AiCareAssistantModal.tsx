import React, { useState, useEffect, useRef } from 'react';
import { CLINIC_INFO, CONDITIONS_TREATED, SERVICES_OFFERED } from '../data/clinicData';
import { useClinicLogo } from '../utils/logoHelper';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useLanguage } from '../context/LanguageContext';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { sendChatMessage } from '../services/chatService';
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
      const chatRes = await sendChatMessage({
        message: textToSend,
        language: language as 'en' | 'hi' | 'hinglish',
        history: messages.slice(-6).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }))
      });

      let replyText = chatRes.reply || '';

      if (!replyText) {
        replyText = generateFallbackReply(textToSend);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: chatRes.actionType || 'book'
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
      q.includes('cerebral palsy') || q.includes('pair') || q.includes('पैर') || q.includes('leg');

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

    const clinicFooter = isEnglish
      ? `🏥 **4. Clinic Consultation & Long-Term Solution:**
Consult Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture) for 100% drugless permanent relief.
• **Timing:** 8:30 AM to 4:00 PM (Monday - Saturday) | Sunday Morning 8:00 AM - 12:00 PM
• **Fee:** ₹500 (1st Visit) / ₹200 (Returning Patient)
• **Address:** Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
• **Helpline / WhatsApp:** +91 9455100097 / +91 8423221799

👉 **[Book Appointment Now]**`
      : isHinglish
      ? `🏥 **4. Clinic Consultation & Permanent Ilaj:**
Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture) dwara bina dawa ke permanent treatment kiya jata hai.
• **Timing:** 8:30 AM to 4:00 PM (Monday - Saturday) | Sunday Morning 8:00 AM - 12:00 PM
• **Fee:** ₹500 (1st Visit) / ₹200 (Follow-up)
• **Address:** Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
• **Helpline / WhatsApp:** +91 9455100097

👉 **[Book Appointment Now]**`
      : `🏥 **4. क्लिनिक परामर्श एवं स्थायी समाधान (Clinic Consultation):**
थेरेपिस्ट सौरभ प्रजापति जी (Master in Acupressure & Acupuncture) द्वारा 100% ड्रगलेस स्थायी उपचार किया जाता है।
• **समय:** सुबह 8:30 AM से शाम 4:00 PM (सोम-शनि) | रविवार सुबह 8:00 AM - 12:00 PM
• **फीस:** ₹500 (पहली बार) / ₹200 (दोबारा)
• **पता:** पुरामुफ्ती पुरानी बाजार, प्रयागराज (पंचायत भवन के पास)
• **हेल्पलाइन / WhatsApp:** +91 9455100097

👉 **[Book Appointment Now]**`;

    // 1. Headache / Sir Dard / Migraine
    const isHeadache =
      q.includes('सिरदर्द') || q.includes('सरदर्द') || q.includes('सर दर्द') ||
      q.includes('सिर दर्द') || q.includes('सिर में दर्द') || q.includes('सर में दर्द') ||
      q.includes('माइग्रेन') || q.includes('migraine') || q.includes('headache') ||
      q.includes('head pain') || q.includes('sir dard') || q.includes('sar dard') ||
      q.includes('sir me dard') || q.includes('sar me dard') || q.includes('माथा दर्द') ||
      q.includes('आधासीसी');

    if (isHeadache) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
I am so sorry you are suffering from a headache/migraine. We understand how exhausting and debilitating head pain can be.

🌿 **2. How Acupressure & Acupuncture Relieve It:**
Acupressure clears cranial nerve tension and restores micro-vascular blood circulation to the brain without any painkiller pills. Stimulating specific meridians releases natural endorphins that calm brain nerve hyperactivity permanently.

💡 **3. Safe Home Relief Tip:**
• **LI4 (He Gu Point):** Firmly press the webbed muscle between your thumb and index finger for 2-3 minutes on both hands.
• Drink a glass of warm water and rest in a dim room with eyes closed for 15 minutes.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Humein bohot dukh hai ki aap sir dard ya migraine se pareshan hain. Sir dard insaan ko bechain aur thaka deta hai.

🌿 **2. Acupressure Kaise Aaram Deta Hai:**
Acupressure aur Acupuncture bina kisi dawa ke sir ki dabi hui naso aur blood circulation ko normal karte hain. Isse cranial tension turant release hoti hai aur migraine me permanent aaram milta hai.

💡 **3. Turant Gharelu Upchar:**
• **LI4 Point (He Gu):** Apne hath ke angoothe aur index finger ke beech ke masal hisse ko 2-3 minute achhe se dabayein.
• Ek glass gunguna paani piyein aur 15 minute screen se door shaant kamre me aaram karein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
हमें बहुत खेद है कि आप सिरदर्द / माइग्रेन की पीड़ा से जूझ रहे हैं। सिर का दर्द सचमुच बहुत कष्टदायक और थका देने वाला होता है।

🌿 **2. एक्यूप्रेशर एवं एक्यूपंक्चर द्वारा प्राकृतिक समाधान:**
एक्यूप्रेशर बिना किसी पेनकिलर के सिर की तनावग्रस्त नसों में रक्त संचार को सुचारू करता है। विशिष्ट मेरिडियन पॉइंट्स पर दबाव देकर प्राकृतिक एंडोर्फिन सक्रिय होता है, जिससे सिरदर्द जड़ से शांत होता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **LI4 एक्यूप्रेशर पॉइंट (हेगु बिंदु):** अपने अंगूठे और तर्जनी उंगली के बीच के उभरे हुए मांसल भाग को 2-3 मिनट गहरे दबाव के साथ दबाएं।
• 1 गिलास गुनगुना पानी पिएं और 15 मिनट मोबाइल/स्क्रीन से दूर शांत लेटें।

${clinicFooter}`;
    }

    // 2. Knee Pain & Arthritis / Joint Pain
    if (q.includes('घुटने') || q.includes('घुटना') || q.includes('घुटनों') || q.includes('knee') || q.includes('ghutna') || q.includes('ghutne') || q.includes('गठिया') || q.includes('arthritis') || q.includes('joint') || q.includes('जोड़ों')) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
We truly understand how difficult knee pain and joint stiffness make walking and daily movements.

🌿 **2. How Acupressure & Holistic Therapy Help:**
Therapy stimulates synovial fluid circulation around the knee joint, reduces inflammation, and relieves pressure on cartilage without surgeries or injections.

💡 **3. Safe Home Relief Tip:**
• **Eye of the Knee (ST-35):** Gently press the two indentations just below your kneecap with your thumbs in circular motions for 2 minutes.
• Apply warm mustard or sesame oil with fenugreek, followed by 10 minutes of gentle warm towel fomentation.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Ghutno ke dard ya gathiya ki wajah se chalne-phirne me hone wali takleef ko hum achhi tarah samajhte hain.

🌿 **2. Acupressure Kaise Aaram Deta Hai:**
Acupressure ghutne ke aaspas blood circulation badhata hai aur joints ke beech ke friction/inflammation ko bina injection ya surgery ke natural tarike se theek karta hai.

💡 **3. Turant Gharelu Upchar:**
• **Knee Points (ST-35):** Ghutne ki katori ke dono taraf ke gaddho ko 2 minute angoothe se gol ghumate hue dabayein.
• Gungune sarson ya til ke tel se halke hath se malish karein aur 10 minute garam kapde se senk lein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
हम समझते हैं कि घुटनों के दर्द या गठिया के कारण उठने-बैठने और चलने में कितनी परेशानी होती है।

🌿 **2. एक्यूप्रेशर द्वारा प्राकृतिक समाधान:**
एक्यूप्रेशर और मैग्नेट थैरेपी घुटने के जोड़ों में साइनोवियल फ्लूइड और रक्त प्रवाह को सक्रिय करती है, जिससे बिना ऑपरेशन व बिना पेनकिलर के सूजन और घिसाव का प्राकृतिक उपचार होता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **ST-35 घुटने का एक्यूप्रेशर:** घुटने की कटोरी के ठीक नीचे दोनों तरफ के गड्ढों को 2 मिनट अंगूठों से गोल घुमाते हुए दबाएं।
• मेथी दाना मिले गुनगुने सरसों तेल से हल्के हाथ से मालिश करें और 10 मिनट गरम तौलिये से सेंकें।

${clinicFooter}`;
    }

    // 3. Back Pain & Slip Disc
    if (q.includes('कमर') || q.includes('back') || q.includes('kamar') || q.includes('disc') || q.includes('स्लिप डिस्क') || q.includes('spine') || q.includes('पीठ') || q.includes('l4') || q.includes('l5')) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
Lower back pain and slip disc can severely limit your posture and comfort. We empathize deeply with what you are going through.

🌿 **2. How Acupressure & Chiropractic Help:**
Gentle chiropractic adjustment and meridian acupressure decompress the lumbar spine (L4-L5/S1), releasing pinched nerves and restoring spinal balance without surgery.

💡 **3. Safe Home Relief Tip:**
• **Hand Spine Reflex Point:** Press the groove on the back of your hand between the ring and middle fingers toward your wrist for 2 minutes.
• Rest on a firm surface with a pillow placed under your knees to take pressure off your lower back.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Kamar dard aur slip disc ki wajah se uthne-baithne me hone wali pareshani hum samajhte hain.

🌿 **2. Acupressure & Chiropractic Ka Asar:**
Chiropractic spine alignment aur acupressure se L4-L5 lumbar spine par dabi hui nas free hoti hai, jisse bina operation ke dard jad se theek hota hai.

💡 **3. Turant Gharelu Upchar:**
• **Hand Spine Point:** Hath ke pichhle hisse par ring finger aur middle finger ke beech ki line ko wrist ki taraf angoothe se 2 minute dabayein.
• Seedhe letkar ghutno ke neeche takiya rakhein aur bahut soft gadde par na soyein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
कमर दर्द और स्लिप डिस्क से होने वाली असहनीय तकलीफ को हम पूरी संवेदनशीलता से समझते हैं।

🌿 **2. एक्यूप्रेशर व काइरोप्रैक्टिक द्वारा प्राकृतिक समाधान:**
काइरोप्रैक्टिक अलाइनमेंट और एक्यूप्रेशर L4-L5 व लंबर स्पाइन के दबाव को हटाकर दबी हुई नसों को खोलते हैं, जिससे बिना ऑपरेशन प्राकृतिक रूप से कमर का लचीलापन लौट आता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **हैंड स्पाइन एक्यूप्रेशर:** हाथ के पिछले भाग पर रिंग और मिडिल फिंगर के बीच की हड्डी वाली नाली को कलाई की ओर 2 मिनट अंगूठे से दबाएं।
• फर्म गद्दे या तख्त पर लेटें और घुटनों के नीचे तकिया लगाकर कमर को सहारा दें।

${clinicFooter}`;
    }

    // 4. Cervical & Neck Pain / Frozen Shoulder
    if (q.includes('गर्दन') || q.includes('सर्वाइकल') || q.includes('cervical') || q.includes('neck') || q.includes('कंधा') || q.includes('कंधे') || q.includes('shoulder') || q.includes('gardan') || q.includes('jakdan')) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
Neck stiffness, cervical pain, and shoulder radiation can make everyday focus exhausting. We are here to help.

🌿 **2. How Acupressure & Acupuncture Relieve Cervical:**
Acupressure unblocks stiff trapezius muscles and cervical vertebrae meridians, reducing pressure on nerve roots and restoring full range of neck movement.

💡 **3. Safe Home Relief Tip:**
• **Thumb Meridian Point:** Firmly massage the back of your thumb (cervical spine reflex) with your opposite thumb for 2-3 minutes.
• Avoid thick pillows when sleeping and perform slow, gentle neck rotations without jerking.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Gardan me dard, cervical ya kandhe ki jakdan se hone wali pareshani ko hum achhi tarah samajhte hain.

🌿 **2. Acupressure Ka Fayda:**
Acupressure gardan aur kandhe ki stiff muscles ko relax karta hai aur cervical vertebrae par dabi nason ko bina dawa khole relief deta hai.

💡 **3. Turant Gharelu Upchar:**
• **Thumb Acupressure:** Dono hatho ke angoothe ke pichhle hisse ko doosre hath se 2-3 minute dabayein.
• Sote waqt mota takiya hata dein aur gardan ko dheere-dheere aage-peeche stretch karein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
गर्दन में दर्द, सर्वाइकल और कंधे की जकड़न से सिर और बांहों तक होने वाली परेशानी को हम समझते हैं।

🌿 **2. एक्यूप्रेशर द्वारा प्राकृतिक समाधान:**
एक्यूप्रेशर और एक्यूपंक्चर गर्दन की जकड़ी हुई मांसपेशियों को शिथिल करते हैं और सर्वाइकल वर्टिब्रे की दबी हुई नसों में रक्त प्रवाह शुरू कर दर्द को जड़ से समाप्त करते हैं।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **अंगूठे का एक्यूप्रेशर:** दोनों हाथों के अंगूठे के पिछले भाग को दूसरे हाथ के अंगूठे से 2-3 मिनट दबाएं।
• सोते समय मोटा तकिया तुरंत हटाएं और गर्दन को बिना झटका दिए धीरे-धीरे स्ट्रेच करें।

${clinicFooter}`;
    }

    // 5. Sciatica & Leg Pain / Tingling / Numbness
    if (q.includes('साइटिका') || q.includes('sciatica') || q.includes('झनझनाहट') || q.includes('सुन्न') || q.includes('tingling') || q.includes('numbness') || q.includes('khinchav') || q.includes('pair') || q.includes('पैर') || q.includes('leg') || q.includes('tang') || q.includes('टांग')) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
We are so sorry you are experiencing leg pain, sciatica, or tingling/numbness. Sciatic nerve pain can be deeply distressing.

🌿 **2. How Acupressure Relieves Sciatica & Leg Pain:**
Acupressure stimulates reflex points along the urinary bladder and gall bladder meridians, relieving deep compression on the sciatic nerve and restoring normal sensations without pills.

💡 **3. Safe Home Relief Tip:**
• **Heel & Sole Acupressure:** Press the pressure indentations along the inner and outer edges of your heel for 2 minutes.
• Rest with a pillow supporting under your knees to take tension off the sciatic nerve, and apply warm fomentation from lower hip to thigh.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Pair me dard, sciatica, khinchav ya sunnpan hone par chalne me bohot takleef hoti hai, hum ise samajhte hain.

🌿 **2. Acupressure Sciatica Ko Kaise Theek Karta Hai:**
Acupressure sciatic nerve par hone wale pressure ko release karta hai aur pair ki nason me blood circulation theek karta hai, jisse jhanjhanahat aur dard khatam hota hai.

💡 **3. Turant Gharelu Upchar:**
• **Heel & Sole Point:** Edi ke dono kinaron ke gaddhon ko 2 minute angoothe se dabayein.
• Ghutno ke neeche takiya rakhkar letien aur kamar se jaangh tak 10 minute gunguni senk karein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
हम समझते हैं कि पैरों में दर्द, साइटिका, सुन्नपन या खिंचाव के कारण चलना-फिरना कितना कठिन हो जाता है।

🌿 **2. साइटिका व पैर दर्द का एक्यूप्रेशर समाधान:**
एक्यूप्रेशर कमर से लेकर एड़ी तक जाने वाली साइटिका नर्व के दबाव को मुक्त करता है। मेरिडियन पॉइंट्स पर मैग्नेट व टच द्वारा नसों का ब्लॉकेज बिना दवा व बिना सर्जरी खुल जाता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **एड़ी व तलवे का एक्यूप्रेशर:** एड़ी के दोनों किनारों के गड्ढों को अंगूठे से 2 मिनट हल्के दबाव के साथ दबाएं।
• घुटनों के नीचे तकिया रखकर लेटें ताकि साइटिक नर्व पर खिंचाव न पड़े, और जांघ से पिंडलियों तक गुनगुनी सिकाई करें।

${clinicFooter}`;
    }

    // 6. Paralysis & Stroke Rehabilitation
    if (q.includes('लकवा') || q.includes('paralysis') || q.includes('stroke') || q.includes('पक्षाघात') || q.includes('lakwa')) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
Paralysis and stroke rehabilitation require immense patience and compassion. We stand by you and your family.

🌿 **2. How Acupuncture & Acupressure Restore Mobility:**
Sterile micro-acupuncture and specialized meridian neuro-acupressure activate dormant motor pathways, stimulate cerebral circulation, and help retrain limb reflexes without chemicals.

💡 **3. Safe Home Relief Tip:**
• Gently massage the patient's palms, fingers, and soles in upward circular motions with warm sesame oil to stimulate peripheral nerve sensations.
• Keep the affected limbs warm and properly supported.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Lakwa (paralysis) ya stroke ke baad aane wali takleef me patient aur family ko bohot sahas ki zaroorat hoti hai.

🌿 **2. Acupressure & Acupuncture Ka Fayda:**
Acupuncture aur Acupressure supt (dormant) nason aur motor nerves ko dobara activate karte hain, jisse haath-pair ki movement aur taakat wapas aane lagti hai.

💡 **3. Turant Gharelu Upchar:**
• Mareez ke haath aur pair ke talwo par gungune tel se upar ki disha me halki malish karein.
• Paralyzed hisse ko hamesha gunguna aur support par rakhein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
लकवा (पक्षाघात) या स्ट्रोक के बाद की स्थिति में मरीज और परिजनों को बहुत धैर्य और सही मार्गदर्शन की आवश्यकता होती है।

🌿 **2. एक्यूपंक्चर एवं न्यूरो-एक्यूप्रेशर द्वारा पुनर्वास:**
एक्यूपंक्चर और एक्यूप्रेशर सुप्त (शांत) नसों और मस्तिष्क के मोटर पाथवे को सक्रिय करते हैं। इससे हाथ-पैरों की शक्ति, संवेदनशीलता और गतिशीलता बिना किसी दवा के वापस लौटने लगती है।

💡 **3. तुरंत उपयोगी देखभाल उपाय:**
• मरीज के हाथों की हथेलियों, उंगलियों और तलवों पर हल्के गुनगुने तेल से ऊपर की दिशा में हल्की मालिश करें।
• प्रभावित अंगों को ठंड से बचाएं और उचित सहारा देकर रखें।

${clinicFooter}`;
    }

    // 7. Sprain & Bone / Ligament Issues
    if (q.includes('मोच') || q.includes('हड्डी') || q.includes('sprain') || q.includes('bone') || q.includes('moch') || q.includes('twist') || q.includes('ligament')) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
Sprains and sudden bone/ligament twists can cause sudden sharp pain and swelling. We understand your discomfort.

🌿 **2. How Acupressure & Kinesiology Taping Help:**
Targeted pressure relieves lymphatic congestion, reduces swelling, and stabilizes strained ligaments for speedy, drugless recovery.

💡 **3. Safe Home Relief Tip:**
• Elevate the affected limb and apply cold fomentation for the first 24 hours to reduce acute swelling. Avoid putting heavy weight on it.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Moch ya ligament ke khinchne se achanak hone wale tez dard aur soojan ko hum samajhte hain.

🌿 **2. Acupressure Ka Asar:**
Acupressure aur Kinesiology taping se soojan turant kam hoti hai aur ligament bina dawai natural tarike se heal hota hai.

💡 **3. Turant Gharelu Upchar:**
• Pair ya hath ko uncha rakhein aur pehle 24 ghante barf/thandi senk karein. Is par zyada wajan na daalein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
मोच, लिगामेंट खिंचाव या हड्डी की चोट से होने वाले अचानक दर्द और सूजन की परेशानी को हम समझते हैं।

🌿 **2. एक्यूप्रेशर द्वारा समाधान:**
एक्यूप्रेशर और काइनेसियोलॉजी टेपिंग लिगामेंट के तनाव को कम कर सूजन व दर्द को तुरंत शांत करते हैं, जिससे सामान्य गतिशीलता तेजी से लौटती है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• चोट वाले स्थान को ऊंचाई पर रखें और पहले 24 घंटे ठंडी सिंकाई (बर्फ) करें। उस पर भारी वजन न डालें।

${clinicFooter}`;
    }

    // 8. Pinched Nerve & Blockage
    if (q.includes('नस') || q.includes('दबी') || q.includes('ब्लॉकेज') || q.includes('nerve') || q.includes('pinched') || q.includes('nas')) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
Pinched nerves can cause burning pain, numbness, and sharp discomfort along the limbs. We are here to assist.

🌿 **2. How Acupressure Frees Pinched Nerves:**
Acupressure clears neuromuscular congestion and unblocks pinched nerve pathways through diagnostic touch and meridian magnets, restoring continuous blood flow.

💡 **3. Safe Home Relief Tip:**
• Apply 10 minutes of gentle warm fomentation followed by resting without putting heavy strain or awkward pressure on the affected nerve.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Dabi hui nas ki wajah se aane wale dard aur sunnpan ko hum samajhte hain.

🌿 **2. Acupressure Dabi Nas Ko Kaise Kholta Hai:**
Acupressure aur magnetic therapy dabi hui naso ke blockage ko bina surgery ya dawai ke natural tarike se release karti hai.

💡 **3. Turant Gharelu Upchar:**
• 10 minute gunguni senk karein aur us ang par achanak zyada wajan ya galat posture na banayein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
शरीर में कहीं भी नस दबने या ब्लॉकेज से होने वाले दर्द, झनझनाहट और भारीपन की समस्या को हम समझते हैं।

🌿 **2. एक्यूप्रेशर द्वारा नसों का प्राकृतिक उपचार:**
एक्यूप्रेशर और मैग्नेट थैरेपी दबी हुई नसों के संकुचन को खोलकर सामान्य रक्त संचार बहाल करते हैं, जिससे बिना ऑपरेशन नसों का ब्लॉकेज खुल जाता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• 10 मिनट गुनगुनी सिंकाई करें और जिस अंग में नस दबी हो उस पर अत्यधिक दबाव न डालें।

${clinicFooter}`;
    }

    // 9. Constipation & Digestive issues
    if (q.includes('कब्ज') || q.includes('constipation') || q.includes('pet') || q.includes('gas') || q.includes('अपच') || q.includes('acidity') || q.includes('एसिडिटी')) {
      if (isEnglish) {
        return `❤️ **1. Empathetic Acknowledgment:**
Chronic constipation, gas, and digestive distress can make your entire body feel uncomfortable and heavy.

🌿 **2. How Acupressure Helps Digestive Health:**
Stimulating abdominal reflex points on the palms and feet regulates gut peristalsis and balances stomach meridian energy without laxative dependency.

💡 **3. Safe Home Relief Tip:**
• **Palm Digestion Center:** Press the exact center of both palms with your thumb in clockwise circular motions for 2 minutes.
• Drink 2 glasses of warm water and take a gentle 10-minute walk.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `❤️ **1. Hamari Sahanoobhuti:**
Kabz, gas ya pet me dard ki wajah se aane wali bechaini ko hum samajhte hain.

🌿 **2. Acupressure Ka Asar:**
Acupressure pet ke digestive points ko stimulate karta hai jisse bina kisi churna ya dawa ke pet natural tarike se saaf hota hai.

💡 **3. Turant Gharelu Upchar:**
• **Palm Point:** Hatheli ke theek beech wale hisse ko angoothe se clockwise 2 minute dabayein.
• 2 glass gunguna paani piyein aur 10 minute tahlne ki aadat daalein.

${clinicFooter}`;
      }
      return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
कब्ज, गैस, एसिडिटी या पेट की समस्याओं से पूरा शरीर भारी और असहज हो जाता है, इसे हम समझते हैं।

🌿 **2. एक्यूप्रेशर द्वारा पाचन सुधार:**
एक्यूप्रेशर आंतों के प्राकृतिक संकुचन (Peristalsis) को सक्रिय करता है, जिससे बिना किसी चूर्ण या दवा के पेट प्राकृतिक रूप से साफ होता है।

💡 **3. तुरंत आराम के लिए सरल घरेलू उपाय:**
• **हथेली का पाचन बिंदु:** दोनों हथेलियों के बिल्कुल मध्य भाग को अंगूठे से 2 मिनट क्लॉकवाइज घुमाते हुए दबाएं।
• 2 गिलास गुनगुना पानी पिएं और 10 मिनट टहलें।

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
• **Sunday Morning:** 8:00 AM to 12:00 PM
Feature: To avoid crowding, each 1-hour slot is strictly limited to 5 patients max.

${clinicFooter}`;
      }
      if (isHinglish) {
        return `Bindsukh Clinic Timings:
• **Monday se Saturday:** 8:30 AM se 4:00 PM
• **Sunday Morning:** 8:00 AM se 12:00 PM
Specialty: Bheed se bachne ke liye har 1 ghante ke slot me sirf 5 patients ko hi book kiya jata hai.

${clinicFooter}`;
      }
      return `क्लिनिक का समय (Clinic Timings):
• **सोमवार से शनिवार:** सुबह 8:30 AM से शाम 4:00 PM तक
• **रविवार (Sunday Morning):** सुबह 8:00 AM से दोपहर 12:00 PM तक
नोट: हर 1 घंटे के स्लॉट में भीड़ से बचने के लिए अधिकतम 5 मरीजों को ही समय दिया जाता है।

${clinicFooter}`;
    }

    if (q.includes('पता') || q.includes('address') || q.includes('कहाँ') || q.includes('location')) {
      if (isEnglish) {
        return `Clinic Address & Location:
**Bindsukh Acupressure & Acupuncture Center**
Puramufti Purani Bazar, Near Puramufti Panchayat Bhawan, Prayagraj (UP) - 212208
📞 Helpline / WhatsApp: +91 9455100097 / +91 8423221799

${clinicFooter}`;
      }
      if (isHinglish) {
        return `Clinic Ka Pata (Location):
**Bindsukh Acupressure & Acupuncture Center**
Puramufti Purani Bazar, Near Puramufti Panchayat Bhawan, Prayagraj (UP) - 212208
📞 Helpline / WhatsApp: +91 9455100097 / +91 8423221799

${clinicFooter}`;
      }
      return `क्लिनिक का पता:
**बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर**
पुरामुफ्ती पुरानी बाजार, निकट पुरामुफ्ती पंचायत भवन, प्रयागराज (उ.प्र.) 212208
📞 हेल्पलाइन / WhatsApp: +91 9455100097 / +91 8423221799

${clinicFooter}`;
    }

    // Default Friendly Holistic Guide
    if (isEnglish) {
      return `❤️ **1. Empathetic Acknowledgment:**
Thank you for reaching out to Bindsukh Care Assistant. We are here to listen and help you achieve natural, pain-free living.

🌿 **2. 100% Drugless Holistic Healing:**
At Bindsukh Acupressure & Acupuncture Center, Therapist Saurabh Prajapati provides non-surgical relief for chronic joint, spine, and nerve disorders by clearing energy meridian blockages.

💡 **3. Quick Health Tip:**
• Stay hydrated, maintain active posture, and avoid self-medicating with painkillers. Describe your specific symptom (e.g. knee pain, headache, back pain, sciatica) for targeted pressure point guidance!

${clinicFooter}`;
    }

    if (isHinglish) {
      return `❤️ **1. Hamari Sahanoobhuti:**
Bindsukh Care Assistant se judne ke liye dhanyawad. Hum aapko natural aur dard-mukt jeevan jeene me madad karne ke liye tatpar hain.

🌿 **2. 100% Drugless Holistic Ilaj:**
Binduskh Center me Therapist Saurabh Prajapati bina kisi dawa ya operation ke nason aur jodo ke dard ka sthayi ilaj karte hain.

💡 **3. Swasthya Salah:**
• Kripya humein apni takleef (jaise ghutne ka dard, kamar dard, cervical, sciatica ya sir dard) ke baare me batayein, hum turant sahi acupressure point aur upchar batayenge!

${clinicFooter}`;
    }

    return `❤️ **1. सहानुभूतिपूर्ण समझ (Empathetic Care):**
बिंदसुख केयर असिस्टेंट से संपर्क करने के लिए धन्यवाद। हम आपको प्राकृतिक, बिना दवा और दर्द-मुक्त जीवन देने के लिए समर्पित हैं।

🌿 **2. 100% ड्रगलेस प्राकृतिक चिकित्सा:**
बिंदसुख सेंटर में थेरेपिस्ट सौरभ प्रजापति जी द्वारा घुटने, कमर, सर्वाइकल, साइटिका, दबी नस और जटिल दर्दों का बिना ऑपरेशन स्थायी उपचार किया जाता है।

💡 **3. स्वास्थ्य सलाह:**
• कृपया अपनी विशिष्ट परेशानी (जैसे घुटने का दर्द, सिरदर्द, कमर दर्द, सर्वाइकल या साइटिका) बताएं, ताकि हम आपको तुरंत सटीक एक्यूप्रेशर बिंदु व परामर्श मार्गदर्शन दे सकें!

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
