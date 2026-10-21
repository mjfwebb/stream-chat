import { store } from '../../store/store';

/** Stays on screen until the user connects again, because the overlay can only show what the page can load. */
export const TokenExpiredNotice = () => {
  const tokenStatus = store((s) => s.tokenStatus);

  if (tokenStatus !== 'expired') {
    return null;
  }

  const host = new URL(import.meta.env.VITE_BASE_URI).host;

  return (
    <div className="chat-token-expired" role="alert">
      <strong>Twitch access expired</strong>
      <span>Get a new overlay URL at {host} and paste it into this browser source.</span>
    </div>
  );
};
