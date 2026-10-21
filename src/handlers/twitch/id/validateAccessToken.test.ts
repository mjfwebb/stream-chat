import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { persistedStore, store } from '../../../store/store';
import { checkAccessToken } from './checkAccessToken';
import { validateAccessToken } from './validateAccessToken';

const validResponse = { client_id: 'abc', login: 'athano', scopes: ['user:read:chat'], user_id: '123', expires_in: 5000 };

const respondWith = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status, json: () => Promise.resolve(body) }));

describe('validateAccessToken', () => {
  beforeEach(() => {
    persistedStore.setState({ accessToken: 'token' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the user when Twitch accepts the token', async () => {
    respondWith(200, validResponse);
    expect(await validateAccessToken()).toEqual({ status: 'valid', data: validResponse });
  });

  it('reports an expired token when Twitch answers 401', async () => {
    respondWith(401, { status: 401, message: 'invalid access token' });
    expect(await validateAccessToken()).toEqual({ status: 'expired' });
  });

  it('reports an error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await validateAccessToken()).toEqual({ status: 'error' });
  });

  it('reports an error when the answer has an unexpected shape', async () => {
    respondWith(200, { hello: 'world' });
    expect(await validateAccessToken()).toEqual({ status: 'error' });
  });
});

describe('checkAccessToken', () => {
  beforeEach(() => {
    persistedStore.setState({ accessToken: 'token' });
    store.getState().setTokenStatus('unknown');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks the token valid', async () => {
    respondWith(200, validResponse);
    await checkAccessToken();
    expect(store.getState().tokenStatus).toBe('valid');
  });

  it('marks the token expired on 401', async () => {
    respondWith(401, {});
    await checkAccessToken();
    expect(store.getState().tokenStatus).toBe('expired');
  });

  it('keeps the last status when the check fails, because a network error does not mean the token is bad', async () => {
    store.getState().setTokenStatus('valid');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await checkAccessToken();
    expect(store.getState().tokenStatus).toBe('valid');
  });

  it('recovers when a later check succeeds', async () => {
    respondWith(401, {});
    await checkAccessToken();
    respondWith(200, validResponse);
    await checkAccessToken();
    expect(store.getState().tokenStatus).toBe('valid');
  });
});
