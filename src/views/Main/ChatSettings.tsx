import { useState } from 'react';

import { Button } from '../../components/Button/Button';
import { ColorPicker } from '../../components/ColorPicker/ColorPicker';
import { ColorValueCompact, ColorValuePicker } from '../../components/ColorValuePicker/ColorValuePicker';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import FilterEditor from '../../components/FilterEditor/FilterEditor';
import { FontFamilyField } from '../../components/FontFamilyField/FontFamilyField';
import { FormField } from '../../components/FormField/FormField';
import { SourceUrl } from '../../components/SourceUrl/SourceUrl';
import { SwitchRow } from '../../components/SwitchRow/SwitchRow';
import { TextShadowStacker } from '../../components/TextShadowPicker/TextShadowStacker';
import { TextStrokeEditor } from '../../components/TextStrokePicker/TextStrokeEditor';
import { useToast } from '../../components/Toast/useToast';
import { UnitField } from '../../components/UnitField/UnitField';
import {
  chatSearchParamsMap,
  COLOR_VALUE_SETTINGS,
  DEFAULT_CHAT_SETTINGS_VALUES,
  LEGACY_HIGHLIGHT_COLOR_PARAM,
  SETTING_OPTIONS,
} from '../../constants';
import { isColorValue } from '../../utils/colorValue';
import {
  COMMON_BOT_NAMES,
  decodeFiltersFromUrl,
  EMPTY_FILTER_CONFIG,
  encodeFiltersToUrl,
  withCommandFilter,
  withCommonBots,
  type UserFilterConfig,
} from '../../utils/filters';
import { parseRoles, ROLES, type Role } from '../../utils/messageVisibility';
import { NOTICE_KINDS, parseNoticeKinds } from '../../utils/notices';
import { EMPTY_HIGHLIGHT_CONFIG, type HighlightConfig, type HighlightRule } from '../../utils/highlights';
import type { NoticeKind } from '../../types/twitchEvents';
import { logger } from '../../utils/logger';
import { buildUpdatedChatUrl, countChangedParams } from './buildChatUrl';
import { ChatPreview } from './ChatPreview/ChatPreview';
import './ChatSettings.less';

type Params = typeof DEFAULT_CHAT_SETTINGS_VALUES;
type BooleanKey = { [K in keyof Params]: Params[K] extends boolean ? K : never }[keyof Params];
type NumberKey = { [K in keyof Params]: Params[K] extends number ? K : never }[keyof Params];
type UnitName = 'fontSize' | 'width' | 'height' | 'chatMessagePadding';

// Settings that the URL stores as one value with a unit, such as font-size=20px.
const multiPartSettingsMapForLoading: Record<string, [keyof Params, keyof Params]> = {
  'font-size': ['fontSizeValue', 'fontSizeUnit'],
  width: ['widthValue', 'widthUnit'],
  height: ['heightValue', 'heightUnit'],
  'chat-message-padding': ['chatMessagePaddingValue', 'chatMessagePaddingUnit'],
};

const multiPartRegex = /^(?<value>[\d.]+)(?<unit>px|em|rem|vh|vw|ch)$/;

const NICE_DROP_SHADOW_PRESET =
  'rgb(0, 0, 0) 2px 0px 0px, rgb(0, 0, 0) 1.75517px 0.958851px 0px, rgb(0, 0, 0) 1.0806px 1.68294px 0px, rgb(0, 0, 0) 0.141474px 1.99499px 0px, rgb(0, 0, 0) -0.832294px 1.81859px 0px, rgb(0, 0, 0) -1.60229px 1.19694px 0px, rgb(0, 0, 0) -1.97998px 0.28224px 0px, rgb(0, 0, 0) -1.87291px -0.701566px 0px, rgb(0, 0, 0) -1.30729px -1.5136px 0px, rgb(0, 0, 0) -0.421592px -1.95506px 0px, rgb(0, 0, 0) 0.567324px -1.91785px 0px, rgb(0, 0, 0) 1.41734px -1.41108px 0px, rgb(0, 0, 0) 1.92034px -0.558831px 0px';

type TabId = 'look' | 'layout' | 'motion' | 'effects' | 'alerts' | 'filters';

const TABS: { id: TabId; label: string }[] = [
  { id: 'look', label: 'Look' },
  { id: 'layout', label: 'Layout' },
  { id: 'motion', label: 'Motion' },
  { id: 'effects', label: 'Effects' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'filters', label: 'Filters' },
];

export const ChatSettings = ({ chatUrl, setChatUrl }: { chatUrl: string; setChatUrl: (url: string) => void }) => {
  const [overlayParameters, setOverlayParameters] = useState(DEFAULT_CHAT_SETTINGS_VALUES);
  // These four have their own editors, so they live outside overlayParameters and are merged in below.
  const [dropShadowSettings, setDropShadowSettings] = useState(DEFAULT_CHAT_SETTINGS_VALUES.dropShadowSettings);
  const [textStrokeSettings, setTextStrokeSettings] = useState(DEFAULT_CHAT_SETTINGS_VALUES.textStrokeSettings);
  const [userFilterConfig, setUserFilterConfig] = useState<UserFilterConfig>(EMPTY_FILTER_CONFIG);
  const [messageFilterConfig, setMessageFilterConfig] = useState<UserFilterConfig>(EMPTY_FILTER_CONFIG);
  const [highlightConfig, setHighlightConfig] = useState<HighlightConfig>(EMPTY_HIGHLIGHT_CONFIG);
  const [loadSettingsError, setLoadSettingsError] = useState('');
  const [loadingUrl, setLoadingUrl] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('look');
  const [replayKey, setReplayKey] = useState(0);
  const toast = useToast();

  const update = (patch: Partial<Params>) => setOverlayParameters((prev) => ({ ...prev, ...patch }));
  const reset = (...keys: (keyof Params)[]) =>
    update(Object.fromEntries(keys.map((key) => [key, DEFAULT_CHAT_SETTINGS_VALUES[key]])) as Partial<Params>);

  const currentParameters: Params = {
    ...overlayParameters,
    dropShadowSettings,
    textStrokeSettings,
    usernameFilters: encodeFiltersToUrl(userFilterConfig),
    messageFilters: encodeFiltersToUrl(messageFilterConfig),
    highlightRules: encodeFiltersToUrl(highlightConfig),
  };
  const pendingUrl = buildUpdatedChatUrl(chatUrl, currentParameters);
  const pendingChanges = countChangedParams(chatUrl, pendingUrl);
  // A count to show on a tab, so rules on a tab that is not open are not forgotten.
  const tabCounts: Partial<Record<TabId, number>> = {
    alerts: highlightConfig.rules.length + parseNoticeKinds(overlayParameters.showNotices).length,
    filters: (userFilterConfig.rules?.length ?? 0) + (messageFilterConfig.rules?.length ?? 0),
  };

  const handleUpdateUrl = () => {
    setChatUrl(pendingUrl);
    toast.showToast('Source URL updated. Refresh the browser source in OBS to see it.');
  };

  const setParametersToDefault = () => {
    setOverlayParameters(DEFAULT_CHAT_SETTINGS_VALUES);
    setDropShadowSettings(DEFAULT_CHAT_SETTINGS_VALUES.dropShadowSettings);
    setTextStrokeSettings(DEFAULT_CHAT_SETTINGS_VALUES.textStrokeSettings);
    setUserFilterConfig(EMPTY_FILTER_CONFIG);
    setMessageFilterConfig(EMPTY_FILTER_CONFIG);
    setHighlightConfig(EMPTY_HIGHLIGHT_CONFIG);
  };

  const confirmReset = () => {
    setParametersToDefault();
    setConfirmResetOpen(false);
  };

  const handleLoadUrl = () => {
    setLoadSettingsError('');
    if (!loadingUrl) {
      return;
    }
    try {
      const url = new URL(loadingUrl);

      // Start from the defaults, then apply every parameter that the URL sets.
      setParametersToDefault();
      const patch: Record<string, unknown> = {};

      for (const [key, urlParam] of Object.entries(chatSearchParamsMap)) {
        const raw = url.searchParams.get(urlParam);
        if (raw === null) {
          continue;
        }
        const defaultValue = DEFAULT_CHAT_SETTINGS_VALUES[key as keyof Params];

        if (key === 'dropShadowSettings') {
          setDropShadowSettings(raw);
        } else if (key === 'textStrokeSettings') {
          setTextStrokeSettings(raw);
        } else if (key === 'usernameFilters') {
          setUserFilterConfig(decodeFiltersFromUrl(raw));
        } else if (key === 'messageFilters') {
          setMessageFilterConfig(decodeFiltersFromUrl(raw));
        } else if (key === 'highlightRules') {
          setHighlightConfig(decodeFiltersFromUrl<HighlightRule>(raw));
        } else if (urlParam in multiPartSettingsMapForLoading) {
          const match = raw.match(multiPartRegex);
          if (match?.groups) {
            const [valueKey, unitKey] = multiPartSettingsMapForLoading[urlParam];
            patch[valueKey] = Number(match.groups.value);
            patch[unitKey] = match.groups.unit;
          }
        } else if (typeof defaultValue === 'boolean') {
          patch[key] = raw === 'true';
        } else if (typeof defaultValue === 'number') {
          patch[key] = Number(raw);
        } else if ((COLOR_VALUE_SETTINGS as readonly string[]).includes(key)) {
          // Ignore a color that the overlay would not accept either
          if (isColorValue(raw)) {
            patch[key] = raw;
          }
        } else if (key in SETTING_OPTIONS) {
          // Ignore a value that the overlay would not accept either
          if ((SETTING_OPTIONS as Record<string, readonly string[]>)[key].includes(raw)) {
            patch[key] = raw;
          }
        } else {
          patch[key] = raw;
        }
      }

      // An older URL has one color for mentions and first messages. A color set for just one of them wins.
      const legacyColor = url.searchParams.get(LEGACY_HIGHLIGHT_COLOR_PARAM);
      if (legacyColor && /^#[0-9a-f]{6}$/i.test(legacyColor)) {
        patch.highlightMentionsColor ??= legacyColor;
        patch.highlightFirstColor ??= legacyColor;
      }

      logger.debug('Loaded settings from URL', patch);
      update(patch as Partial<Params>);
      setImportOpen(false);
      toast.showToast('Settings loaded from the URL');
    } catch (error) {
      setLoadSettingsError(`That does not look like a full URL. Paste the whole address, starting with https://. (${(error as Error).message})`);
    }
  };

  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setActiveTab(next.id);
    document.getElementById(`settings-tab-${next.id}`)?.focus();
  };

  const toggle = (name: BooleanKey, title: string, description: string) => (
    <SwitchRow
      id={name}
      title={title}
      description={description}
      checked={overlayParameters[name]}
      onChange={(checked) => update({ [name]: checked } as Partial<Params>)}
    />
  );

  // One number field, one unit menu and a reset for a setting stored as `<name>Value` and `<name>Unit`.
  const unitSetting = (name: UnitName, id: string, label: string, units: string[], pxRange: [number, number], otherRange: [number, number]) => {
    const valueKey = `${name}Value` as const;
    const unitKey = `${name}Unit` as const;
    const [min, max] = overlayParameters[unitKey] === 'px' ? pxRange : otherRange;
    return (
      <FormField id={id} label={label}>
        <UnitField
          id={id}
          label={label}
          value={overlayParameters[valueKey]}
          unit={overlayParameters[unitKey]}
          units={units}
          min={min}
          max={max}
          onValueChange={(value) => update({ [valueKey]: value } as Partial<Params>)}
          onUnitChange={(unit) => update({ [unitKey]: unit } as Partial<Params>)}
          onReset={() => reset(valueKey, unitKey)}
        />
      </FormField>
    );
  };

  // Some settings keep a chosen subset as one comma separated value, like `moderator,vip`. One switch turns one item on or off.
  const listSwitch = <T extends string>(
    name: 'onlyRoles' | 'showNotices',
    all: readonly T[],
    parse: (value: string) => T[],
    item: T,
    title: string,
    description: string,
  ) => {
    const selected = parse(overlayParameters[name]);
    return (
      <SwitchRow
        id={`${name}-${item}`}
        title={title}
        description={description}
        checked={selected.includes(item)}
        onChange={(checked) => update({ [name]: all.filter((i) => (i === item ? checked : selected.includes(i))).join(',') } as Partial<Params>)}
      />
    );
  };
  const roleSwitch = (role: Role, title: string, description: string) => listSwitch('onlyRoles', ROLES, parseRoles, role, title, description);
  const noticeSwitch = (kind: NoticeKind, title: string, description: string) =>
    listSwitch('showNotices', NOTICE_KINDS, parseNoticeKinds, kind, title, description);

  // A slider and a number box for a plain number setting.
  const rangeSetting = (name: NumberKey, label: string, min: number, max: number, hint?: string) => (
    <FormField id={name} label={label} hint={hint}>
      <div className="inline">
        <input
          type="range"
          min={min}
          max={max}
          value={overlayParameters[name]}
          onChange={(e) => update({ [name]: Number(e.target.value) } as Partial<Params>)}
          aria-label={`${label} slider`}
        />
        <input
          id={name}
          type="number"
          min={min}
          max={max}
          value={overlayParameters[name]}
          onChange={(e) => update({ [name]: Number(e.target.value) } as Partial<Params>)}
        />
      </div>
    </FormField>
  );

  // A menu for a setting that accepts a fixed set of values.
  const selectSetting = (name: keyof typeof SETTING_OPTIONS, label: string, options: { value: string; label: string }[], hint?: string) => (
    <FormField id={name} label={label} hint={hint}>
      <select id={name} value={overlayParameters[name]} onChange={(e) => update({ [name]: e.target.value } as Partial<Params>)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );

  const renderPane = () => {
    switch (activeTab) {
      case 'look':
        return (
          <>
            <div className="group">
              <h3>Colours</h3>
              <FormField id="foreground-color" label="Text colour">
                <ColorPicker
                  id="foreground-color"
                  placeholder="#ffffff"
                  value={overlayParameters.foregroundColor}
                  onChange={(foregroundColor) => update({ foregroundColor })}
                  setToDefault={() => reset('foregroundColor')}
                />
              </FormField>
              <FormField
                id="background-color"
                label="Background"
                hint="Leave this transparent for OBS. The backdrop behind the preview is only a stand-in for your scene."
              >
                <ColorPicker
                  id="background-color"
                  placeholder="#000000"
                  value={overlayParameters.backgroundColor}
                  onChange={(backgroundColor) => update({ backgroundColor })}
                  setToDefault={() => reset('backgroundColor')}
                  canSetToTransparent
                />
              </FormField>
            </div>
            <div className="group">
              <h3>Type</h3>
              <FormField id="font-family" label="Font family" hint="Use a font that is installed on the computer that runs OBS.">
                <FontFamilyField id="font-family" value={overlayParameters.fontFamily} onChange={(fontFamily) => update({ fontFamily })} />
              </FormField>
              {unitSetting('fontSize', 'font-size-value', 'Font size', ['px', 'em', 'rem'], [10, 64], [0.5, 4])}
            </div>
            <div className="group">
              <h3>Message details</h3>
              {toggle('showAvatars', 'Avatars', 'Profile picture beside each message')}
              {toggle('showBorders', 'Subscriber borders', 'Outline messages from subscribers')}
              {toggle('showColonAfterDisplayName', 'Colon after name', 'Alice: hello, instead of Alice hello')}
              {toggle('showNameAlias', 'Name aliases', 'Show the Latin login next to localised names')}
              {toggle('showGifs', 'Gifs', 'Show gifs in chat messages')}
              {toggle('showReplies', 'Reply context', 'Show which message a reply answers, above the reply')}
            </div>
            <div className="group">
              <h3>Sizes</h3>
              {rangeSetting('avatarSize', 'Avatar size (px)', 16, 96)}
              {rangeSetting('badgeSize', 'Badge size (px)', 12, 48)}
              {rangeSetting('emoteSize', 'Emote size (px)', 16, 96)}
              {rangeSetting('lineHeight', 'Line height (px)', 16, 80, 'The height of one line of text. Raise it with the font size.')}
            </div>
            <div className="group">
              <h3>Message style</h3>
              {selectSetting(
                'usernameColor',
                'Username colour',
                [
                  { value: 'corrected', label: 'Twitch colour, adjusted for contrast' },
                  { value: 'twitch', label: 'Twitch colour' },
                  { value: 'text', label: 'Same as text colour' },
                ],
                'Adjusting for contrast keeps dark names readable on a dark background.',
              )}
              <FormField id="message-background-color" label="Message background">
                <ColorPicker
                  id="message-background-color"
                  placeholder="#000000"
                  value={overlayParameters.messageBackgroundColor}
                  onChange={(messageBackgroundColor) => update({ messageBackgroundColor })}
                  setToDefault={() => reset('messageBackgroundColor')}
                  canSetToTransparent
                />
              </FormField>
              {overlayParameters.messageBackgroundColor !== 'transparent' &&
                rangeSetting('messageBackgroundOpacity', 'Background opacity (%)', 0, 100)}
              {rangeSetting('messageRadius', 'Corner radius (px)', 0, 24)}
            </div>
            <div className="group">
              <h3>Emote services</h3>
              <p className="hint">Twitch emotes always show. These apply to the overlay in OBS. The preview does not use third-party emotes.</p>
              {toggle('sevenTVEmotes', '7TV', 'Emotes from 7TV')}
              {toggle('betterTTVEmotes', 'BetterTTV', 'Emotes from BetterTTV')}
              {toggle('frankerFaceZEmotes', 'FrankerFaceZ', 'Emotes from FrankerFaceZ')}
            </div>
          </>
        );
      case 'layout':
        return (
          <>
            <div className="group">
              <h3>Size</h3>
              <p className="hint">Match these to the width and height of the browser source in OBS for a sharp one-to-one picture.</p>
              {unitSetting('width', 'width-value', 'Width', ['px', 'em', 'rem', 'vw'], [200, 1200], [10, 100])}
              {unitSetting('height', 'height-value', 'Height', ['px', 'em', 'rem', 'vh'], [100, 1200], [10, 100])}
            </div>
            <div className="group">
              <h3>Spacing</h3>
              {unitSetting('chatMessagePadding', 'padding-value', 'Padding around each message', ['px', 'em', 'rem', 'vh'], [0, 32], [0, 4])}
            </div>
            <div className="group">
              <h3>Alignment</h3>
              {selectSetting(
                'chatAnchor',
                'New messages appear at',
                [
                  { value: 'bottom', label: 'The bottom, older messages move up' },
                  { value: 'top', label: 'The top, chat grows downward' },
                ],
                'The overlay does the same: messages start at this edge.',
              )}
            </div>
            <div className="group">
              <h3>History</h3>
              {rangeSetting('maxMessages', 'Messages to keep', 10, 500, 'Older messages are dropped. This keeps the overlay fast on a long stream.')}
            </div>
          </>
        );
      case 'motion':
        return (
          <div className="group">
            <h3>Messages in and out</h3>
            {toggle('animatedEntry', 'Animate entry', 'New messages slide in')}
            {toggle('animatedExit', 'Animate exit', 'Messages fade away after a delay')}
            {overlayParameters.animatedExit && rangeSetting('secondsBeforeExit', 'Seconds before a message leaves', 1, 60)}
          </div>
        );
      case 'effects':
        return (
          <>
            <div className="group">
              <h3>Drop shadow</h3>
              {toggle('dropShadowEnabled', 'Shadow on message text', 'Stack layers for a soft glow or a hard edge')}
              {overlayParameters.dropShadowEnabled && (
                <>
                  <div className="inline inline-wrap">
                    <Button
                      type="secondary"
                      onClick={() => {
                        setDropShadowSettings(NICE_DROP_SHADOW_PRESET);
                        update({ dropShadowEnabled: true });
                      }}
                    >
                      Use outline preset
                    </Button>
                    <Button type="ghost" onClick={() => setDropShadowSettings(DEFAULT_CHAT_SETTINGS_VALUES.dropShadowSettings)}>
                      Back to default
                    </Button>
                  </div>
                  <p className="hint">The outline preset replaces your current layers.</p>
                  <TextShadowStacker onChange={setDropShadowSettings} value={dropShadowSettings} />
                </>
              )}
            </div>
            <div className="group">
              <h3>Text stroke</h3>
              {toggle('textStrokeEnabled', 'Stroke around letters', 'Helps text stand out on a busy scene')}
              {overlayParameters.textStrokeEnabled && <TextStrokeEditor value={textStrokeSettings} onChange={setTextStrokeSettings} />}
            </div>
          </>
        );
      case 'alerts':
        return (
          <>
            <div className="group">
              <h3>Event banners</h3>
              <p className="hint">
                Show channel events as coloured banners in the chat. The overlay asks Twitch for these events only when at least one is on.
              </p>
              {noticeSwitch('subs', 'Subs and resubs', 'Includes the message that comes with a resub')}
              {noticeSwitch('gifts', 'Gifted subs', 'A gift of many subs is one banner')}
              {noticeSwitch('raids', 'Raids', 'When another channel raids you')}
              {noticeSwitch('announcements', 'Announcements', 'Moderator announcements, in the announcement colour')}
            </div>
            <div className="group">
              <h3>Banner style</h3>
              <p className="hint">
                Banners also follow your font, text colour, shadow, padding and corner radius. Announcements keep the colour that the moderator chose.
              </p>
              {toggle('showNoticeLabels', 'Label', 'Start each banner with a word such as SUB or RAID')}
              <FormField id="notice-color-subs" label="Sub colour">
                <ColorValuePicker
                  id="notice-color-subs"
                  placeholder="#a970ff"
                  value={overlayParameters.noticeColorSubs}
                  onChange={(noticeColorSubs) => update({ noticeColorSubs })}
                  setToDefault={() => reset('noticeColorSubs')}
                />
              </FormField>
              <FormField id="notice-color-gifts" label="Gifted sub colour">
                <ColorValuePicker
                  id="notice-color-gifts"
                  placeholder="#ff6ba6"
                  value={overlayParameters.noticeColorGifts}
                  onChange={(noticeColorGifts) => update({ noticeColorGifts })}
                  setToDefault={() => reset('noticeColorGifts')}
                />
              </FormField>
              <FormField id="notice-color-raids" label="Raid colour">
                <ColorValuePicker
                  id="notice-color-raids"
                  placeholder="#ff8800"
                  value={overlayParameters.noticeColorRaids}
                  onChange={(noticeColorRaids) => update({ noticeColorRaids })}
                  setToDefault={() => reset('noticeColorRaids')}
                />
              </FormField>
            </div>
            <div className="group">
              <h3>Highlights</h3>
              {/* The names are the sample chatters in ChatPreview. Keep them in step. */}
              {toggle('highlightPoints', 'Channel point highlights', 'Messages sent with Highlight My Message. Preview: Bob.')}
              {overlayParameters.highlightPoints && (
                <FormField id="highlight-points-color" label="Channel point colour">
                  <ColorValuePicker
                    id="highlight-points-color"
                    placeholder="#a970ff"
                    value={overlayParameters.highlightPointsColor}
                    onChange={(highlightPointsColor) => update({ highlightPointsColor })}
                    setToDefault={() => reset('highlightPointsColor')}
                    emptyLabel="Twitch style"
                  />
                </FormField>
              )}
              {toggle('highlightMentions', 'Mentions of your channel', 'A message that mentions your channel name. Preview: Diana.')}
              {overlayParameters.highlightMentions && (
                <FormField id="highlight-mentions-color" label="Mention colour">
                  <ColorValuePicker
                    id="highlight-mentions-color"
                    placeholder="#a970ff"
                    value={overlayParameters.highlightMentionsColor}
                    onChange={(highlightMentionsColor) => update({ highlightMentionsColor })}
                    setToDefault={() => reset('highlightMentionsColor')}
                  />
                </FormField>
              )}
              {toggle('highlightFirstMessages', 'First messages', 'A chatter’s first message in your channel. Preview: Frank.')}
              {overlayParameters.highlightFirstMessages && (
                <FormField id="highlight-first-color" label="First message colour">
                  <ColorValuePicker
                    id="highlight-first-color"
                    placeholder="#00c853"
                    value={overlayParameters.highlightFirstColor}
                    onChange={(highlightFirstColor) => update({ highlightFirstColor })}
                    setToDefault={() => reset('highlightFirstColor')}
                  />
                </FormField>
              )}
              {rangeSetting(
                'highlightStrength',
                'Colour strength (%)',
                5,
                100,
                'How strong the colour behind a highlight, a rule or a banner is. Raise it to make a gradient stand out. Twitch style is always full strength.',
              )}
            </div>
            <div className="group">
              <h3>Highlight rules</h3>
              <p className="hint">
                A message that matches a rule gets that rule’s colour. The first matching rule wins. To try it in the preview, match the text catJAM.
              </p>
              <FilterEditor<HighlightRule>
                value={highlightConfig}
                onChange={setHighlightConfig}
                addLabel="Add highlight rule"
                placeholder="Text to match"
                emptyText="No rules. Add one to colour messages that contain a word."
                createRule={() => ({
                  matchType: 'contains',
                  pattern: '',
                  caseSensitive: false,
                  color: DEFAULT_CHAT_SETTINGS_VALUES.highlightMentionsColor,
                })}
                extraControl={(rule, updateRule) => (
                  <ColorValueCompact value={rule.color} onChange={(color) => updateRule({ color })} label="Highlight colour for this rule" />
                )}
              />
            </div>
          </>
        );
      case 'filters':
        return (
          <>
            <div className="group">
              <h3>Only show messages from</h3>
              <p className="hint">Turn on one or more roles to hide everyone else. Leave all off to show everyone.</p>
              {roleSwitch('subscriber', 'Subscribers', 'Includes founders')}
              {roleSwitch('vip', 'VIPs', 'Chatters with the VIP badge')}
              {roleSwitch('moderator', 'Moderators', 'Chatters with the moderator badge')}
              {roleSwitch('broadcaster', 'Broadcaster', 'You, in your own chat')}
            </div>
            <div className="group">
              <h3>Hide chatters</h3>
              <p className="hint">Messages from a matching username never appear. This is useful for bots.</p>
              <FilterEditor
                value={userFilterConfig}
                onChange={setUserFilterConfig}
                addLabel="Add username rule"
                placeholder="Username"
                emptyText="No rules. Everyone shows."
              />
              <div>
                <Button type="ghost" onClick={() => setUserFilterConfig(withCommonBots)}>
                  Add common bots
                </Button>
              </div>
              <p className="hint">Adds {COMMON_BOT_NAMES.join(', ')}. Bots that are already listed are skipped.</p>
            </div>
            <div className="group">
              <h3>Hide messages</h3>
              <p className="hint">Messages with matching text never appear. For example, chat commands.</p>
              <FilterEditor
                value={messageFilterConfig}
                onChange={setMessageFilterConfig}
                addLabel="Add message rule"
                placeholder="Text to match"
                emptyText="No rules. Every message shows."
              />
              <div>
                <Button type="ghost" onClick={() => setMessageFilterConfig(withCommandFilter)}>
                  Hide chat commands
                </Button>
              </div>
              <details className="help">
                <summary>How wildcard rules work</summary>
                <p>
                  <code>*</code> matches any run of characters. <code>?</code> matches exactly one character. So <code>!*</code> matches every message
                  that starts with an exclamation mark. Rules ignore case unless you tick Case.
                </p>
              </details>
            </div>
          </>
        );
    }
  };

  return (
    <>
      <div className="source-strip">
        <div className="studio-wrap source-strip-inner">
          <span className="source-strip-label">Browser source URL</span>
          <SourceUrl url={chatUrl} />
          <span className={`pill ${pendingChanges ? 'pill-warn' : 'pill-good'}`}>
            {pendingChanges ? `${pendingChanges} ${pendingChanges === 1 ? 'change' : 'changes'} not applied` : 'In sync with OBS'}
          </span>
          <CopyButton text={chatUrl} />
        </div>
      </div>

      <div className="studio-wrap studio-editor">
        <div className="panel">
          <div className="panel-head">
            <h2>Overlay settings</h2>
            <Button type="ghost" onClick={() => setImportOpen((o) => !o)}>
              Import from URL
            </Button>
            <Button type="danger" onClick={() => setConfirmResetOpen(true)}>
              Reset all
            </Button>
          </div>

          {importOpen && (
            <div className="drawer">
              <label htmlFor="chat-url">
                <b>Paste an existing overlay URL</b>
              </label>
              <p className="hint">Every setting is read from it. Your current changes are replaced.</p>
              <div className="inline">
                <input
                  id="chat-url"
                  type="text"
                  value={loadingUrl}
                  onChange={(e) => {
                    setLoadSettingsError('');
                    setLoadingUrl(e.target.value);
                  }}
                  placeholder="https://chat.nice.gg/chat?font-size=22px&show-avatars=false"
                  autoComplete="off"
                />
                <Button type="primary" onClick={handleLoadUrl}>
                  Load
                </Button>
              </div>
              {loadSettingsError && <p className="hint hint-error">{loadSettingsError}</p>}
            </div>
          )}

          <div className="tabs" role="tablist" aria-label="Setting groups">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                id={`settings-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`settings-pane-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
              >
                {tab.label}
                {(tabCounts[tab.id] ?? 0) > 0 && <span className="tabs-count">{tabCounts[tab.id]}</span>}
              </button>
            ))}
          </div>

          <div className="tabpane" id={`settings-pane-${activeTab}`} role="tabpanel" aria-labelledby={`settings-tab-${activeTab}`}>
            {renderPane()}
          </div>

          <div className="applybar">
            <span className="applybar-note">
              {pendingChanges ? 'Applying updates the URL above. Refresh the source in OBS afterward.' : 'No changes to apply.'}
            </span>
            <Button type="primary" disabled={!pendingChanges} onClick={handleUpdateUrl}>
              Update source URL
            </Button>
          </div>
        </div>

        <ChatPreview overlayParameters={currentParameters} replayKey={replayKey} onReplay={() => setReplayKey((k) => k + 1)} />
      </div>

      <ConfirmModal
        open={confirmResetOpen}
        title="Reset settings?"
        message="This resets every setting to its default, including filters and effects. The URL in OBS does not change until you update it."
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={confirmReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </>
  );
};
