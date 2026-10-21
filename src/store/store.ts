import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_CHAT_SETTINGS_VALUES } from '../constants';
import { UserInformation } from '../handlers/twitch/helix/schemas';
import { ChannelChatMessageDeleteEvent, ChannelChatMessageEvent } from '../types/twitchEvents';
import { ChatBadge, ChatCheer, ChatEmote } from '../types/types';

const CLIENT_ID = 'nl4u7l1h4dt48e8hj58yha0we527kg';

// unknown: not checked yet. valid: Twitch accepted the token. expired: Twitch rejected the token (401).
export type TokenStatus = 'unknown' | 'valid' | 'expired';

interface StoreState {
  broadcasterId: string | null;
  tokenStatus: TokenStatus;
  setTokenStatus: (status: TokenStatus) => void;

  setBroadcasterId: (id: string | null) => void;
  clientId: string;
  chatBadges: Record<string, ChatBadge>;

  setChatBadges: (badges: Record<string, ChatBadge>) => void;
  chatCheers: Record<string, ChatCheer>;

  setChatCheers: (cheers: Record<string, ChatCheer>) => void;
  chatEmotes: Record<string, ChatEmote>;

  setChatEmotes: (emotes: Record<string, ChatEmote>) => void;

  removeChatEmote: (emoteId: string) => void;
  chatMessageEvents: ChannelChatMessageEvent[];
  // Oldest messages are dropped when the list grows past this, so a long stream does not use more and more memory.
  maxChatMessages: number;
  setMaxChatMessages: (max: number) => void;
  addChatMessage: (event: ChannelChatMessageEvent) => void;
  deleteChatMessage: (event: ChannelChatMessageDeleteEvent) => void;
  removeChatMessage: (event: ChannelChatMessageEvent) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
  userLogin: string | null;
  setUserLogin: (login: string | null) => void;
  userInformation: Record<string, UserInformation>;
  addUserInformation: (userInfo: UserInformation) => void;
  reset: () => void;
}

export const store = create<StoreState>((set) => ({
  broadcasterId: null,
  tokenStatus: 'unknown',
  setTokenStatus: (status: TokenStatus) => set({ tokenStatus: status }),
  setBroadcasterId: (id: string | null) => set({ broadcasterId: id }),
  clientId: CLIENT_ID,
  chatBadges: {},
  setChatBadges: (badges: Record<string, ChatBadge>) => set((state) => ({ chatBadges: { ...state.chatBadges, ...badges } })),
  chatCheers: {},
  setChatCheers: (cheers: Record<string, ChatCheer>) => set((state) => ({ chatCheers: { ...state.chatCheers, ...cheers } })),
  chatEmotes: {},
  setChatEmotes: (emotes: Record<string, ChatEmote>) => set((state) => ({ chatEmotes: { ...state.chatEmotes, ...emotes } })),
  removeChatEmote: (emoteId: string) => {
    set((state) => ({
      chatEmotes: Object.fromEntries(Object.entries(state.chatEmotes).filter(([, emote]) => emote.id !== emoteId)),
    }));
  },
  chatMessageEvents: [],
  maxChatMessages: DEFAULT_CHAT_SETTINGS_VALUES.maxMessages,
  setMaxChatMessages: (max: number) => set({ maxChatMessages: max }),
  addChatMessage: (chatMessage: ChannelChatMessageEvent) => {
    set((state) => ({
      ...state,
      chatMessageEvents: [...state.chatMessageEvents, chatMessage].slice(-state.maxChatMessages),
    }));
  },
  deleteChatMessage: (chatMessage: ChannelChatMessageDeleteEvent) => {
    set((state) => ({
      ...state,
      chatMessageEvents: state.chatMessageEvents.filter((message) => message.message_id !== chatMessage.message_id),
    }));
  },
  removeChatMessage: (chatMessage: ChannelChatMessageEvent) => {
    set((state) => ({
      ...state,
      chatMessageEvents: state.chatMessageEvents.filter((message) => message.message_id !== chatMessage.message_id),
    }));
  },
  userId: null,
  userLogin: null,
  setUserId: (id: string | null) => set({ userId: id }),
  setUserLogin: (login: string | null) => set({ userLogin: login }),
  userInformation: {},
  addUserInformation: (userInfo: UserInformation) => {
    set((state) => ({
      userInformation: {
        ...state.userInformation,
        [userInfo.id]: userInfo,
      },
    }));
  },
  reset: () =>
    set({
      broadcasterId: null,
      tokenStatus: 'unknown',
      clientId: CLIENT_ID,
      chatBadges: {},
      chatCheers: {},
      chatEmotes: {},
      chatMessageEvents: [],
      userId: null,
      userLogin: null,
      userInformation: {},
    }),
}));

interface PersistedStoreState {
  accessToken: string;
  getAccessToken: () => string;
  setAccessToken: (token: string) => void;
  authStateValue: string;

  setAuthStateValue: (newAuthStateValue: string) => void;
  betterTTVEnabled: boolean;
  setBetterTTVEnabled: (enabled: boolean) => void;
  channel: string;
  setChannel: (channel: string) => void;
  frankerFaceZEnabled: boolean;
  setFrankerFaceZEnabled: (enabled: boolean) => void;
  sevenTVEnabled: boolean;
  setSevenTVEnabled: (enabled: boolean) => void;
}

export const persistedStore = create<PersistedStoreState>()(
  persist(
    (set) => ({
      accessToken: '',
      getAccessToken: (): string => {
        const at = persistedStore.getState().accessToken;
        if (!at) {
          throw new Error('Access token is not set.');
        }
        return at;
      },
      setAccessToken: (token: string) => set({ accessToken: token }),
      authStateValue: '',
      setAuthStateValue: (newAuthStateValue: string) => set({ authStateValue: newAuthStateValue }),
      betterTTVEnabled: true,
      setBetterTTVEnabled: (enabled: boolean) => set({ betterTTVEnabled: enabled }),
      channel: '',
      setChannel: (channel: string) => set({ channel }),
      frankerFaceZEnabled: true,
      setFrankerFaceZEnabled: (enabled: boolean) => set({ frankerFaceZEnabled: enabled }),
      sevenTVEnabled: true,
      setSevenTVEnabled: (enabled: boolean) => set({ sevenTVEnabled: enabled }),
    }),
    {
      name: 'athano-chat-overlay',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
