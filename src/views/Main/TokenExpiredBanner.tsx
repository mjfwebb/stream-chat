import { Button } from '../../components/Button/Button';
import { store } from '../../store/store';

import './TokenExpiredBanner.less';

export const TokenExpiredBanner = ({ onReconnect }: { onReconnect: () => void }) => {
  const tokenStatus = store((s) => s.tokenStatus);

  if (tokenStatus !== 'expired') {
    return null;
  }

  return (
    <div className="studio-wrap">
      <div className="token-banner" role="alert">
        <div className="token-banner-text">
          <b>Your Twitch connection expired</b>
          <span>Reconnect to get a new overlay URL, then paste it into your OBS browser source.</span>
        </div>
        <Button type="primary" onClick={onReconnect}>
          Reconnect with Twitch
        </Button>
      </div>
    </div>
  );
};
