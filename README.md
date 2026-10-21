# Athano's Stream Chat Overlay

A modern stream chat overlay built with React, TypeScript, and Vite utilising the Twitch EventSub API.

Use it right now at [chat.nice.gg](https://chat.nice.gg/).

## Features

- Connects to Twitch chat using OAuth authentication
- Displays chat messages in real time
- Supports Twitch, BTTV, FrankerFaceZ, and 7TV emotes
- Shows user badges and cheers

## URL Parameters & Customization

For a full list of URL parameters and customization options, see [URL_PARAMETERS.md](./URL_PARAMETERS.md).

To restyle the overlay with your own CSS in OBS, see [CUSTOMISING.md](./CUSTOMISING.md). It lists the class names, the data attributes and the CSS variables that stay stable, and it has recipes.

## Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Run the development server**
   ```bash
   pnpm dev
   ```
3. **Open in browser**
   Visit [http://localhost:5173](http://localhost:5173)

## Authentication

You will be prompted to log in with your Twitch account to use chat overlay. The app uses Twitch OAuth for authentication.

## Emote Support

- **Twitch**: Native emotes and badges
- **BTTV**: Global and user emotes
- **FrankerFaceZ**: Global and room emotes
- **7TV**: Emote sets and user emotes

## License

MIT
