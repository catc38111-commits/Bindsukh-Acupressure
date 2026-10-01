import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Smartphone, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleClearCacheAndReload = () => {
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }
    } catch (e) {
      console.warn('Error clearing caches:', e);
    }
    setTimeout(() => {
      window.location.href = window.location.origin + '?t=' + Date.now();
    }, 200);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900">
                Bindsukh Center Portal
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                पेज को दोबारा लोड करने की आवश्यकता है (Refresh Required)
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-slate-900">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>iPhone / Mobile Quick Fix:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                <li>पेज को एक बार Reload / Refresh करें।</li>
                <li>iPhone Safari में शेयर बटन दबाकर "Add to Home Screen" करें।</li>
                <li>या Google Chrome ऐप में खोलें।</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page (रिफ्रेश करें)</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors border border-slate-300"
              >
                Clear Cache &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
