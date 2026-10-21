import { store } from '../../../store/store';
import { logger } from '../../../utils/logger';
import { TokenValidation, validateAccessToken } from './validateAccessToken';

/** Validates the access token and records the result in the store, so the views can tell the user. */
export const checkAccessToken = async (): Promise<TokenValidation> => {
  const result = await validateAccessToken();

  if (result.status === 'valid') {
    store.getState().setTokenStatus('valid');
  } else if (result.status === 'expired') {
    logger.warn('The Twitch access token has expired. The user must connect again to get a new one.');
    store.getState().setTokenStatus('expired');
  }
  // On 'error' keep the last known status: a network problem does not mean the token is bad.

  return result;
};
