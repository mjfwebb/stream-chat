import { useEffect, useState } from 'react';
import { Route, Switch, useSearchParams } from 'wouter';
import './App.css';
import { fetchBadges } from './handlers/twitch/helix/fetchBadges';
import { fetchCheers } from './handlers/twitch/helix/fetchCheers';
import { useMount } from './hooks/useMount';
import { persistedStore } from './store/store';
import { TwitchAuthHandler } from './TwitchAuthHandler';
import { TwitchBroadcasterIdLoader } from './TwitchBroadcasterIdLoader';
import { Chat } from './views/Chat/Chat';
import { Main } from './views/Main/Main';

function App() {
  const accessToken = persistedStore((s) => s.accessToken);
  const [searchParams] = useSearchParams();
  const [paramsApplied, setParamsApplied] = useState(false);

  const tokenFromParams = searchParams.get('access_token');
  const channelFromParams = searchParams.get('channel');
  const sevenTVEnabled = searchParams.get('7tv-emotes');
  const betterTTVEnabled = searchParams.get('bttv-emotes');
  const frankerFaceZEnabled = searchParams.get('ffz-emotes');

  useMount(() => {
    void fetchBadges('global');
    void fetchCheers('global');
  });

  // Copy the URL parameters into the store. This is a side effect, so it must not run while rendering.
  useEffect(() => {
    const state = persistedStore.getState();

    // Try to get the access token from the URL
    if (!state.accessToken && tokenFromParams) {
      state.setAccessToken(tokenFromParams);
    }

    // If no channel is specified, default to the broadcaster's channel
    state.setChannel(channelFromParams ?? '');

    // Try to get emote service enable flags from the URL
    if (sevenTVEnabled) {
      state.setSevenTVEnabled(sevenTVEnabled === 'true');
    }
    if (betterTTVEnabled) {
      state.setBetterTTVEnabled(betterTTVEnabled === 'true');
    }
    if (frankerFaceZEnabled) {
      state.setFrankerFaceZEnabled(frankerFaceZEnabled === 'true');
    }

    setParamsApplied(true);
  }, [tokenFromParams, channelFromParams, sevenTVEnabled, betterTTVEnabled, frankerFaceZEnabled]);

  // The views read the store when they mount, so wait until the parameters are in it.
  if (!paramsApplied) {
    return null;
  }

  return (
    <>
      {accessToken && <TwitchBroadcasterIdLoader />}
      <Switch>
        <Route path="/" component={Main} />
        <Route path="/auth" component={TwitchAuthHandler} />
        <Route path="/chat" component={Chat} />
        <Route>404: No such page!</Route>
      </Switch>
    </>
  );
}

export default App;
