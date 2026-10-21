import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { SourceUrl } from '../../components/SourceUrl/SourceUrl';
import { useToast } from '../../components/Toast/useToast';
import { CUSTOMIZING_GUIDE_URL, DEFAULT_CHAT_SETTINGS_VALUES, TWITCH_AUTH_URL } from '../../constants';
import { persistedStore, store } from '../../store/store';
import { ChatPreview } from './ChatPreview/ChatPreview';
import { ChatSettings } from './ChatSettings';
import { TokenExpiredBanner } from './TokenExpiredBanner';

import './TwitchConnectPage.less';

type View = 'editor' | 'obs';

const VIEWS: { id: View; label: string }[] = [
  { id: 'editor', label: 'Overlay editor' },
  { id: 'obs', label: 'OBS setup' },
];

export const TwitchConnectPage = () => {
  const accessToken = persistedStore((s) => s.accessToken);
  const userId = store((s) => s.userId);
  const userLogin = store((s) => s.userLogin);
  const clientId = store((s) => s.clientId);
  const baseOverlayURL = `${import.meta.env.VITE_BASE_URI}/chat?access_token=${accessToken}`;
  const [chatUrl, setChatUrl] = useState(baseOverlayURL);
  const [channelName, setChannelName] = useState('');
  const [view, setView] = useState<View>('editor');
  const toast = useToast();

  const handleLogin = () => {
    const generatedStateValue = Math.random().toString(36).substring(2, 15);
    persistedStore.getState().setAuthStateValue(generatedStateValue);
    const authStateValue = persistedStore.getState().authStateValue;
    window.location.assign(
      `${TWITCH_AUTH_URL}authorize?response_type=token&client_id=${clientId}&redirect_uri=${import.meta.env.VITE_AUTH_REDIRECT_URI}&scope=user%3Aread%3Achat&state=${authStateValue}`,
    );
  };

  const handleLogout = () => {
    persistedStore.getState().setAccessToken('');
    store.getState().reset();
    window.location.assign('/');
  };

  const handleChannelNameChange = () => {
    if (channelName === '') {
      return;
    }
    const url = new URL(chatUrl);
    url.searchParams.set('channel', channelName);
    setChatUrl(url.toString());

    toast.showToast('Channel updated!');
  };

  if (accessToken && userLogin && userId) {
    // OBS uses the applied URL, so read the browser source size from it.
    const appliedParams = new URL(chatUrl).searchParams;
    const obsWidth = appliedParams.get('width') ?? `${DEFAULT_CHAT_SETTINGS_VALUES.widthValue}${DEFAULT_CHAT_SETTINGS_VALUES.widthUnit}`;
    const obsHeight = appliedParams.get('height') ?? `${DEFAULT_CHAT_SETTINGS_VALUES.heightValue}${DEFAULT_CHAT_SETTINGS_VALUES.heightUnit}`;

    return (
      <div className="twitch-connect-page">
        <header className="studio-header">
          <div className="studio-wrap studio-header-inner">
            <div className="studio-brand">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                <rect x="1" y="2" width="24" height="17" rx="5" fill="currentColor" />
                <path d="M7 19l-1 5 6-5z" fill="currentColor" />
                <rect x="6" y="7" width="9" height="2.2" rx="1.1" fill="var(--surface)" />
                <rect x="6" y="11.5" width="14" height="2.2" rx="1.1" fill="var(--surface)" opacity=".7" />
              </svg>
              Stream Chat
            </div>
            <nav className="studio-nav" aria-label="Sections">
              {VIEWS.map((v) => (
                <button key={v.id} type="button" aria-current={view === v.id} onClick={() => setView(v.id)}>
                  {v.label}
                </button>
              ))}
            </nav>
            <span className="studio-spacer" />
            <div className="studio-who">
              <span className="studio-who-dot" aria-hidden="true" />
              {userLogin} <small>id {userId}</small>
              <Button type="ghost" onClick={handleLogout}>
                Disconnect
              </Button>
            </div>
          </div>
        </header>

        <TokenExpiredBanner onReconnect={handleLogin} />

        {/* Kept mounted so unsaved editor changes survive a trip to the OBS tab. */}
        <div hidden={view !== 'editor'}>
          <ChatSettings chatUrl={chatUrl} setChatUrl={setChatUrl} />
        </div>

        {view === 'obs' && (
          <div className="studio-wrap obs">
            <section className="card">
              <h2>Add the overlay to OBS</h2>
              <ol className="steps">
                <li>
                  <b>Open the Sources panel</b>
                  <p>In OBS, it sits under your scene list.</p>
                </li>
                <li>
                  <b>Press + and choose Browser</b>
                  <p>Name the source Stream Chat.</p>
                </li>
                <li>
                  <b>Match the size</b>
                  <p>Use the width and height shown on the right.</p>
                </li>
                <li>
                  <b>Paste this URL</b>
                  <p>Keep it private. It contains your access token.</p>
                  <div className="obs-url">
                    <SourceUrl url={chatUrl} />
                    <CopyButton text={chatUrl} type="primary" />
                  </div>
                </li>
              </ol>
            </section>
            <div className="obs-side">
              <section className="card">
                <h3>Values for OBS</h3>
                <dl className="kv">
                  <dt>Width</dt>
                  <dd>{obsWidth}</dd>
                  <dt>Height</dt>
                  <dd>{obsHeight}</dd>
                  <dt>Custom CSS</dt>
                  <dd>optional</dd>
                </dl>
                <p className="hint">These come from the applied URL. If a size is in vh or vw, enter the matching pixels for your canvas in OBS.</p>
                <p className="hint">
                  Want to restyle something that the editor does not cover? Add your own CSS in the Custom CSS box.{' '}
                  <a href={CUSTOMIZING_GUIDE_URL} target="_blank" rel="noreferrer">
                    Read the customizing guide
                  </a>
                  .
                </p>
              </section>
              <section className="card">
                <h3>Watch another channel</h3>
                <p className="hint">
                  By default the overlay shows your own chat. Enter a channel name to show a different one. Names are case sensitive.
                </p>
                <div className="inline">
                  <input
                    type="text"
                    placeholder="Channel name"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    autoComplete="off"
                    aria-label="Channel name"
                  />
                  <Button type="secondary" onClick={handleChannelNameChange}>
                    Set channel
                  </Button>
                </div>
                <span className="pill pill-good">Showing {appliedParams.get('channel') ?? userLogin}</span>
              </section>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <TokenExpiredBanner onReconnect={handleLogin} />
      <div className="studio-wrap twitch-connect-page-logged-out">
        <div className="logged-out-copy">
          <h1>Your chat, on stream, looking exactly how you want.</h1>
          <p className="lead">
            Design an overlay with a live preview, then paste one URL into OBS. Emotes from Twitch, 7TV, BetterTTV and FrankerFaceZ show up as they do
            in chat.
          </p>
          <Button type="twitch" onClick={handleLogin}>
            Connect with Twitch
          </Button>
          <div className="permissions">
            <b>What you allow</b>
            <ul>
              <li>
                <span className="permissions-yes" aria-hidden="true">
                  ✓
                </span>{' '}
                Read chat in channels you open (<code>user:read:chat</code>)
              </li>
              <li>
                <span className="permissions-no" aria-hidden="true">
                  ✕
                </span>{' '}
                Post messages, moderate or change your channel
              </li>
            </ul>
          </div>
        </div>
        <ChatPreview overlayParameters={DEFAULT_CHAT_SETTINGS_VALUES} />
      </div>
    </>
  );
};
