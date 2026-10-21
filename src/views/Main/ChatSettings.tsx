import { useEffect, useState } from 'react';

import { Button } from '../../components/Button/Button';
import { ColorPicker } from '../../components/ColorPicker/ColorPicker';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import FilterEditor from '../../components/FilterEditor/FilterEditor';
import { SourceUrl } from '../../components/SourceUrl/SourceUrl';
import { SwitchRow } from '../../components/SwitchRow/SwitchRow';
import { TextShadowStacker } from '../../components/TextShadowPicker/TextShadowStacker';
import { TextStrokeEditor } from '../../components/TextStrokePicker/TextStrokeEditor';
import { useToast } from '../../components/Toast/useToast';
import { UnitField } from '../../components/UnitField/UnitField';
import { chatSearchParamsMap, DEFAULT_CHAT_SETTINGS_VALUES } from '../../constants';
import { useDebounce } from '../../hooks/useDebounce';
import { decodeFiltersFromUrl, EMPTY_FILTER_CONFIG, encodeFiltersToUrl, type UserFilterConfig } from '../../utils/filters';
import { logger } from '../../utils/logger';
import { buildUpdatedChatUrl, countChangedParams } from './buildChatUrl';
import { ChatPreview } from './ChatPreview/ChatPreview';
import './ChatSettings.less';

const multiPartSettingsMapForLoading = {
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
  const [loadSettingsError, setLoadSettingsError] = useState('');
  const [loadingUrl, setLoadingUrl] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('look');
  const [replayKey, setReplayKey] = useState(0);
  const [dropShadowSettings, setDropShadowSettings] = useState(overlayParameters.dropShadowSettings);
  const debouncedDropShadowSettings = useDebounce(dropShadowSettings, 300);
  const [textStrokeSettings, setTextStrokeSettings] = useState(overlayParameters.textStrokeSettings);
  const debouncedTextStrokeSettings = useDebounce(textStrokeSettings, 300);
  const [userFilterConfig, setUserFilterConfig] = useState<UserFilterConfig>(decodeFiltersFromUrl(overlayParameters.usernameFilters));
  const [messageFilterConfig, setMessageFilterConfig] = useState<UserFilterConfig>(decodeFiltersFromUrl(overlayParameters.messageFilters));
  const toast = useToast();

  useEffect(() => {
    setOverlayParameters((prev) => ({
      ...prev,
      dropShadowSettings: debouncedDropShadowSettings,
    }));
  }, [debouncedDropShadowSettings]);

  useEffect(() => {
    setOverlayParameters((prev) => ({
      ...prev,
      textStrokeSettings: debouncedTextStrokeSettings,
    }));
  }, [debouncedTextStrokeSettings]);

  useEffect(() => {
    // Sync encoded filters whenever config changes
    const encoded = encodeFiltersToUrl(userFilterConfig);
    setOverlayParameters((prev) => ({ ...prev, usernameFilters: encoded }));
  }, [userFilterConfig]);

  useEffect(() => {
    // Sync encoded filters whenever config changes
    const encoded = encodeFiltersToUrl(messageFilterConfig);
    setOverlayParameters((prev) => ({ ...prev, messageFilters: encoded }));
  }, [messageFilterConfig]);

  const update = (patch: Partial<typeof DEFAULT_CHAT_SETTINGS_VALUES>) => setOverlayParameters((prev) => ({ ...prev, ...patch }));

  const pendingUrl = buildUpdatedChatUrl(chatUrl, overlayParameters);
  const pendingChanges = countChangedParams(chatUrl, pendingUrl);
  const filterRuleCount = (userFilterConfig.rules?.length ?? 0) + (messageFilterConfig.rules?.length ?? 0);

  const handleUpdateUrl = () => {
    setChatUrl(pendingUrl);
    toast.showToast('Source URL updated. Refresh the browser source in OBS to see it.');
  };

  const setParametersToDefault = () => {
    setDropShadowSettings(DEFAULT_CHAT_SETTINGS_VALUES.dropShadowSettings);
    setTextStrokeSettings(DEFAULT_CHAT_SETTINGS_VALUES.textStrokeSettings);
    setOverlayParameters(DEFAULT_CHAT_SETTINGS_VALUES);
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

      // Set all values to defaults to normalize
      setParametersToDefault();

      // Now load the chat settings from the URL
      for (const [key, urlParam] of Object.entries(chatSearchParamsMap)) {
        const value = url.searchParams.get(urlParam) ?? DEFAULT_CHAT_SETTINGS_VALUES[key as keyof typeof DEFAULT_CHAT_SETTINGS_VALUES];

        // Special-case: stacked text-shadows (comma-separated)
        if (key === 'dropShadowSettings') {
          const shadowValue = url.searchParams.get(urlParam);
          if (shadowValue != null) {
            // Assign decoded, comma-separated shadow string to local and overlay state
            setDropShadowSettings(shadowValue);
            setOverlayParameters((prev) => ({ ...prev, dropShadowSettings: shadowValue }));
          }
          logger.debug('Loaded drop shadow setting:', urlParam, { shadowValue });
          continue;
        }

        // Special-case: text stroke (width + color)
        if (key === 'textStrokeSettings') {
          const strokeVal = url.searchParams.get(urlParam);
          if (strokeVal != null) {
            setTextStrokeSettings(strokeVal);
            setOverlayParameters((prev) => ({ ...prev, textStrokeSettings: strokeVal }));
          }
          logger.debug('Loaded text stroke setting:', urlParam, { strokeVal });
          continue;
        }

        if (Object.keys(multiPartSettingsMapForLoading).includes(urlParam)) {
          const match = String(value).match(multiPartRegex);
          if (match) {
            const sizeValue = Number(match.groups?.value);
            const sizeUnit = match.groups?.unit;
            setOverlayParameters((prev) => ({
              ...prev,
              [multiPartSettingsMapForLoading[urlParam as keyof typeof multiPartSettingsMapForLoading][0]]: sizeValue,
              [multiPartSettingsMapForLoading[urlParam as keyof typeof multiPartSettingsMapForLoading][1]]: sizeUnit,
            }));
            logger.debug('Loaded multi-part setting:', urlParam, { sizeValue, sizeUnit });
          }
          continue;
        }

        // Special-case: username filters param (base64url encoded)
        if (key === 'usernameFilters') {
          const decoded = decodeFiltersFromUrl(url.searchParams.get(urlParam));
          setUserFilterConfig(decoded);
          setOverlayParameters((prev) => ({ ...prev, usernameFilters: encodeFiltersToUrl(decoded) }));
          logger.debug('Loaded username filters:', urlParam, { decoded });
          continue;
        }

        // Special-case: message filters param (base64url encoded)
        if (key === 'messageFilters') {
          const decoded = decodeFiltersFromUrl(url.searchParams.get(urlParam));
          setMessageFilterConfig(decoded);
          setOverlayParameters((prev) => ({ ...prev, messageFilters: encodeFiltersToUrl(decoded) }));
          logger.debug('Loaded message filters:', urlParam, { decoded });
          continue;
        }

        const isBooleanSetting = typeof DEFAULT_CHAT_SETTINGS_VALUES[key as keyof typeof DEFAULT_CHAT_SETTINGS_VALUES] === 'boolean';
        // If the setting is a boolean, convert the string value to a boolean so it can be used correctly
        if (isBooleanSetting) {
          setOverlayParameters((prev) => ({
            ...prev,
            [key]: typeof value === 'boolean' ? value : value === 'true',
          }));
          logger.debug('Loaded boolean setting:', urlParam, key, { value });
        } else {
          setOverlayParameters((prev) => ({ ...prev, [key]: value }));
          logger.debug('Loaded setting:', urlParam, key, { value });
        }
      }
      setImportOpen(false);
      toast.showToast('Settings loaded from the URL');
    } catch (error) {
      setLoadSettingsError(`That does not look like a full URL. Paste the whole address, starting with https://. (${(error as Error).message})`);
    }
  };

  const applyNiceDropShadowPreset = () => {
    setDropShadowSettings(NICE_DROP_SHADOW_PRESET);
    update({ dropShadowEnabled: true });
  };

  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setActiveTab(next.id);
    document.getElementById(`settings-tab-${next.id}`)?.focus();
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

          {activeTab === 'look' && (
            <div className="tabpane" id="settings-pane-look" role="tabpanel" aria-labelledby="settings-tab-look">
              <div className="group">
                <h3>Colors</h3>
                <div className="field">
                  <label htmlFor="foreground-color">Text color</label>
                  <ColorPicker
                    id="foreground-color"
                    placeholder="#ffffff"
                    value={overlayParameters.foregroundColor}
                    onChange={(foregroundColor) => update({ foregroundColor })}
                    setToDefault={() => update({ foregroundColor: DEFAULT_CHAT_SETTINGS_VALUES.foregroundColor })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="background-color">Background</label>
                  <ColorPicker
                    id="background-color"
                    placeholder="#000000"
                    value={overlayParameters.backgroundColor}
                    onChange={(backgroundColor) => update({ backgroundColor })}
                    setToDefault={() => update({ backgroundColor: DEFAULT_CHAT_SETTINGS_VALUES.backgroundColor })}
                    canSetToTransparent
                  />
                  <p className="hint">Leave this transparent for OBS. The backdrop behind the preview is only a stand-in for your scene.</p>
                </div>
              </div>
              <div className="group">
                <h3>Type</h3>
                <div className="field">
                  <label htmlFor="font-family">Font family</label>
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
                    <option value="sans-serif" />
                    <option value="Arial" />
                    <option value="Georgia" />
                    <option value="Trebuchet MS" />
                    <option value="Courier New" />
                    <option value="Impact" />
                  </datalist>
                  <p className="hint">Use a font that is installed on the computer that runs OBS.</p>
                </div>
                <div className="field">
                  <label htmlFor="font-size-value">Font size</label>
                  <UnitField
                    id="font-size-value"
                    label="Font size"
                    value={overlayParameters.fontSizeValue}
                    unit={overlayParameters.fontSizeUnit}
                    units={['px', 'em', 'rem']}
                    min={overlayParameters.fontSizeUnit === 'px' ? 10 : 0.5}
                    max={overlayParameters.fontSizeUnit === 'px' ? 64 : 4}
                    onValueChange={(fontSizeValue) => update({ fontSizeValue })}
                    onUnitChange={(fontSizeUnit) => update({ fontSizeUnit })}
                    onReset={() =>
                      update({
                        fontSizeValue: DEFAULT_CHAT_SETTINGS_VALUES.fontSizeValue,
                        fontSizeUnit: DEFAULT_CHAT_SETTINGS_VALUES.fontSizeUnit,
                      })
                    }
                  />
                </div>
              </div>
              <div className="group">
                <h3>Message details</h3>
                <SwitchRow
                  id="showAvatars"
                  title="Avatars"
                  description="Profile picture beside each message"
                  checked={overlayParameters.showAvatars}
                  onChange={(showAvatars) => update({ showAvatars })}
                />
                <SwitchRow
                  id="showBorders"
                  title="Subscriber borders"
                  description="Outline messages from subscribers"
                  checked={overlayParameters.showBorders}
                  onChange={(showBorders) => update({ showBorders })}
                />
                <SwitchRow
                  id="showColonAfterDisplayName"
                  title="Colon after name"
                  description="Alice: hello, instead of Alice hello"
                  checked={overlayParameters.showColonAfterDisplayName}
                  onChange={(showColonAfterDisplayName) => update({ showColonAfterDisplayName })}
                />
                <SwitchRow
                  id="showNameAlias"
                  title="Name aliases"
                  description="Show the Latin login next to localized names"
                  checked={overlayParameters.showNameAlias}
                  onChange={(showNameAlias) => update({ showNameAlias })}
                />
                <SwitchRow
                  id="showGifs"
                  title="Gifs"
                  description="Show gifs in chat messages"
                  checked={overlayParameters.showGifs}
                  onChange={(showGifs) => update({ showGifs })}
                />
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="tabpane" id="settings-pane-layout" role="tabpanel" aria-labelledby="settings-tab-layout">
              <div className="group">
                <h3>Size</h3>
                <p className="hint">Match these to the width and height of the browser source in OBS for a sharp one-to-one picture.</p>
                <div className="field">
                  <label htmlFor="width-value">Width</label>
                  <UnitField
                    id="width-value"
                    label="Width"
                    value={overlayParameters.widthValue}
                    unit={overlayParameters.widthUnit}
                    units={['px', 'em', 'rem', 'vw']}
                    min={overlayParameters.widthUnit === 'px' ? 200 : 10}
                    max={overlayParameters.widthUnit === 'px' ? 1200 : 100}
                    onValueChange={(widthValue) => update({ widthValue })}
                    onUnitChange={(widthUnit) => update({ widthUnit })}
                    onReset={() => update({ widthValue: DEFAULT_CHAT_SETTINGS_VALUES.widthValue, widthUnit: DEFAULT_CHAT_SETTINGS_VALUES.widthUnit })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="height-value">Height</label>
                  <UnitField
                    id="height-value"
                    label="Height"
                    value={overlayParameters.heightValue}
                    unit={overlayParameters.heightUnit}
                    units={['px', 'em', 'rem', 'vh']}
                    min={overlayParameters.heightUnit === 'px' ? 100 : 10}
                    max={overlayParameters.heightUnit === 'px' ? 1200 : 100}
                    onValueChange={(heightValue) => update({ heightValue })}
                    onUnitChange={(heightUnit) => update({ heightUnit })}
                    onReset={() =>
                      update({ heightValue: DEFAULT_CHAT_SETTINGS_VALUES.heightValue, heightUnit: DEFAULT_CHAT_SETTINGS_VALUES.heightUnit })
                    }
                  />
                </div>
              </div>
              <div className="group">
                <h3>Spacing</h3>
                <div className="field">
                  <label htmlFor="padding-value">Padding around each message</label>
                  <UnitField
                    id="padding-value"
                    label="Padding"
                    value={overlayParameters.chatMessagePaddingValue}
                    unit={overlayParameters.chatMessagePaddingUnit}
                    units={['px', 'em', 'rem', 'vh']}
                    min={0}
                    max={overlayParameters.chatMessagePaddingUnit === 'px' ? 32 : 4}
                    onValueChange={(chatMessagePaddingValue) => update({ chatMessagePaddingValue })}
                    onUnitChange={(chatMessagePaddingUnit) => update({ chatMessagePaddingUnit })}
                    onReset={() =>
                      update({
                        chatMessagePaddingValue: DEFAULT_CHAT_SETTINGS_VALUES.chatMessagePaddingValue,
                        chatMessagePaddingUnit: DEFAULT_CHAT_SETTINGS_VALUES.chatMessagePaddingUnit,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'motion' && (
            <div className="tabpane" id="settings-pane-motion" role="tabpanel" aria-labelledby="settings-tab-motion">
              <div className="group">
                <h3>Messages in and out</h3>
                <SwitchRow
                  id="animatedEntry"
                  title="Animate entry"
                  description="New messages slide in"
                  checked={overlayParameters.animatedEntry}
                  onChange={(animatedEntry) => update({ animatedEntry })}
                />
                <SwitchRow
                  id="animatedExit"
                  title="Animate exit"
                  description="Messages fade away after a delay"
                  checked={overlayParameters.animatedExit}
                  onChange={(animatedExit) => update({ animatedExit })}
                />
                {overlayParameters.animatedExit && (
                  <div className="field">
                    <label htmlFor="secondsBeforeExit">Seconds before a message leaves</label>
                    <div className="inline">
                      <input
                        type="range"
                        min={1}
                        max={60}
                        value={overlayParameters.secondsBeforeExit}
                        onChange={(e) => update({ secondsBeforeExit: Number(e.target.value) })}
                        aria-label="Seconds before exit slider"
                      />
                      <input
                        id="secondsBeforeExit"
                        type="number"
                        min={1}
                        max={60}
                        value={overlayParameters.secondsBeforeExit}
                        onChange={(e) => update({ secondsBeforeExit: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="group">
                <h3>Try it</h3>
                <p className="hint">Replay the animation in the preview with your current settings.</p>
                <div>
                  <Button type="secondary" onClick={() => setReplayKey((k) => k + 1)}>
                    Replay animation
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="tabpane" id="settings-pane-effects" role="tabpanel" aria-labelledby="settings-tab-effects">
              <div className="group">
                <h3>Drop shadow</h3>
                <SwitchRow
                  id="dropShadowEnabled"
                  title="Shadow on message text"
                  description="Stack layers for a soft glow or a hard edge"
                  checked={overlayParameters.dropShadowEnabled}
                  onChange={(dropShadowEnabled) => update({ dropShadowEnabled })}
                />
                {overlayParameters.dropShadowEnabled && (
                  <>
                    <div className="inline inline-wrap">
                      <Button type="secondary" onClick={applyNiceDropShadowPreset}>
                        Use outline preset
                      </Button>
                      <Button
                        type="ghost"
                        onClick={() => {
                          setDropShadowSettings(DEFAULT_CHAT_SETTINGS_VALUES.dropShadowSettings);
                          update({ dropShadowSettings: DEFAULT_CHAT_SETTINGS_VALUES.dropShadowSettings });
                        }}
                      >
                        Back to default
                      </Button>
                    </div>
                    <p className="hint">The outline preset replaces your current layers.</p>
                    <TextShadowStacker onChange={(newValue: string) => setDropShadowSettings(newValue)} value={dropShadowSettings} />
                  </>
                )}
              </div>
              <div className="group">
                <h3>Text stroke</h3>
                <SwitchRow
                  id="textStrokeEnabled"
                  title="Stroke around letters"
                  description="Helps text stand out on a busy scene"
                  checked={overlayParameters.textStrokeEnabled}
                  onChange={(textStrokeEnabled) => update({ textStrokeEnabled })}
                />
                {overlayParameters.textStrokeEnabled && (
                  <TextStrokeEditor value={textStrokeSettings} onChange={(v: string) => setTextStrokeSettings(v)} />
                )}
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="tabpane" id="settings-pane-filters" role="tabpanel" aria-labelledby="settings-tab-filters">
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
                    <code>*</code> matches any run of characters. <code>?</code> matches exactly one character. So <code>!*</code> matches every
                    message that starts with an exclamation mark. Rules ignore case unless you tick Case.
                  </p>
                </details>
              </div>
            </div>
          )}

          <div className="applybar">
            <span className="applybar-note">
              {pendingChanges ? 'Applying updates the URL above. Refresh the source in OBS afterward.' : 'No changes to apply.'}
            </span>
            <Button type="primary" disabled={!pendingChanges} onClick={handleUpdateUrl}>
              Update source URL
            </Button>
          </div>
        </div>

        <ChatPreview
          overlayParameters={{
            ...overlayParameters,
            dropShadowSettings,
            textStrokeSettings,
            usernameFilters: encodeFiltersToUrl(userFilterConfig),
            messageFilters: encodeFiltersToUrl(messageFilterConfig),
          }}
          replayKey={replayKey}
          onReplay={() => setReplayKey((k) => k + 1)}
        />
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
