import React, { useState, useRef } from 'react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { Upload, CheckCircle2, AlertCircle, Image as ImageIcon, X, Sparkles, RefreshCw, RotateCcw } from 'lucide-react';
import { getStoredClinicLogo, setStoredClinicLogo } from '../utils/logoHelper';

interface UploadLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Client-side square-crop and downsampling helper
const processAndSquareImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const TARGET_SIZE = 800; // High-res crisp 800x800 square
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // Crop centered square
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const UploadLogoModal: React.FC<UploadLogoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  useLockBodyScroll(isOpen);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentLogo = getStoredClinicLogo();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('कृपया केवल इमेज फाइल (JPG, PNG, WEBP) चुनें।');
      return;
    }

    // Limit to 30MB
    if (file.size > 30 * 1024 * 1024) {
      setErrorMessage('फाइल का साइज़ 30MB से कम होना चाहिए।');
      return;
    }

    try {
      setSelectedFile(file);
      const processedDataUrl = await processAndSquareImage(file);
      setPreviewUrl(processedDataUrl);
    } catch {
      setErrorMessage('इमेज प्रोसेस करने में समस्या आई। कृपया दूसरी फोटो चुनें।');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewUrl) {
      setErrorMessage('कृपया पहले अपनी गैलरी से लोगो फोटो चुनें।');
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Send to server backend to write clinic-logo.png & PWA icons
      try {
        const res = await fetch('/api/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: previewUrl }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          console.warn('Backend logo sync notice:', errData?.error);
        }
      } catch (backendErr) {
        console.warn('Backend sync failed, storing in client state:', backendErr);
      }

      // 2. Save in localStorage for instant, offline, and multi-tab sync
      setStoredClinicLogo(previewUrl);

      // 3. Update all existing image elements on DOM
      const logoImgs = document.querySelectorAll('img[src*="clinic-logo"], img[src*="pwa"], img[src*="apple-touch"]');
      logoImgs.forEach((img) => {
        const el = img as HTMLImageElement;
        el.src = previewUrl;
      });

      setSuccessMessage('🎉 आपका असली क्लिनिक लोगो सफलतापूर्वक पूरे एप्लिकेशन में लागू हो गया है!');

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'अपलोड विफल रहा।');
    } finally {
      setUploading(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('क्या आप लोगो को वापस मूल (Default) लोगो पर सेट करना चाहते हैं?')) {
      setStoredClinicLogo(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setSuccessMessage('लोगो को मूल डिफ़ॉल्ट पर रीसेट कर दिया गया है।');
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-white/80 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-emerald-300 hover:text-white rounded-full bg-emerald-800/50 hover:bg-emerald-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mb-2 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Official Brand Asset • डॉक्टर सुरक्षा व्यवस्थापक
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif">
            क्लिनिक लोगो अपलोड व प्रबंधन
          </h3>
          <p className="text-xs text-emerald-200 mt-1">
            अपने फोन या कंप्यूटर की गैलरी से असली क्लिनिक लोगो फोटो चुनें — यह बिना किसी त्रुटि के तुरंत गोल आकार में सेट हो जाएगी।
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current vs New Preview */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-slate-500 mb-2">वर्तमान लोगो</span>
              <img
                src={currentLogo}
                alt="Current Logo"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-700 shadow-md bg-emerald-950"
              />
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-emerald-900 mb-2">नया फोटो प्रिव्यू</span>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="New Logo Preview"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-400 shadow-md ring-2 ring-emerald-400 bg-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-300">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                </div>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Choose File Button */}
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs sm:text-sm rounded-2xl transition-all border border-emerald-300 flex items-center justify-center gap-2 shadow-xs active:scale-98 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-800" />
              <span>
                {selectedFile ? `चयनित: ${selectedFile.name}` : 'फोन गैलरी या फाइल से असली लोगो फोटो चुनें'}
              </span>
            </button>
            <p className="text-[11px] text-slate-500">
              (JPG, PNG, या WEBP फोटो चुनें - ऑटो-क्रॉप होकर सही सेंटर में सेट हो जाएगा)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            {currentLogo !== '/clinic-logo.png' && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="w-full sm:w-auto py-2.5 px-3 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-xl border border-slate-200 hover:border-rose-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Reset to default logo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>मूल लोगो रीसेट करें</span>
              </button>
            )}

            <div className="w-full flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
                className="flex-2 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>अपलोड व लागू हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>सेव करें और लागू करें (Apply Logo)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
