import type { UserFilterConfig, UserFilterRule } from '../../utils/filters';
import { Button } from '../Button/Button';

import './FilterEditor.less';

type FilterEditorProps = {
  value: UserFilterConfig;
  onChange: (cfg: UserFilterConfig) => void;
  addLabel?: string;
  placeholder?: string;
  emptyText?: string;
};

const matchTypes: UserFilterRule['matchType'][] = ['exact', 'contains', 'wildcard'];

export function FilterEditor({ value, onChange, addLabel = 'Add rule', placeholder = 'pattern', emptyText = 'No rules yet.' }: FilterEditorProps) {
  const rules = value.rules ?? [];
  const hasRules = rules.length > 0;

  const addRule = () => {
    const next: UserFilterRule = { matchType: 'exact', pattern: '', caseSensitive: false };
    onChange({ rules: [...rules, next] });
  };

  const updateRule = (idx: number, patch: Partial<UserFilterRule>) => {
    const next = [...rules];
    next[idx] = { ...next[idx], ...patch } as UserFilterRule;
    onChange({ rules: next });
  };

  const removeRule = (idx: number) => {
    onChange({ rules: rules.filter((_, i) => i !== idx) });
  };

  return (
    <div className="filter-editor">
      {hasRules ? (
        <div className="filter-editor-rules">
          {rules.map((r, idx) => (
            <div className="filter-editor-rule" key={idx}>
              <select
                value={r.matchType}
                onChange={(e) => updateRule(idx, { matchType: e.target.value as UserFilterRule['matchType'] })}
                aria-label="Match type"
              >
                {matchTypes.map((mt) => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder={placeholder}
                value={r.pattern}
                onChange={(e) => updateRule(idx, { pattern: e.target.value })}
                autoComplete="off"
                aria-label="Pattern"
              />
              <label className="filter-editor-case">
                <input type="checkbox" checked={!!r.caseSensitive} onChange={(e) => updateRule(idx, { caseSensitive: e.target.checked })} />
                Case
              </label>
              <button type="button" className="filter-editor-remove" onClick={() => removeRule(idx)} aria-label="Remove rule">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="filter-editor-empty">{emptyText}</div>
      )}
      <div>
        <Button type="secondary" onClick={addRule}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

export default FilterEditor;
