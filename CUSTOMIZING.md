# Customizing the overlay with CSS

The editor on the home page covers most changes: colors, fonts, sizes, highlights and more. For anything else, you can add your own CSS. This guide shows how.

CSS (Cascading Style Sheets) is the language that styles web pages. You add it in OBS, in the browser source that shows the overlay.

## Add CSS in OBS

1. Open the properties of your Stream Chat browser source in OBS.
2. Find the box named Custom CSS.
3. Leave the lines that OBS put there. They make the background transparent.
4. Add your rules below those lines.
5. Press OK. The overlay updates at once.

Your CSS runs only in OBS. The live preview in the editor does not use it. To test your CSS, open the overlay URL in a browser and use the developer tools, or edit the Custom CSS box and watch OBS.

## How the overlay is built

The overlay is a list of messages. Each message is one `chat-message` element. Inside it, `chat-message-body` is the colored box. Inside the box, you find the avatar, the badges, the name, and the text.

```
.chat
  .chat-message                      one message or banner
    .chat-message-body               the box with the background and the border
      .chat-message-reply            the line above a reply
      .chat-message-avatar-image     the avatar
      .chat-message-badge            one badge, repeated
      .chat-message-nick             the name
      .chat-message-text             the text, with the emotes inside
```

## Selectors you can use

The names in this section are stable. Other class names in the overlay can change in any update, so do not use them.

### Parts of a message

| Selector                     | What it is                                                         |
| ---------------------------- | ------------------------------------------------------------------ |
| `.chat`                      | The whole overlay                                                  |
| `.chat-message`              | One message or banner                                              |
| `.chat-message-body`         | The box in a message. The background and the side borders are here |
| `.chat-message-avatar-image` | The avatar of the chatter                                          |
| `.chat-message-badge`        | One badge                                                          |
| `.chat-message-nick`         | The display name                                                   |
| `.chat-message-nick-alias`   | The login that follows a localized name                            |
| `.chat-message-text`         | The text of the message                                            |
| `.chat-message-reply`        | The line above a reply                                             |
| `.chat-message-notice-label` | The word at the start of a banner, such as SUB                     |
| `.chat-emote`                | One emote                                                          |
| `.chat-emote--emoji`         | One emoji                                                          |
| `.chat-gif`                  | One gif                                                            |
| `.chat-cheer`                | The image of a Bits cheer                                          |
| `.chat-cheer-amount`         | The number of Bits                                                 |
| `.chat-token-expired`        | The notice that the Twitch connection expired                      |

### Which kind of message

Every `chat-message` also gets classes that tell you what it is. Combine them with the parts above, for example `.chat-message--moderator .chat-message-nick`.

| Selector                                                                       | When the message gets it                         |
| ------------------------------------------------------------------------------ | ------------------------------------------------ |
| `.chat-message--broadcaster`, `.chat-message--moderator`, `.chat-message--vip` | The chatter has that role                        |
| `.chat-message--subscriber`                                                    | The chatter is a subscriber or a founder         |
| `.chat-message--highlight`                                                     | The message is highlighted for any reason        |
| `.chat-message--highlight-points`                                              | A channel point highlight                        |
| `.chat-message--highlight-mention`                                             | The message mentions your channel                |
| `.chat-message--highlight-first`                                               | The first message of a chatter                   |
| `.chat-message--highlight-rule`                                                | The message matches one of your highlight rules  |
| `.chat-message--notice`                                                        | A banner for a channel event                     |
| `.chat-message--notice-subs`, `.chat-message--notice-gifts`                    | The banner is for a sub, or for gifted subs      |
| `.chat-message--notice-raids`, `.chat-message--notice-announcements`           | The banner is for a raid, or for an announcement |
| `.chat-message--reply`                                                         | The message is a reply                           |
| `.chat-message--action`                                                        | The chatter used the me command                  |
| `.chat-message--gigantified`                                                   | The message uses a giant emote                   |

### Which chatter

Every message that has a chatter carries two data attributes. The login is in lowercase.

| Selector                      | What it matches                                       |
| ----------------------------- | ----------------------------------------------------- |
| `.chat-message[data-user]`    | The login of the chatter, such as `data-user="alice"` |
| `.chat-message[data-user-id]` | The numeric Twitch ID of the chatter                  |

### CSS variables

The editor sets these variables. You can read them, or set them again in your CSS.

| Variable                 | What it holds                                  |
| ------------------------ | ---------------------------------------------- |
| `--avatar-size`          | The size of the avatar                         |
| `--badge-size`           | The height of a badge                          |
| `--emote-size`           | The largest height of an emote                 |
| `--line-height`          | The height of one line of text                 |
| `--message-background`   | The background of each message                 |
| `--message-radius`       | The corner radius of each message              |
| `--highlight-background` | The color layer behind a highlight or a banner |

## Recipes

Copy a recipe into the Custom CSS box. Change the values to match your taste.

Hide the badges:

```css
.chat-message-badge {
  display: none;
}
```

Make the avatars round:

```css
.chat-message-avatar-image {
  border-radius: 50%;
}
```

Hide the messages of one chatter, such as a bot. Use the lowercase login:

```css
.chat-message[data-user='nightbot'] {
  display: none;
}
```

Color the names of moderators green. The overlay sets the name color on each name, so you must add `!important`:

```css
.chat-message--moderator .chat-message-nick {
  color: #2ec27e !important;
}
```

Add a star before the name of a subscriber:

```css
.chat-message--subscriber .chat-message-nick::before {
  content: '★ ';
}
```

Add a glow to messages that mention your channel:

```css
.chat-message--highlight-mention .chat-message-body {
  box-shadow: 0 0 12px rgba(169, 112, 255, 0.8);
}
```

Make a raid banner pulse:

```css
.chat-message--notice-raids .chat-message-body {
  animation: raid-pulse 1.6s ease-in-out infinite;
}

@keyframes raid-pulse {
  50% {
    transform: scale(1.03);
  }
}
```

Use a font from Google Fonts. Load the font in the Custom CSS box, then type its name in the Font family field of the editor:

```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
```

## Good to know

The editor writes some styles directly on the elements, such as the name color and the border colors of a highlight. Your CSS loses against these styles unless you add `!important`.

The color of a highlight or a banner sits on a layer behind the text. To change it, style `.chat-message-body-highlighted::before` and its `background`.

When a setting exists in the editor, use the setting. It also shows in the live preview, and it works without CSS.
