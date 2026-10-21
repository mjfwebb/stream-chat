import { describe, expect, it } from 'vitest';
import { frankerFaceZGlobalEmotesSchema, frankerFaceZRoomEmotesSchema } from './frankerfacez/schemas';
import { sevenTVUserSchema } from './sevenTV/schemas';
import { ValidateResponseSchema } from './twitch/id/schemas';

// These guard the API schemas against changes in how zod reads the data, for example when it moves to a new major version.
describe('API schemas', () => {
  it('parses FrankerFaceZ emote sets', () => {
    const emote = { id: 1, height: 1, width: 1, hidden: false, modifier: false, modifier_flags: 0, name: 'x', urls: { '1': 'u' } };
    expect(frankerFaceZGlobalEmotesSchema.safeParse({ default_sets: [3], sets: { '3': { id: 3, title: 't', emoticons: [emote] } } }).success).toBe(
      true,
    );
    expect(frankerFaceZRoomEmotesSchema.safeParse({ sets: { '3': { id: 3, title: 't' } } }).success).toBe(true);
    expect(frankerFaceZRoomEmotesSchema.safeParse({}).success).toBe(true);
  });

  it('parses a 7TV user that has no style', () => {
    const user = { id: 'a', username: 'u', display_name: 'U', created_at: 1, avatar_url: 'x', roles: [], connections: [] };
    expect(sevenTVUserSchema.safeParse(user).success).toBe(true);
  });

  it('parses the token validation response', () => {
    expect(ValidateResponseSchema.safeParse({ client_id: 'c', login: 'l', scopes: [], user_id: '1', expires_in: 5 }).success).toBe(true);
  });
});
