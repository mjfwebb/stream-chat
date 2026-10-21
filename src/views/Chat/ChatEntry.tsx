import classNames from 'classnames';
import type { UsernameColorMode } from '../../constants';
import { ChannelChatMessageEvent } from '../../types/twitchEvents';
import { getHighlight, type HighlightSettings } from '../../utils/highlights';
import { ChatImageRenderer } from './ChatImageRenderer';
import { contrastCorrected } from './contrastCorrected';
import { withOpacity } from './overlayStyle';
import { UserBadges } from './UserBadges';

interface ChatEntryProps extends HighlightSettings {
  chatMessage: ChannelChatMessageEvent;
  backgroundColor: string;
  showAvatars: boolean;
  showBorders: boolean;
  dropShadowEnabled: boolean;
  dropShadowSettings: string;
  textStrokeEnabled: boolean;
  textStrokeSettings: string;
  showColonAfterDisplayName: boolean;
  showNameAlias: boolean;
  showGifs: boolean;
  usernameColor: UsernameColorMode;
  showReplies: boolean;
  chatMessagePadding: string;
  userInformationStore: {
    [userId: string]: {
      profile_image_url?: string;
    };
  };
}

// 'corrected' adjusts the Twitch color for contrast, 'twitch' keeps it, and 'text' uses the overlay text color.
const usernameColorFor = (mode: UsernameColorMode, twitchColor: string, backgroundColor: string): string => {
  switch (mode) {
    case 'twitch':
      return twitchColor;
    case 'text':
      return 'inherit';
    default:
      return contrastCorrected(twitchColor, backgroundColor);
  }
};

const Username = ({ user, showNameAlias }: { user: { displayName: string; alias?: string }; showNameAlias: boolean }) => {
  return (
    <>
      {user.displayName}
      {showNameAlias && user.alias ? <span className="chat-message-nick-alias">({user.alias})</span> : null}
    </>
  );
};

export const ChatEntry = ({
  chatMessage,
  backgroundColor,
  showAvatars,
  showBorders,
  dropShadowEnabled,
  dropShadowSettings,
  textStrokeEnabled,
  textStrokeSettings,
  showColonAfterDisplayName,
  showNameAlias,
  showGifs,
  usernameColor,
  showReplies,
  chatMessagePadding,
  userInformationStore,
  highlightPoints,
  highlightMentions,
  highlightFirstMessages,
  highlightColor,
  highlightRules,
}: ChatEntryProps) => {
  const gigantified = chatMessage.message_type === 'power_ups_gigantified_emote';
  const highlight = getHighlight(chatMessage, { highlightPoints, highlightMentions, highlightFirstMessages, highlightColor, highlightRules });
  const actionMessage = chatMessage.message.text.startsWith('\u0001ACTION');

  // Gifs currently can't be combined with other fragments, so a disabled gif means an empty message
  if (!showGifs && chatMessage.message.fragments.every((fragment) => fragment.type === 'gif')) {
    return null;
  }

  // Set default user if no user
  const user: { displayName: string; alias?: string; avatarUrl: string } = {
    displayName: chatMessage.chatter_user_name,
    alias: chatMessage.chatter_user_name.toLowerCase() !== chatMessage.chatter_user_login.toLowerCase() ? chatMessage.chatter_user_login : undefined,
    avatarUrl: userInformationStore[chatMessage.chatter_user_id]?.profile_image_url ?? '',
  };

  return (
    <button className={classNames('chat-message')}>
      <div
        className={classNames(
          'chat-message-body',
          showBorders && chatMessage.badges.find((badge) => badge.set_id === 'subscriber') && 'chat-message-body-subscriber',
          gigantified && 'chat-message-body-gigantified',
          highlight?.type === 'spotlight' && 'chat-message-body-spotlighted',
        )}
        style={{
          ...(highlight?.type === 'color'
            ? {
                borderLeftColor: highlight.color,
                borderRightColor: highlight.color,
                backgroundColor: withOpacity(highlight.color, 25),
              }
            : {}),
          ...(dropShadowEnabled
            ? {
                textShadow: dropShadowSettings,
              }
            : {}),
          ...(textStrokeEnabled
            ? {
                ['-webkit-text-stroke']: textStrokeSettings,
              }
            : {}),
          padding: chatMessagePadding,
        }}
      >
        <span>
          {showReplies && chatMessage.reply && (
            <span className="chat-message-reply" title={chatMessage.reply.parent_message_body}>
              Replying to @{chatMessage.reply.parent_user_name}: {chatMessage.reply.parent_message_body}
            </span>
          )}
          {showAvatars && user.avatarUrl && <img className="chat-message-avatar-image" src={user.avatarUrl} alt="avatar" height={34} />}
          <UserBadges badges={chatMessage.badges} />
          <span
            className="chat-message-nick"
            style={{
              color: usernameColorFor(usernameColor, chatMessage.color || '#fff', backgroundColor),
            }}
          >
            <Username user={user} showNameAlias={showNameAlias} />
          </span>
          {showColonAfterDisplayName && !actionMessage && ': '}
          <span className={classNames('chat-message-text', actionMessage && 'chat-message-text-action')}>
            <ChatImageRenderer fragments={chatMessage.message.fragments} showGifs={showGifs} />
          </span>
        </span>
      </div>
    </button>
  );
};
