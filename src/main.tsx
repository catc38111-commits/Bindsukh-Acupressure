import './index.css';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';

// Catch and suppress Vite HMR WebSocket connection errors gracefully in iframe environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    if (e.reason?.message?.includes('WebSocket') || String(e.reason).includes('WebSocket')) {
      e.preventDefault();
    }
  });
}

// Register PWA service worker directly on app load with instant auto-update and reload
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Bindsukh PWA Service Worker registered:', reg.scope);

        // When a new service worker is detected, trigger auto-reload
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New update available! Reloading page for instant sync...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration warning:', err);
      });

    // Also trigger reload when the active service worker takes control (via skipWaiting + claim)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[PWA] Service Worker controller changed! Refreshing instantly...');
        window.location.reload();
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Hide initial preloader smoothly once React mounts
const preloader = document.getElementById('initial-preloader');
if (preloader) {
  preloader.style.opacity = '0';
  setTimeout(() => preloader.remove(), 400);
}

