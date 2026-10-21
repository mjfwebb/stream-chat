import { readdirSync, readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CHAT_SETTINGS_VALUES } from '../../constants';
import type { ChannelChatMessageEvent } from '../../types/twitchEvents';
import { compileHighlightRules } from '../../utils/highlights';
import { ChatEntry } from './ChatEntry';

// The class names and data attributes in CUSTOMIZING.md are a promise to streamers who write their own CSS.
// These tests render real messages and check that the promise holds.

const defaults = DEFAULT_CHAT_SETTINGS_VALUES;

const makeMessage = (overrides: Partial<ChannelChatMessageEvent> = {}): ChannelChatMessageEvent => ({
  broadcaster_user_id: '1',
  broadcaster_user_login: 'streamer',
  broadcaster_user_name: 'Streamer',
  chatter_user_id: '42',
  chatter_user_login: 'Alice',
  chatter_user_name: 'Alice',
  message_id: 'id',
  message_type: 'text',
  message: { text: 'hello', fragments: [{ type: 'text', text: 'hello' }] },
  badges: [],
  color: '#ff5733',
  eventType: 'channel.chat.message',
  ...overrides,
});

const render = (message: ChannelChatMessageEvent, settings: Partial<Parameters<typeof ChatEntry>[0]> = {}) =>
  renderToStaticMarkup(
    <ChatEntry
      chatMessage={message}
      backgroundColor="transparent"
      showAvatars={false}
      showBorders={false}
      dropShadowEnabled={false}
      dropShadowSettings=""
      textStrokeEnabled={false}
      textStrokeSettings=""
      showColonAfterDisplayName={false}
      showNameAlias={false}
      showGifs
      usernameColor="corrected"
      showReplies
      highlightStrength={defaults.highlightStrength}
      noticeColors={{ subs: defaults.noticeColorSubs, gifts: defaults.noticeColorGifts, raids: defaults.noticeColorRaids }}
      showNoticeLabels
      chatMessagePadding="5px"
      userInformationStore={{}}
      highlightPoints
      highlightMentions
      highlightFirstMessages
      highlightMentionsColor={defaults.highlightMentionsColor}
      highlightFirstColor={defaults.highlightFirstColor}
      highlightPointsColor={defaults.highlightPointsColor}
      highlightRules={[]}
      {...settings}
    />,
  );

// The classes on the outer message element
const messageClasses = (html: string): string[] => (/<button class="([^"]*)"/.exec(html)?.[1] ?? '').split(' ');

const badge = (set_id: string) => ({ set_id, id: '1', info: '' });

describe('classes for the kind of chatter', () => {
  it('adds a class for each role, from the badges', () => {
    const html = render(makeMessage({ badges: [badge('moderator'), badge('subscriber'), badge('vip'), badge('broadcaster')] }));
    expect(messageClasses(html)).toEqual(
      expect.arrayContaining([
        'chat-message',
        'chat-message--subscriber',
        'chat-message--vip',
        'chat-message--moderator',
        'chat-message--broadcaster',
      ]),
    );
  });

  it('counts a founder as a subscriber', () => {
    expect(messageClasses(render(makeMessage({ badges: [badge('founder')] })))).toContain('chat-message--subscriber');
  });

  it('adds no role class to a chatter without badges', () => {
    expect(messageClasses(render(makeMessage())).filter((name) => /--(subscriber|vip|moderator|broadcaster)$/.test(name))).toEqual([]);
  });

  it('puts the lowercase login and the user ID in data attributes', () => {
    const html = render(makeMessage({ chatter_user_login: 'MixedCase', chatter_user_id: '777' }));
    expect(html).toContain('data-user="mixedcase"');
    expect(html).toContain('data-user-id="777"');
  });
});

describe('classes for highlights', () => {
  const mention = makeMessage({
    message: {
      text: '@streamer hi',
      fragments: [{ type: 'mention', text: '@streamer', mention: { user_id: '1', user_name: 'Streamer', user_login: 'streamer' } }],
    },
  });

  it('names a channel point highlight', () => {
    const classes = messageClasses(render(makeMessage({ message_type: 'channel_points_highlighted' })));
    expect(classes).toEqual(expect.arrayContaining(['chat-message--highlight', 'chat-message--highlight-points']));
  });

  it('names a channel point highlight that has its own color too', () => {
    const classes = messageClasses(render(makeMessage({ message_type: 'channel_points_highlighted' }), { highlightPointsColor: '#ff0066' }));
    expect(classes).toContain('chat-message--highlight-points');
  });

  it('names a mention, a first message and a rule', () => {
    expect(messageClasses(render(mention))).toEqual(expect.arrayContaining(['chat-message--highlight', 'chat-message--highlight-mention']));
    expect(messageClasses(render(makeMessage({ message_type: 'user_intro' })))).toContain('chat-message--highlight-first');
    const highlightRules = compileHighlightRules({ rules: [{ matchType: 'contains', pattern: 'hello', caseSensitive: false, color: '#ff0000' }] });
    expect(messageClasses(render(makeMessage(), { highlightRules }))).toContain('chat-message--highlight-rule');
  });

  it('adds no highlight class to a plain message', () => {
    expect(messageClasses(render(makeMessage())).filter((name) => name.includes('highlight'))).toEqual([]);
  });
});

describe('classes for banners and other kinds', () => {
  it('names each kind of banner and does not call it a highlight', () => {
    for (const kind of ['subs', 'gifts', 'raids', 'announcements'] as const) {
      const html = render(makeMessage({ notice: { kind, label: kind.toUpperCase(), color: '#ff8800' } }));
      const classes = messageClasses(html);
      expect(classes).toEqual(expect.arrayContaining(['chat-message--notice', `chat-message--notice-${kind}`]));
      expect(classes.filter((name) => name.includes('highlight'))).toEqual([]);
    }
  });

  it('names a reply, an action and a giant emote', () => {
    const reply = {
      parent_message_id: 'p',
      parent_message_body: 'earlier',
      parent_user_id: '5',
      parent_user_name: 'Bob',
      parent_user_login: 'bob',
      thread_message_id: 'p',
      thread_user_id: '5',
      thread_user_name: 'Bob',
      thread_user_login: 'bob',
    };
    // A reply gets its class even when the reply line is switched off
    expect(messageClasses(render(makeMessage({ reply }), { showReplies: false }))).toContain('chat-message--reply');
    expect(messageClasses(render(makeMessage({ message: { text: '\u0001ACTION waves', fragments: [{ type: 'text', text: 'waves' }] } })))).toContain(
      'chat-message--action',
    );
    expect(messageClasses(render(makeMessage({ message_type: 'power_ups_gigantified_emote' })))).toContain('chat-message--gigantified');
  });
});

describe('the parts of a message', () => {
  it('keeps the classes that the guide names', () => {
    const html = render(
      makeMessage({
        badges: [badge('moderator')],
        reply: {
          parent_message_id: 'p',
          parent_message_body: 'earlier',
          parent_user_id: '5',
          parent_user_name: 'Bob',
          parent_user_login: 'bob',
          thread_message_id: 'p',
          thread_user_id: '5',
          thread_user_name: 'Bob',
          thread_user_login: 'bob',
        },
      }),
      { showAvatars: true, userInformationStore: { '42': { profile_image_url: 'https://example.com/a.png' } }, showNameAlias: true },
    );
    for (const name of ['chat-message-body', 'chat-message-avatar-image', 'chat-message-nick', 'chat-message-text', 'chat-message-reply']) {
      expect(html).toContain(name);
    }
  });
});

describe('CUSTOMIZING.md', () => {
  // Every `.chat...` selector in the guide must exist: in the markup above, or as a name in the overlay source.
  it('names only classes that the overlay has', () => {
    const guide = readFileSync(new URL('../../../CUSTOMIZING.md', import.meta.url), 'utf8');
    const documented = [...new Set([...guide.matchAll(/\.(chat(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?)/g)].map((match) => match[1]))];
    expect(documented.length).toBeGreaterThan(20);

    const directory = new URL('./', import.meta.url);
    const source = readdirSync(directory)
      .filter((file) => /\.(tsx|ts|less)$/.test(file) && !file.includes('.test.'))
      .map((file) => readFileSync(new URL(file, directory), 'utf8'))
      .join('\n');

    // The role, highlight and banner classes are built in code, so look at real markup for them
    const rendered = [
      render(makeMessage({ badges: [badge('moderator'), badge('subscriber'), badge('vip'), badge('broadcaster')] })),
      render(makeMessage({ message_type: 'channel_points_highlighted' })),
      render(makeMessage({ message_type: 'user_intro' })),
      render(makeMessage({ message_type: 'power_ups_gigantified_emote' })),
      render(makeMessage({ message: { text: '\u0001ACTION waves', fragments: [{ type: 'text', text: 'waves' }] } })),
      render(makeMessage(), {
        highlightRules: compileHighlightRules({ rules: [{ matchType: 'contains', pattern: 'hello', caseSensitive: false, color: '#ff0000' }] }),
      }),
      render(
        makeMessage({
          message: {
            text: '@streamer',
            fragments: [{ type: 'mention', text: '@streamer', mention: { user_id: '1', user_name: 'S', user_login: 'streamer' } }],
          },
        }),
      ),
      ...(['subs', 'gifts', 'raids', 'announcements'] as const).map((kind) =>
        render(makeMessage({ notice: { kind, label: 'X', color: '#ff8800' } })),
      ),
      render(
        makeMessage({
          reply: {
            parent_message_id: 'p',
            parent_message_body: 'b',
            parent_user_id: '5',
            parent_user_name: 'B',
            parent_user_login: 'b',
            thread_message_id: 'p',
            thread_user_id: '5',
            thread_user_name: 'B',
            thread_user_login: 'b',
          },
        }),
      ),
    ].join('\n');

    const missing = documented.filter((name) => !source.includes(name) && !new RegExp(`(^|[\\s"])${name}([\\s"]|$)`).test(rendered));
    expect(missing).toEqual([]);
  });
});
