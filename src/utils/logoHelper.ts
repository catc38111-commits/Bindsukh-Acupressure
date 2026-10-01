import { useState, useEffect } from 'react';

export const OFFICIAL_CLINIC_LOGO = 'https://i.postimg.cc/RF5zbscT/IMG-20260922-144104-(1).jpg';
const DEFAULT_LOGO = OFFICIAL_CLINIC_LOGO;
const LOGO_STORAGE_KEY = 'clinic_custom_logo';

export function getStoredClinicLogo(): string {
  try {
    const custom = localStorage.getItem(LOGO_STORAGE_KEY);
    if (custom && custom.startsWith('data:image/')) {
      return custom;
    }
  } catch {
    // fallback
  }
  return DEFAULT_LOGO;
}

export function setStoredClinicLogo(dataUrl: string | null) {
  try {
    if (dataUrl) {
      localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
    } else {
      localStorage.removeItem(LOGO_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('clinic_logo_updated', { detail: dataUrl }));
  } catch {
    // ignore
  }
}

export function useClinicLogo(): string {
  const [logoSrc, setLogoSrc] = useState<string>(() => getStoredClinicLogo());

  useEffect(() => {
    const handleLogoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      if (customEvent.detail) {
        setLogoSrc(customEvent.detail);
      } else {
        setLogoSrc(getStoredClinicLogo());
      }
    };

    window.addEventListener('clinic_logo_updated', handleLogoUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOGO_STORAGE_KEY) {
        setLogoSrc(getStoredClinicLogo());
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('clinic_logo_updated', handleLogoUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return logoSrc;
}
