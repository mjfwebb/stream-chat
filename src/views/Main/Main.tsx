import { TwitchConnectPage } from './TwitchConnectPage';

import './Main.less';

export const Main = () => {
  return (
    <div className="studio">
      <TwitchConnectPage />
      <footer className="studio-footer">
        <p>
          This app is open source and available on{' '}
          <a href="https://github.com/mjfwebb/twitch-chat/">
            <i className="fa fa-github"></i> GitHub
          </a>
          . If you encounter issues or have feature requests, please check the <a href="https://github.com/mjfwebb/stream-chat/issues">issues page</a>
          .
        </p>
        <p>
          Made with 🧟 by <a href="https://twitch.tv/athano">Athano</a>
        </p>
      </footer>
    </div>
  );
};
