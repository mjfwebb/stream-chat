import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/Toast/ToastContext.tsx';

Sentry.init({
  dsn: 'https://a688e1582950d78e4cb076f4fad4d95f@o939511.ingest.us.sentry.io/4510030479556608',
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
  },
});

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
);
