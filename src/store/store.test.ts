import { beforeEach, describe, expect, it } from 'vitest';
import { ChannelChatMessageEvent } from '../types/twitchEvents';
import { store } from './store';

const makeMessage = (id: string): ChannelChatMessageEvent => ({
  broadcaster_user_id: '1',
  broadcaster_user_login: 'streamer',
  broadcaster_user_name: 'Streamer',
  chatter_user_id: '2',
  chatter_user_login: 'chatter',
  chatter_user_name: 'Chatter',
  message_id: id,
  message_type: 'text',
  message: { text: id, fragments: [{ type: 'text', text: id }] },
  badges: [],
  color: '#ffffff',
  eventType: 'channel.chat.message',
});

describe('addChatMessage', () => {
  beforeEach(() => {
    store.getState().reset();
    store.getState().setMaxChatMessages(3);
  });

  it('keeps every message while under the limit', () => {
    store.getState().addChatMessage(makeMessage('a'));
    store.getState().addChatMessage(makeMessage('b'));
    expect(store.getState().chatMessageEvents.map((m) => m.message_id)).toEqual(['a', 'b']);
  });

  it('drops the oldest messages once the limit is passed', () => {
    ['a', 'b', 'c', 'd', 'e'].forEach((id) => store.getState().addChatMessage(makeMessage(id)));
    expect(store.getState().chatMessageEvents.map((m) => m.message_id)).toEqual(['c', 'd', 'e']);
  });
});
