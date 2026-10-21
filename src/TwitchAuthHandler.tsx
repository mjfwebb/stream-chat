import { useEffect, useState } from 'react';
import { Redirect } from 'wouter';
import { persistedStore } from './store/store';
import { logger } from './utils/logger';

const getTwitchAuthResponseData = () => {
  const url = new URL(window.location.href);
  const urlParams = new URLSearchParams(url.hash.replace('#', ''));
  const accessToken = urlParams.get('access_token');
  const scope = urlParams.get('scope');
  const state = urlParams.get('state');
  const tokenType = urlParams.get('token_type');

  return { accessToken, scope, state, tokenType };
};

export const TwitchAuthHandler = () => {
  const authStateValue = persistedStore((s) => s.authStateValue);
  const [tokenStored, setTokenStored] = useState(false);

  const { accessToken, state } = getTwitchAuthResponseData();
  const stateIsValid = state === authStateValue;

  // Saving the token is a side effect, so it must not run while rendering.
  useEffect(() => {
    if (stateIsValid && accessToken) {
      persistedStore.getState().setAccessToken(accessToken);
      setTokenStored(true);
    }
  }, [stateIsValid, accessToken]);

  if (!stateIsValid) {
    logger.error('Invalid state value. Possible CSRF attack.');
    return <span>Error: Invalid state value.</span>;
  }

  if (!accessToken) {
    return <span>Error: No access token found in the URL hash.</span>;
  }

  // Leave the page only after the token is saved.
  return tokenStored ? <Redirect to="/" /> : null;
};
