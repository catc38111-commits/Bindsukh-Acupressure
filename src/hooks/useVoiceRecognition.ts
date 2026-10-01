import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRecognitionOptions {
  onResult?: (text: string) => void;
  lang?: string; // 'hi-IN' | 'en-IN' | 'en-US'
}

export function useVoiceRecognition(options?: VoiceRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback((targetLang = 'hi-IN') => {
    setError(null);
    setTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('आपकी ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। कृपया टाइप करें।');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = targetLang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (options?.onResult) {
          options.onResult(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Voice Recognition] error:', event.error);
        if (event.error === 'not-allowed') {
          setError('माइक्रोफोन अनुमति अस्वीकृत। कृपया माइक्रोफोन एक्सेस की अनुमति दें।');
        } else if (event.error === 'no-speech') {
          setError('कोई आवाज़ सुनाई नहीं दी। कृपया पुनः बोलें।');
        } else {
          setError(`वॉइस त्रुटि: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('[Voice Recognition] start error:', err);
      setIsListening(false);
      setError('वॉइस रिकॉर्डर शुरू नहीं हो सका।');
    }
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening
  };
}
