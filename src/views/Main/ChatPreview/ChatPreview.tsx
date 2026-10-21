import { useState } from 'react';
import { DEFAULT_CHAT_SETTINGS_VALUES } from '../../../constants';
import { ChannelChatMessageEvent } from '../../../types/twitchEvents';
import { buildFilterRegex, decodeFiltersFromUrl } from '../../../utils/filters';
import { isMessageVisible, parseRoles, type VisibilitySettings } from '../../../utils/messageVisibility';
import { compileHighlightRules, type HighlightRule } from '../../../utils/highlights';
import { Button } from '../../../components/Button/Button';
import { noticeToChatMessage, parseNoticeKinds } from '../../../utils/notices';
import { ChatEntry } from '../../Chat/ChatEntry';
import { overlayCssVariables } from '../../Chat/overlayStyle';

import { SAMPLE_NOTICES } from './sampleNotices';

import './ChatPreview.less';

const fakeTwitchMessages: ChannelChatMessageEvent['message'][] = [
  {
    text: 'Kappa5000 keep being awesome!',
    fragments: [
      {
        type: 'cheermote',
        text: 'Kappa5000',
        cheermote: {
          prefix: 'kappa',
          bits: 5000,
          tier: 1,
        },
      },
      {
        type: 'text',
        text: ' keep being awesome!',
      },
    ],
  },
  {
    text: 'This is so cool peepoWow',
    fragments: [
      {
        type: 'text',
        text: 'This is so cool peepoWow',
      },
    ],
  },
  {
    text: 'Did you see that? Unbeleafable! haHAA LUL',
    fragments: [
      {
        type: 'text',
        text: 'Did you see that? Unbeleafable! haHAA ',
      },
      {
        type: 'emote',
        text: 'LUL',
        emote: {
          id: '425618',
          emote_set_id: '0',
          owner_id: '0',
          format: ['static'],
        },
      },
    ],
  },
  {
    text: '@Athano Loving the stream, keep it up! Cheer169',
    fragments: [
      {
        type: 'mention',
        text: '@Athano ',
        mention: { user_id: '0', user_name: 'Athano', user_login: 'athano' },
      },
      {
        type: 'text',
        text: 'Loving the stream, keep it up!',
      },
      {
        type: 'cheermote',
        text: 'Cheer169',
        cheermote: {
          prefix: 'cheer',
          bits: 169,
          tier: 1,
        },
      },
    ],
  },
  {
    text: '!hype Can we get some hype in the chat? catJAM',
    fragments: [
      {
        type: 'text',
        text: '!hype Can we get some hype in the chat? catJAM',
      },
    ],
  },
  {
    text: 'Remember to follow! Use !socials for every link.',
    fragments: [
      {
        type: 'text',
        text: 'Remember to follow! Use !socials for every link.',
      },
    ],
  },
  {
    text: 'Hi chat, first time here!',
    fragments: [
      {
        type: 'text',
        text: 'Hi chat, first time here!',
      },
    ],
  },
];

const fakeUsers: {
  name: string;
  login: string;
  color: string;
  avatarUrl: string;
  badges: ChannelChatMessageEvent['badges'];
  // Lets a sample message show a Twitch message type, such as a channel point highlight
  messageType?: ChannelChatMessageEvent['message_type'];
  // Lets a sample message show as a reply
  reply?: ChannelChatMessageEvent['reply'];
}[] = [
  { name: 'Alice', login: 'alice', color: '#ff5733', avatarUrl: 'https://i.pravatar.cc/256?img=10', badges: [] },
  {
    name: 'Bob',
    login: 'bob',
    color: '#33ff57',
    avatarUrl: 'https://i.pravatar.cc/256?img=15',
    badges: [],
    messageType: 'channel_points_highlighted',
  },
  {
    name: 'Charlie',
    login: 'charlie',
    color: '#3357ff',
    avatarUrl: 'https://i.pravatar.cc/256?img=11',
    badges: [
      {
        set_id: 'subscriber',
        id: '1',
        info: '12',
      },
    ],
    reply: {
      parent_message_id: '0',
      parent_message_body: 'Kappa5000 keep being awesome!',
      parent_user_id: '0',
      parent_user_name: 'Alice',
      parent_user_login: 'alice',
      thread_message_id: '0',
      thread_user_id: '0',
      thread_user_name: 'Alice',
      thread_user_login: 'alice',
    },
  },
  {
    name: 'Diana',
    login: 'diana',
    color: '#f333ff',
    avatarUrl: 'https://i.pravatar.cc/256?img=28',
    badges: [
      {
        set_id: 'subscriber',
        id: '1',
        info: '',
      },
    ],
  },
  { name: '안녕하세요', login: 'Eve', color: '#33fff5', avatarUrl: 'https://i.pravatar.cc/256?img=21', badges: [] },
  {
    name: 'Nightbot',
    login: 'nightbot',
    color: '#9aa0bd',
    avatarUrl: 'https://i.pravatar.cc/256?img=33',
    badges: [{ set_id: 'moderator', id: '1', info: '' }],
  },
  {
    name: 'Frank',
    login: 'frank',
    color: '#ffb833',
    avatarUrl: 'https://i.pravatar.cc/256?img=52',
    badges: [],
    messageType: 'user_intro',
  },
];

const BACKDROPS: [string, string][] = [
  ['#1c2447', '#3a2a6b'],
  ['#10261f', '#2b5a3f'],
  ['#3a1f1f', '#8a4a2a'],
  ['#e9ecf5', '#c8cde0'],
];

export const ChatPreview = ({
  overlayParameters,
  replayKey = 0,
  onReplay,
}: {
  overlayParameters: typeof DEFAULT_CHAT_SETTINGS_VALUES;
  replayKey?: number;
  onReplay?: () => void;
}) => {
  const overlayParametersToChatEntryProps = {
    foregroundColor: overlayParameters.foregroundColor,
    backgroundColor: overlayParameters.backgroundColor,
    fontFamily: overlayParameters.fontFamily,
    fontSize: `${overlayParameters.fontSizeValue}${overlayParameters.fontSizeUnit}`,
    width: `${overlayParameters.widthValue}${overlayParameters.widthUnit}`,
    height: `${overlayParameters.heightValue}${overlayParameters.heightUnit}`,
    animatedEntry: overlayParameters.animatedEntry,
    animatedExit: overlayParameters.animatedExit,
    secondsBeforeExit: overlayParameters.secondsBeforeExit,
    showAvatars: overlayParameters.showAvatars,
    showBorders: overlayParameters.showBorders,
    showColonAfterDisplayName: overlayParameters.showColonAfterDisplayName,
    showNameAlias: overlayParameters.showNameAlias,
    showGifs: overlayParameters.showGifs,
    usernameColor: overlayParameters.usernameColor,
    showReplies: overlayParameters.showReplies,
    noticeColors: {
      subs: overlayParameters.noticeColorSubs,
      gifts: overlayParameters.noticeColorGifts,
      raids: overlayParameters.noticeColorRaids,
    },
    showNoticeLabels: overlayParameters.showNoticeLabels,
    highlightPoints: overlayParameters.highlightPoints,
    highlightMentions: overlayParameters.highlightMentions,
    highlightFirstMessages: overlayParameters.highlightFirstMessages,
    highlightMentionsColor: overlayParameters.highlightMentionsColor,
    highlightFirstColor: overlayParameters.highlightFirstColor,
    highlightPointsColor: overlayParameters.highlightPointsColor,
    highlightStrength: overlayParameters.highlightStrength,
    highlightRules: compileHighlightRules(decodeFiltersFromUrl<HighlightRule>(overlayParameters.highlightRules)),
    dropShadowEnabled: overlayParameters.dropShadowEnabled,
    dropShadowSettings: overlayParameters.dropShadowSettings,
    textStrokeEnabled: overlayParameters.textStrokeEnabled,
    textStrokeSettings: overlayParameters.textStrokeSettings,
    chatMessagePadding: `${overlayParameters.chatMessagePaddingValue}${overlayParameters.chatMessagePaddingUnit}`,
  };
  const [backdrop, setBackdrop] = useState(0);

  const fakeChatMessageEvents = fakeUsers.map((user, idx: number) => {
    return {
      broadcaster_user_id: '0',
      broadcaster_user_login: 'athano',
      broadcaster_user_name: 'Athano',
      chatter_user_id: '0',
      chatter_user_login: user.login,
      chatter_user_name: user.name,
      message_id: String(idx),
      message: fakeTwitchMessages[idx],
      message_type: user.messageType ?? 'text',
      ...(user.reply ? { reply: user.reply } : {}),
      badges: user.badges,
      color: user.color,
      eventType: 'channel.chat.message',
    } satisfies ChannelChatMessageEvent;
  });

  // The same rules as the overlay: username and message filters, and the roles to show
  const visibility: VisibilitySettings = {
    usernameFilterRegex: buildFilterRegex(decodeFiltersFromUrl(overlayParameters.usernameFilters)),
    messageFilterRegex: buildFilterRegex(decodeFiltersFromUrl(overlayParameters.messageFilters)),
    onlyRoles: parseRoles(overlayParameters.onlyRoles),
  };
  // Banners for channel events, such as subs and raids, only show for the kinds that are switched on
  const sampleNotices = SAMPLE_NOTICES.flatMap((notice) => noticeToChatMessage(notice, parseNoticeKinds(overlayParameters.showNotices)) ?? []);
  const sampleMessages: ChannelChatMessageEvent[] = [...fakeChatMessageEvents, ...sampleNotices];

  const filteredMessages = sampleMessages.filter((m) => isMessageVisible(m, visibility));
  const hiddenCount = sampleMessages.length - filteredMessages.length;

  return (
    <div className="chat-preview-container">
      <div className="chat-preview-head">
        <h2>Live preview</h2>
        <div className="chat-preview-swatches" role="group" aria-label="Preview backdrop">
          {BACKDROPS.map(([from, to], idx) => (
            <button
              key={from}
              type="button"
              className="chat-preview-swatch"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              aria-label={`Backdrop ${idx + 1}`}
              aria-pressed={backdrop === idx}
              onClick={() => setBackdrop(idx)}
            />
          ))}
        </div>
        {onReplay && (
          <Button type="secondary" onClick={onReplay}>
            Replay
          </Button>
        )}
      </div>
      <div className="chat-preview" style={{ ['--stage-a' as string]: BACKDROPS[backdrop][0], ['--stage-b' as string]: BACKDROPS[backdrop][1] }}>
        <span className="chat-preview-size">
          {overlayParametersToChatEntryProps.width} × {overlayParametersToChatEntryProps.height}
        </span>
        <div
          className={`chat-preview-overlay ${overlayParameters.chatAnchor === 'top' ? 'chat-preview-overlay--top' : ''}`}
          key={replayKey}
          style={{
            background: overlayParametersToChatEntryProps.backgroundColor,
            width: overlayParametersToChatEntryProps.width,
            color: overlayParametersToChatEntryProps.foregroundColor,
            fontSize: overlayParametersToChatEntryProps.fontSize,
            fontFamily: overlayParametersToChatEntryProps.fontFamily,
            ...overlayCssVariables(overlayParameters),
          }}
        >
          {filteredMessages.map((fakeChatMessageEvent) => (
            <ChatEntry
              key={fakeChatMessageEvent.message_id}
              {...overlayParametersToChatEntryProps}
              chatMessage={fakeChatMessageEvent}
              userInformationStore={{
                [fakeChatMessageEvent.chatter_user_id]: {
                  profile_image_url: fakeUsers.find((u) => u.name === fakeChatMessageEvent.chatter_user_name)?.avatarUrl,
                },
              }}
            />
          ))}
        </div>
      </div>
      <div className="chat-preview-foot">
        <span className={`pill ${hiddenCount ? 'pill-warn' : ''}`}>
          {hiddenCount} of {sampleMessages.length} sample messages hidden by filters
        </span>
        <span>Sample chat. Real messages arrive from your channel.</span>
      </div>
    </div>
  );
};
