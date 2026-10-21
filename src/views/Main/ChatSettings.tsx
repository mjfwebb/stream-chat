import { useState } from 'react';

import { Button } from '../../components/Button/Button';
import { ColorPicker } from '../../components/ColorPicker/ColorPicker';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import FilterEditor from '../../components/FilterEditor/FilterEditor';
import { FormField } from '../../components/FormField/FormField';
import { SourceUrl } from '../../components/SourceUrl/SourceUrl';
import { SwitchRow } from '../../components/SwitchRow/SwitchRow';
import { TextShadowStacker } from '../../components/TextShadowPicker/TextShadowStacker';
import { TextStrokeEditor } from '../../components/TextStrokePicker/TextStrokeEditor';
import { useToast } from '../../components/Toast/useToast';
import { UnitField } from '../../components/UnitField/UnitField';
import { chatSearchParamsMap, DEFAULT_CHAT_SETTINGS_VALUES } from '../../constants';
import { decodeFiltersFromUrl, EMPTY_FILTER_CONFIG, encodeFiltersToUrl, type UserFilterConfig } from '../../utils/filters';
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

type TabId = 'look' | 'layout' | 'motion' | 'effects' | 'filters';

const TABS: { id: TabId; label: string }[] = [
  { id: 'look', label: 'Look' },
  { id: 'layout', label: 'Layout' },
  { id: 'motion', label: 'Motion' },
  { id: 'effects', label: 'Effects' },
  { id: 'filters', label: 'Filters' },
];

export const ChatSettings = ({ chatUrl, setChatUrl }: { chatUrl: string; setChatUrl: (url: string) => void }) => {
  const [overlayParameters, setOverlayParameters] = useState(DEFAULT_CHAT_SETTINGS_VALUES);
  // These four have their own editors, so they live outside overlayParameters and are merged in below.
  const [dropShadowSettings, setDropShadowSettings] = useState(DEFAULT_CHAT_SETTINGS_VALUES.dropShadowSettings);
  const [textStrokeSettings, setTextStrokeSettings] = useState(DEFAULT_CHAT_SETTINGS_VALUES.textStrokeSettings);
  const [userFilterConfig, setUserFilterConfig] = useState<UserFilterConfig>(EMPTY_FILTER_CONFIG);
  const [messageFilterConfig, setMessageFilterConfig] = useState<UserFilterConfig>(EMPTY_FILTER_CONFIG);
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
  };
  const pendingUrl = buildUpdatedChatUrl(chatUrl, currentParameters);
  const pendingChanges = countChangedParams(chatUrl, pendingUrl);
  const filterRuleCount = (userFilterConfig.rules?.length ?? 0) + (messageFilterConfig.rules?.length ?? 0);

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
        } else {
          patch[key] = raw;
        }
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

  const renderPane = () => {
    switch (activeTab) {
      case 'look':
        return (
          <>
            <div className="group">
              <h3>Colors</h3>
              <FormField id="foreground-color" label="Text color">
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
                <input
                  id="font-family"
                  type="text"
                  placeholder="Arial"
                  list="font-family-suggestions"
                  value={overlayParameters.fontFamily}
                  onChange={(e) => update({ fontFamily: e.target.value })}
                  autoComplete="off"
                />
                <datalist id="font-family-suggestions">
                  {['sans-serif', 'Arial', 'Georgia', 'Trebuchet MS', 'Courier New', 'Impact'].map((font) => (
                    <option key={font} value={font} />
                  ))}
                </datalist>
              </FormField>
              {unitSetting('fontSize', 'font-size-value', 'Font size', ['px', 'em', 'rem'], [10, 64], [0.5, 4])}
            </div>
            <div className="group">
              <h3>Message details</h3>
              {toggle('showAvatars', 'Avatars', 'Profile picture beside each message')}
              {toggle('showBorders', 'Subscriber borders', 'Outline messages from subscribers')}
              {toggle('showColonAfterDisplayName', 'Colon after name', 'Alice: hello, instead of Alice hello')}
              {toggle('showNameAlias', 'Name aliases', 'Show the Latin login next to localized names')}
              {toggle('showGifs', 'Gifs', 'Show gifs in chat messages')}
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
      case 'filters':
        return (
          <>
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
                {tab.id === 'filters' && filterRuleCount > 0 && <span className="tabs-count">{filterRuleCount}</span>}
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
