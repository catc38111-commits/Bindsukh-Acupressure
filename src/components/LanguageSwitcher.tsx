import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, AppLanguage } from '../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languageOptions: { id: AppLanguage; label: string; native: string; badge: string }[] = [
    { id: 'hi', label: 'Hindi', native: 'हिंदी', badge: 'HI' },
    { id: 'en', label: 'English', native: 'English', badge: 'EN' },
    { id: 'hinglish', label: 'Hinglish', native: 'Hinglish', badge: 'HING' },
  ];

  const currentOption = languageOptions.find((l) => l.id === language) || languageOptions[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Top Bar Switcher Trigger Button */}
      <button
        id="language-switcher-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-1.5 py-1 text-[11px] sm:text-xs border border-emerald-300 rounded-md bg-emerald-50 text-emerald-800 flex items-center gap-0.5 font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
        title="भाषा बदलें / Change Language / Bhasha Chunein"
        aria-expanded={isOpen}
      >
        <Globe className="w-3 h-3 text-emerald-700 shrink-0" />
        <span className="font-extrabold text-[11px] sm:text-xs">
          {currentOption.native}
        </span>
        <ChevronDown className={`w-2.5 h-2.5 text-emerald-700 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-emerald-100 shadow-2xl rounded-xl z-[90] overflow-hidden transition-all duration-200 ease-out animate-in fade-in zoom-in-95 py-1.5">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Select Language (भाषा)
          </div>

          {languageOptions.map((opt) => {
            const isSelected = opt.id === language;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setLanguage(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-5 rounded bg-emerald-100/70 text-emerald-900 text-[10px] font-extrabold flex items-center justify-center">
                    {opt.badge}
                  </span>
                  <div>
                    <div className="leading-tight">{opt.native}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{opt.label}</div>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
