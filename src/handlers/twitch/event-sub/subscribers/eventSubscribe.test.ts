import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { persistedStore, store } from '../../../../store/store';
import { eventSubscribe } from './eventSubscribe';

describe('eventSubscribe', () => {
  beforeEach(() => {
    persistedStore.setState({ accessToken: 'token' });
    store.getState().setTokenStatus('valid');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks the token expired when Twitch rejects it with 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));
    await eventSubscribe('session', 'channel.chat.message', { broadcaster_user_id: '1', user_id: '2' });
    expect(store.getState().tokenStatus).toBe('expired');
  });

  it('leaves the status alone when the subscription succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 202 }));
    await eventSubscribe('session', 'channel.chat.message', { broadcaster_user_id: '1', user_id: '2' });
    expect(store.getState().tokenStatus).toBe('valid');
  });
});
