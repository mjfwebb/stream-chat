# URL Parameters Reference

This document describes the URL parameters you can use to customize the chat overlay in this project. These parameters can be passed as query parameters in the URL, for example `/chat?background-color=%23ffffff&font-size=20px`.

## Important Notes

- **`access_token` is always required.** Without it, chat will not function.
- **`channel` is optional.** By default the overlay shows the authenticated user's own channel.
- **Channel names are case sensitive.**
- **Default values** for all other parameters are shown below and are defined in the code. See also `src/constants.ts`.

## Parameters

| Parameter                       | Description                                                    | Example Value       | Default Value           |
| ------------------------------- | -------------------------------------------------------------- | ------------------- | ----------------------- |
| `access_token`                  | Twitch OAuth access token for authentication                   | `abcdef123456`      |                         |
| `channel`                       | Twitch channel name to connect to (**case sensitive**)         | `Athano`            | User's own channel      |
| `animated-entry`                | Enable/disable animated entry of chat messages                 | `true`              | `true`                  |
| `animated-exit`                 | Enable/disable animated exit of chat messages                  | `true`              | `false`                 |
| `background-color`              | Background color of the chat overlay                           | `#000000`           | `transparent`           |
| `chat-message-padding`          | Padding for chat messages (with unit)                          | `8px`               | `5px`                   |
| `drop-shadow`                   | Enable/disable drop shadow on chat messages                    | `true`              | `false`                 |
| `drop-shadow-settings`          | CSS drop-shadow settings                                       | `0 2px 8px #0046a3` | `1px 1px 2px #000000ff` |
| `height`                        | Height of the chat overlay (with unit)                         | `400px`             | `100vh`                 |
| `font-size`                     | Font size for chat messages (with unit)                        | `18px`              | `1em`                   |
| `font-family`                   | Font family for chat messages                                  | `Arial, sans-serif` | `Sans-Serif`            |
| `foreground-color`              | Text color for chat messages                                   | `#ffffff`           | `#ffffff`               |
| `seconds-before-exit`           | Seconds before a message disappears (if animated exit enabled) | `5`                 | `10`                    |
| `show-avatars`                  | Show/hide user avatars                                         | `false`             | `true`                  |
| `show-borders`                  | Show/hide borders around chat messages                         | `false`             | `true`                  |
| `show-colon-after-display-name` | Show colon after display name                                  | `false`             | `false`                 |
| `show-name-alias`               | Show/hide name alias for users                                 | `false`             | `true`                  |
| `max-messages`                  | Number of recent messages to keep (older ones are dropped)     | `50`                | `100`                   |
| `avatar-size`                   | Avatar size in px                                              | `48`                | `36`                    |
| `badge-size`                    | Badge height in px                                             | `24`                | `19`                    |
| `emote-size`                    | Maximum emote height in px                                     | `48`                | `36`                    |
| `line-height`                   | Height of one line of a message in px                          | `40`                | `32`                    |
| `username-color`                | Username color: `corrected`, `twitch` or `text`                | `twitch`            | `corrected`             |
| `message-background-color`      | Background color behind each message (hex or `transparent`)    | `#000000`           | `transparent`           |
| `message-background-opacity`    | Opacity of the message background, 0 to 100                    | `50`                | `80`                    |
| `message-radius`                | Corner radius of the message background in px                  | `8`                 | `3`                     |
| `chat-anchor`                   | Where new messages appear: `bottom` or `top`                   | `top`               | `bottom`                |
| `highlight-points`              | Style channel point highlighted messages like Twitch does      | `false`             | `true`                  |
| `highlight-mentions`            | Highlight messages that mention the channel                    | `true`              | `false`                 |
| `highlight-first-messages`      | Highlight a chatter's first message in the channel             | `true`              | `false`                 |
| `highlight-color`               | Color for mentions and first messages                          | `#ff8800`           | `#a970ff`               |
| `highlight-rules`               | Rules that color matching messages (set in the editor)         |                     |                         |
| `show-replies`                  | Show which message a reply answers, above the reply            | `false`             | `true`                  |
| `only-roles`                    | Show only these roles, comma separated                         | `moderator,vip`     | all roles               |
| `show-gifs`                     | Show/hide gifs in chat messages                                | `false`             | `true`                  |
| `text-stroke-enabled`           | Enable/disable text stroke                                     | `false`             | `false`                 |
| `text-stroke`                   | CSS text stroke settings                                       | `1px #aeff00`       | `1px black`             |
| `width`                         | Width of the chat overlay (with unit)                          | `600px`             | `500px`                 |
| `7tv-emotes`                    | Enable/disable 7tv emotes                                      | `true`              | `true`                  |
| `bttv-emotes`                   | Enable/disable BTTV emotes                                     | `true`              | `true`                  |
| `ffz-emotes`                    | Enable/disable FFZ emotes                                      | `true`              | `true`                  |

## Usage Example

```
https://chat.nice.gg/chat?background-color=%23000000&font-size=20px&show-avatars=false
```

This will set the background color to black, font size to 20px, and hide user avatars.
