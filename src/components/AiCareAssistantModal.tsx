import React, { useState, useEffect, useRef } from 'react';
import { CLINIC_INFO, CONDITIONS_TREATED, SERVICES_OFFERED } from '../data/clinicData';
import { useClinicLogo } from '../utils/logoHelper';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useLanguage } from '../context/LanguageContext';
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

export const AiCareAssistantModal: React.FC<AiCareAssistantModalProps> = ({
  onNavigateToBooking,
  onNavigateToMaps
}) => {
  const clinicLogo = useClinicLogo();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'hi-IN' | 'en-IN'>(language === 'en' ? 'en-IN' : 'hi-IN');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: t('chatWelcome'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Keep welcome message and voice recognition synced when language changes
  useEffect(() => {
    setActiveLang(language === 'en' ? 'en-IN' : 'hi-IN');
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-msg') {
        return [{
          id: 'welcome-msg',
          sender: 'assistant',
          text: t('chatWelcome'),
          timestamp: prev[0].timestamp
        }];
      }
      return prev;
    });
  }, [language, t]);

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

      const lowerQuery = textToSend.toLowerCase();
      const isHealthQuery =
        lowerQuery.includes('दर्द') || lowerQuery.includes('pain') || lowerQuery.includes('घुटने') ||
        lowerQuery.includes('घुटना') || lowerQuery.includes('कमर') || lowerQuery.includes('सिर') ||
        lowerQuery.includes('सर') || lowerQuery.includes('neck') || lowerQuery.includes('dard') ||
        lowerQuery.includes('तकलीफ') || lowerQuery.includes('pareshani') || lowerQuery.includes('परेशानी') ||
        lowerQuery.includes('इलाज') || lowerQuery.includes('treatment') || lowerQuery.includes('headache') ||
        lowerQuery.includes('kamar') || lowerQuery.includes('cervical') || lowerQuery.includes('गठिया') ||
        lowerQuery.includes('sciatica') || lowerQuery.includes('साइटिका') || lowerQuery.includes('कब्ज');

      // Safeguard: Never allow generic greeting to show for health queries
      if (!replyText || (isHealthQuery && (replyText.includes('नमस्ते! मैं आपका') || replyText.includes('Hello! I am your')))) {
        replyText = generateFallbackReply(textToSend);
      }

      let actionType: 'book' | 'call' | 'map' | undefined = 'book';
      const lower = replyText.toLowerCase();
      if (lower.includes('मैप') || lower.includes('पता') || lower.includes('location')) {
        actionType = 'map';
      } else if (lower.includes('कॉल') || lower.includes('फोन') || lower.includes('helpline')) {
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
      // Helpful grounded fallback
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
    const q = query.toLowerCase().replace(/[?.!,;:]/g, '').trim();

    const greetings = ['hi', 'hello', 'namaste', 'namaskar', 'hallo', 'helo', 'hey', 'kaise ho', 'good morning', 'good afternoon', 'good evening', 'hallo sir', 'hello sir', 'hi sir', 'greetings'];
    const isGreeting = greetings.some(g => q === g || q.startsWith(g + ' ')) && 
                       !q.includes('dard') && !q.includes('pain') && 
                       !q.includes('ilaj') && !q.includes('blockage') && 
                       !q.includes('nas') && !q.includes('घुटने') && 
                       !q.includes('कमर') && !q.includes('सिर') && 
                       !q.includes('दर्द');

    if (isGreeting) {
      return "नमस्ते! 🙏 मैं बिंदसुख केयर असिस्टेंट हूँ। आपकी क्या सहायता कर सकता हूँ? आप अपनी किसी भी शारीरिक परेशानी (जैसे सिर दर्द, घुटने का दर्द, नसों की समस्या) के बारे में पूछ सकते हैं।";
    }

    // Common caution & clinic footer according to language
    const cautionText = language === 'en'
      ? 'If these home remedies do not provide relief in 10-15 minutes or if the condition persists, please visit our clinic for permanent, 100% drugless healing.'
      : language === 'hinglish'
      ? 'Agar 10-15 minute me aaram na mile ya dard lagatar bana rahe, toh bina dawa permanent ilaj ke liye clinic aayein.'
      : 'अगर 10-15 मिनट में आराम न मिले या दर्द लगातार बना रहे, तो बिना दवा permanent इलाज के लिए क्लीनिक आएं।';

    const clinicFooter = language === 'en'
      ? `🏥 **3. Clinic Contact & Appointment Guide:**
Consult Therapist Saurabh Prajapati (Master in Acupressure & Acupuncture) for 100% drugless permanent relief.
• **Timing:** 8:30 AM to 4:00 PM (Monday - Saturday) | Sunday Morning 8:30 AM - 12:00 PM
• **Fee:** ₹500 (1st Visit) / ₹200 (Returning)
• **Address:** Puramufti Purani Bazar, Prayagraj (Near Panchayat Bhawan)
• **Direct Call/WhatsApp:** +91 9455110097

👉 **[Book Appointment Now]**`
      : language === 'hinglish'
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
      q.includes('सिर') || q.includes('सिरदर्द') || q.includes('सर दर्द') ||
      q.includes('सर में दर्द') || q.includes('सिर में दर्द') || q.includes('माइग्रेन') ||
      q.includes('migraine') || q.includes('headache') || q.includes('head pain') ||
      q.includes('sir dard') || q.includes('sar dard') || q.includes('sir me dard') ||
      q.includes('sar me dard') || q.includes('माथा') || q.includes('आधासीसी') ||
      ((q.includes('दर्द') || q.includes('dard') || q.includes('pain')) &&
       (q.includes('सर') || q.includes('सिर') || q.includes('head') || q.includes('sar') || q.includes('sir')));

    if (isHeadache) {
      if (language === 'en') {
        return `💡 **1. Immediate Short Solution / Home Remedies:**
• **LI4 Acupressure Point (Hegu):** Press the highest spot of the muscle between your thumb and index finger firmly for 2-3 minutes. This immediately relieves cranial tension and headache.
• **Hydration & Rest:** Drink a glass of warm water, step away from screens for 15 minutes, and place a cool compress on your forehead in a dim room.

⚠️ **2. Important Caution:**
${cautionText}

${clinicFooter}`;
      }
      if (language === 'hinglish') {
        return `💡 **1. Immediate Short Solution / Home Remedies:**
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
      if (language === 'en') {
        return `💡 **1. Immediate Short Solution / Home Remedies:**
• **ST-35 Knee Acupressure (Eye of the Knee):** Gently press the indentations just below both sides of the knee cap with your thumbs for 1-2 minutes in circular motions.
• **Warm Oil Compress & Gentle Movement:** Gently massage warm mustard or sesame oil with fenugreek seeds around the knee, followed by warm fomentation for 10 minutes. Slowly straighten and bend knee 5-10 times.

⚠️ **2. Important Caution & Next Step:**
${cautionText}

${clinicFooter}`;
      }
      if (language === 'hinglish') {
        return `💡 **1. Immediate Short Solution / Home Remedies:**
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
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **हैंड एक्यूप्रेशर पॉइंट:** हाथ के पिछले हिस्से पर रिंग फिंगर और मिडिल फिंगर के बीच की हड्डी को कलाई की ओर 2 मिनट अंगूठे से दबाएं।
• **फर्म बेड रेस्ट व जेंटल कोबरा पोज:** अत्यधिक मुलायम गद्दे से बचें, समतल फर्म मैट्रेस या तख्त पर लेटें और घुटनों के नीचे तकिया रखें। पेट के बल लेटकर हाथों के सहारे छाती को 15-20 सेकंड हल्का ऊपर उठाएं (भुजंगासन)।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 4. Cervical & Neck Pain / Frozen Shoulder
    if (q.includes('गर्दन') || q.includes('सर्वाइकल') || q.includes('cervical') || q.includes('neck') || q.includes('कंधा') || q.includes('कंधे') || q.includes('shoulder')) {
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **अंगूठे का एक्यूप्रेशर पॉइंट:** हाथ के अंगूठे के पीछे वाले भाग (गर्दन का मेरिडियन) को दूसरे हाथ के अंगूठे से 2-3 मिनट दबाएं।
• **मोटा तकिया हटाएं व जेंटल नेक स्ट्रेच:** सोते समय बहुत मोटे तकिए का प्रयोग बंद करें और गर्दन को धीरे-धीरे दाएं-बाएं और ऊपर-नीचे घुमाएं, कभी भी झटका न दें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 5. Sciatica / Tingling & Numbness
    if (q.includes('साइटिका') || q.includes('sciatica') || q.includes('झनझनाहट') || q.includes('सुन्न') || lowerCaseIncludes(q, ['tingling', 'numbness', 'khinchav'])) {
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **तलवे व एड़ी का एक्यूप्रेशर:** एड़ी के अंदरूनी व बाहरी किनारे पर 1-2 मिनट हल्का दबाव दें।
• **पैर को सहारा व सिंकाई:** पीठ के बल लेटते समय घुटने के नीचे तकिया रखें ताकि नसों पर खिंचाव न पड़े और 10-15 मिनट गुनगुनी सिकाई करें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 6. Sprain & Bone Related Issues
    if (q.includes('मोच') || q.includes('हड्डी') || q.includes('sprain') || q.includes('bone') || q.includes('moch') || q.includes('twist') || q.includes('ligament')) {
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय (Immediate Short Solution):**
• **R.I.C.E. तकनीक:** मोच वाले हिस्से पर तुरंत बर्फ की सिकाई करें (10-15 मिनट) और अंग को पूरा आराम दें।
• **एलिवेशन (ऊंचाई) व सपोर्ट:** सोते समय मोच वाले पैर या हाथ के नीचे तकिया रखें ताकि सूजन न बढ़े और क्रेप बैंडेज से हल्का सहारा दें (झटके से न चटकाएं)।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 7. Pinched Nerve & Nerve Compression
    if (q.includes('नस') || q.includes('दबी') || q.includes('ब्लॉकेज') || q.includes('nerve') || q.includes('pinched') || q.includes('nas')) {
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय (Immediate Short Solution):**
• **वार्म एंड कूल कंप्रेस:** 10 मिनट गुनगुनी सिंकाई के बाद 5 मिनट ठंडी सिंकाई करने से नसों की सूजन कम होती है।
• **दबाव से बचाव:** जिस अंग में नस दबी महसूस हो, उस पर ज्यादा वजन या गलत पोस्चर न बनाएं और हल्का जेंटल स्ट्रेच दें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 8. Cerebral Palsy (CP Child) & Delayed Walking
    if (q.includes('सीपी') || q.includes('चाइल्ड') || q.includes('cp child') || q.includes('cerebral') || q.includes('बच्च') || q.includes('walking')) {
      return `💡 **1. बच्चों के लिए घरेलू देखभाल (Immediate Home Care):**
• **जेंटल लिम्ब मसाज:** बच्चों के पैरों और पंजों की गुनगुने तिल/जैतून तेल से सौम्य मालिश करें।
• **सपोर्टिव स्टैंडिंग प्रैक्टिस:** बच्चे को दोनों हाथों से पकड़कर सीधे खड़े होने और पैर टिकाने का रोज 10-15 मिनट अभ्यास कराएं।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 9. Constipation & Digestion
    if (q.includes('कब्ज') || q.includes('constipation') || q.includes('pet') || q.includes('gas') || q.includes('अपच') || q.includes('acidity') || q.includes('एसिडिटी')) {
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **हथेली का एक्यूप्रेशर:** हथेली के बीच के पाचन बिंदु को अंगूठे से 2 मिनट क्लॉकवाइज दबाएं।
• **सुबह गुनगुना पानी व नाभि मसाज:** सुबह खाली पेट 2 गिलास गुनगुना पानी पिएं और नाभि के चारों ओर क्लॉकवाइज हल्के हाथ से मालिश करें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 10. Paralysis & Stroke
    if (q.includes('लकवा') || q.includes('paralysis') || q.includes('stroke') || q.includes('पक्षाघात')) {
      return `💡 **1. घर पर तुरंत देखभाल के 2 उपाय (Immediate Home Care):**
• **निष्क्रिय अंगों की जेंटल मूवमेंट:** प्रभावित हाथ-पैरों की उंगलियों को दिन में 3-4 बार सीधा और मोड़ें।
• **गुनगुना तेल मालिश व पोरों का दबाव:** तिल के तेल से नीचे से ऊपर की दिशा में हल्की मालिश करें और हाथ-पैरों के सबसे ऊपरी पोरों को हल्के से दबाएं।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // 11. Any general pain or health problem query
    const isGeneralHealth =
      q.includes('दर्द') || q.includes('pain') || q.includes('dard') ||
      q.includes('तकलीफ') || q.includes('takleef') || q.includes('परेशानी') ||
      q.includes('pareshani') || q.includes('बीमारी') || q.includes('bimari') ||
      q.includes('इलाज') || q.includes('ilaj') || q.includes('उपचार') ||
      q.includes('upchar') || q.includes('समस्या') || q.includes('problem') ||
      q.includes('hurts') || q.includes('chot') || q.includes('चोट');

    if (isGeneralHealth) {
      return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Immediate Short Solution):**
• **LI4 मास्टर पेन रिलीवर बिंदु (हेगु पॉइंट):** हाथ के अंगूठे और तर्जनी उंगली के बीच उभरे हुए मांसल हिस्से को 2 मिनट दबाएं — यह शरीर के किसी भी हिस्से के दर्द और तनाव को तुरंत कम करने का प्रमुख बिंदु है।
• **गुनगुनी सिंकाई व विश्राम:** दर्द वाले हिस्से पर 10-15 मिनट हल्की गुनगुनी सिकाई करें और लंबी गहरी सांसें लेकर शरीर की मांसपेशियों को ढीला छोड़ें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
${cautionText}

${clinicFooter}`;
    }

    // Fees, Timing, General
    if (q.includes('फीस') || q.includes('शुल्क') || q.includes('fee') || q.includes('charge') || q.includes('cost')) {
      return `बिंदसुख सेंटर में परामर्श एवं थेरेपी शुल्क:
• **पहली बार (1st Visit / New Patient):** ₹500
• **दोबारा आने पर (Returning / Follow-up):** मात्र ₹200
इसमें विस्तृत मेरिडियन परीक्षण व थैरेपी सत्र शामिल है।

${clinicFooter}`;
    }

    if (q.includes('समय') || q.includes('time') || q.includes('timing') || q.includes('hours') || q.includes('दिन')) {
      return `क्लिनिक का समय (Clinic Timings):
• **सोमवार से शनिवार:** सुबह 8:30 AM से शाम 4:00 PM तक
• **रविवार (Sunday Morning):** सुबह 8:30 AM से दोपहर 12:00 PM तक
नोट: हर 1 घंटे के स्लॉट में भीड़ से बचने के लिए अधिकतम 5 मरीजों को ही समय दिया जाता है।

${clinicFooter}`;
    }

    if (q.includes('पता') || q.includes('address') || q.includes('कहाँ') || q.includes('location')) {
      return `क्लिनिक का पता:
**बिंदसुख एक्यूप्रेशर एवं एक्यूपंक्चर सेंटर**
पुरामुफ्ती पुरानी बाजार, निकट पुरामुफ्ती पंचायत भवन, प्रयागराज (उ.प्र.) 212208
📞 हेल्पलाइन / WhatsApp: +91 9455110097 / +91 9455100097

${clinicFooter}`;
    }

    return `💡 **1. तुरंत आराम के लिए 2 सरल उपाय / एक्यूप्रेशर बिंदु (Home Remedies & Tips):**
• **LI4 मास्टर पेन रिलीवर बिंदु (हेगु):** अपने हाथ के अंगूठे और तर्जनी उंगली के बीच वाले हिस्से को 2 मिनट दबाएं। यह शरीर के किसी भी हिस्से के दर्द और तनाव को कम करने का प्रमुख बिंदु है।
• **सिकाई व विश्राम:** प्रभावित हिस्से पर 10-15 मिनट हल्की गुनगुनी सिकाई करें और गहरी सांसें लेकर शरीर की मांसपेशियों को तनावमुक्त रखें।

⚠️ **2. ज़रूरी सावधानी (Important Caution):**
Agar 10-15 min me aaram na mile, toh clinic me Therapist Saurabh Prajapati se milein.

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
          onClick={() => setIsOpen(true)}
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
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
                  onClick={() => {
                    if (isListening) stopListening();
                    setIsOpen(false);
                  }}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faf9]">
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
                            setIsOpen(false);
                            onNavigateToBooking();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-emerald-950 font-black text-xs shadow-md hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-500/30"
                          title="Click to select 1-hour time slot & confirm appointment"
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-950" />
                          <span>{language === 'en' ? 'Book Appointment Now' : language === 'hinglish' ? 'Book Appointment Now' : 'अपॉइंटमेंट अभी बुक करें'}</span>
                        </button>

                        {/* Direct Call +91 9455110097 */}
                        <a
                          href="tel:+919455110097"
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
                          title="Call Therapist Saurabh: +91 9455110097"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>+91 9455110097</span>
                        </a>

                        {/* Direct WhatsApp +91 9455110097 */}
                        <a
                          href={`https://wa.me/919455110097?text=${encodeURIComponent(
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
                              setIsOpen(false);
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
                <span>⚡ Powered by Gemini AI • 🎙️ {language === 'en' ? 'Voice Enabled' : language === 'hinglish' ? 'Voice Enabled' : 'वॉइस समर्थित'}</span>
                <button
                  type="button"
                  onClick={() => setMessages([{
                    id: 'welcome-msg',
                    sender: 'assistant',
                    text: t('chatWelcome'),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }])}
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
