// https://dev.twitch.tv/docs/authentication/validate-tokens/

import { TWITCH_AUTH_URL } from '../../../constants';
import { persistedStore } from '../../../store/store';
import { logger } from '../../../utils/logger';
import { ValidateResponse, ValidateResponseSchema } from './schemas';

export type TokenValidation =
  // Twitch accepted the token.
  | { status: 'valid'; data: ValidateResponse }
  // Twitch answered 401: the token is expired or was revoked. Only the user can fix this.
  | { status: 'expired' }
  // We could not tell, for example because of a network error. Try again later.
  | { status: 'error' };

export const validateAccessToken = async (): Promise<TokenValidation> => {
  try {
    const url = `${TWITCH_AUTH_URL}validate`;
    const accessToken = persistedStore.getState().accessToken;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    if (response.status === 401) {
      return { status: 'expired' };
    }

    const result: unknown = await response.json();

    const parsed = ValidateResponseSchema.safeParse(result);
    if (parsed.success) {
      return { status: 'valid', data: parsed.data };
    }
  } catch (error) {
    logger.error(`Failed to validate access token: ${JSON.stringify(error)}`);
  }

  return { status: 'error' };
};
