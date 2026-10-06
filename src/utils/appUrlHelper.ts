import { useState, useEffect } from 'react';

export const DEFAULT_PUBLIC_URL = 'https://ais-pre-sk3sr4ejjycj7ulqambgy2-154938787803.asia-southeast1.run.app';
export const STORAGE_KEY_PUBLIC_URL = 'clinic_custom_public_url';

/**
 * Returns the sanitized live public app URL to be used for patients and public QR codes.
 * Ensures developer URLs (ais-dev-...) are NEVER exposed to patients, converting them to
 * the public shared URL (ais-pre-...) so patients can open the booking page directly without Google login.
 */
export function getStoredPublicAppUrl(): string {
  try {
    const custom = localStorage.getItem(STORAGE_KEY_PUBLIC_URL);
    if (custom && custom.trim().length > 0) {
      let trimmed = custom.trim();
      // If user had previously stored an outdated app ID or a dev URL, upgrade it
      if (trimmed.includes('pbasuam25n55gd2u7ker4c')) {
        trimmed = DEFAULT_PUBLIC_URL;
        localStorage.setItem(STORAGE_KEY_PUBLIC_URL, trimmed);
      } else if (trimmed.includes('ais-dev-')) {
        trimmed = trimmed.replace('ais-dev-', 'ais-pre-');
        localStorage.setItem(STORAGE_KEY_PUBLIC_URL, trimmed);
      }
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = 'https://' + trimmed;
      }
      return trimmed;
    }
  } catch (err) {
    // ignore localStorage errors
  }

  // Check window.location if available and running on a real domain
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || '';
    // If it's a dev preview URL (ais-dev-), ALWAYS transform to public live URL (ais-pre-)
    // so anyone scanning the QR code can open the booking page directly without Google login!
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    // If running on a public preview or custom domain (not localhost or internal IP)
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }

  return DEFAULT_PUBLIC_URL;
}

/**
 * Resolves an absolute API endpoint URL (e.g. 'https://ais-dev-.../api/book') to prevent
 * relative path routing issues in Android WebViews, APKs, and external wrappers.
 */
export function getAbsoluteApiUrl(endpointPath: string): string {
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin && origin.startsWith('http') && !origin.includes('file://')) {
      return path;
    }
  }

  const publicBase = getStoredPublicAppUrl().replace(/\/+$/, '');
  return `${publicBase}${path}`;
}

/**
 * Safely parses a fetch Response: checks response.ok and verifies content-type header
 * includes 'application/json' before calling response.json() to prevent JSON parsing crashes.
 */
export async function safeParseJsonResponse<T = any>(
  response: Response
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (response.ok) {
    if (isJson) {
      try {
        const data = await response.json();
        return { ok: true, data };
      } catch (e: any) {
        return { ok: false, data: null, error: `Invalid JSON payload received: ${e.message}` };
      }
    } else {
      const text = await response.text();
      return { ok: true, data: text as unknown as T };
    }
  } else {
    let errorMsg = `Server error (${response.status})`;
    if (isJson) {
      try {
        const errObj = await response.json();
        errorMsg = errObj.error || errObj.message || errorMsg;
      } catch {
        // fallback
      }
    } else {
      try {
        const rawText = await response.text();
        if (rawText && rawText.length < 200 && !rawText.includes('<html')) {
          errorMsg = rawText;
        }
      } catch {
        // fallback
      }
    }
    return { ok: false, data: null, error: errorMsg };
  }
}

/**
 * Updates the stored custom public URL both in localStorage and on the server.
 */
export async function setStoredPublicAppUrl(newUrl: string): Promise<boolean> {
  try {
    let clean = (newUrl || '').trim();
    if (clean) {
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      localStorage.setItem(STORAGE_KEY_PUBLIC_URL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_PUBLIC_URL);
    }

    // Dispatch custom event for real-time reactivity across all components
    window.dispatchEvent(new CustomEvent('clinic_public_url_updated', { detail: clean || DEFAULT_PUBLIC_URL }));

    // Sync with server backend
    try {
      await fetch('/api/clinic-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPublicAppUrl: clean })
      });
    } catch (e) {
      // server sync failure non-blocking
    }

    return true;
  } catch (err) {
    console.error('Failed to set public app URL:', err);
    return false;
  }
}

/**
 * Resets the public URL back to the default official shared URL.
 */
export async function resetStoredPublicAppUrl(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY_PUBLIC_URL);
    window.dispatchEvent(new CustomEvent('clinic_public_url_updated', { detail: DEFAULT_PUBLIC_URL }));
    try {
      await fetch('/api/clinic-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPublicAppUrl: '' })
      });
    } catch (e) {
      // non-blocking
    }
  } catch (err) {
    console.error('Failed to reset public app URL:', err);
  }
}

/**
 * React hook to get and manage the live public application URL.
 */
export function usePublicAppUrl() {
  const [publicAppUrl, setPublicAppUrlState] = useState<string>(() => getStoredPublicAppUrl());
  const [isCustom, setIsCustom] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PUBLIC_URL);
      return Boolean(saved && saved.trim().length > 0);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 1. Initial check from backend settings
    fetch('/api/clinic-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.customPublicAppUrl) {
          const serverUrl = data.customPublicAppUrl.trim();
          if (serverUrl && !localStorage.getItem(STORAGE_KEY_PUBLIC_URL)) {
            localStorage.setItem(STORAGE_KEY_PUBLIC_URL, serverUrl);
            setPublicAppUrlState(serverUrl);
            setIsCustom(true);
          }
        }
      })
      .catch(() => {});

    // 2. Listen to custom event when URL changes
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const newUrl = customEvent.detail || getStoredPublicAppUrl();
      setPublicAppUrlState(newUrl);
      setIsCustom(Boolean(localStorage.getItem(STORAGE_KEY_PUBLIC_URL)));
    };

    window.addEventListener('clinic_public_url_updated', handler);
    return () => window.removeEventListener('clinic_public_url_updated', handler);
  }, []);

  const updateUrl = async (newUrl: string): Promise<boolean> => {
    const success = await setStoredPublicAppUrl(newUrl);
    if (success) {
      const clean = getStoredPublicAppUrl();
      setPublicAppUrlState(clean);
      setIsCustom(Boolean(localStorage.getItem(STORAGE_KEY_PUBLIC_URL)));
    }
    return success;
  };

  const resetUrl = async (): Promise<void> => {
    await resetStoredPublicAppUrl();
    setPublicAppUrlState(DEFAULT_PUBLIC_URL);
    setIsCustom(false);
  };

  return {
    publicAppUrl,
    updateUrl,
    resetUrl,
    isCustom,
    defaultUrl: DEFAULT_PUBLIC_URL
  };
}
