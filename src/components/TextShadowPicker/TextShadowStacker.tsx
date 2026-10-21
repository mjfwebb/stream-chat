import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { styled } from 'styled-components';

import { TextShadowPicker } from './TextShadowPicker';

const StackWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const ShadowCard = styled.div`
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-2);
  padding: 6px 8px;
  font-size: 12px;
  color: var(--muted);
`;

const CardActions = styled.div`
  display: flex;
  gap: 6px;
  & > button {
    background: var(--surface-2);
    color: var(--fg);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
  }
  & > button:hover {
    background: var(--line);
  }
`;

const FooterActions = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
`;

export interface TextShadowStackerProps {
  value?: string; // comma-separated text-shadow string
  onChange: (value: string) => void;
  className?: string;
}

const splitShadows = (value?: string): string[] => {
  if (!value) return [];

  const result: string[] = [];
  let depth = 0; // track parentheses depth to ignore commas inside rgb()/rgba()
  let current = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      if (current.trim()) result.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) result.push(current.trim());
  return result;
};

const joinShadows = (values: string[]) => values.join(', ');

const DEFAULT_SHADOW = '1px 1px 2px #000000ff';

export const TextShadowStacker: React.FC<TextShadowStackerProps> = ({ value, onChange, className }) => {
  const initial = useMemo(() => splitShadows(value), [value]);
  const [shadows, setShadows] = useState<string[]>(initial.length ? initial : [DEFAULT_SHADOW]);

  // Keep local state in sync if parent value changes externally
  useEffect(() => {
    const next = splitShadows(value);
    const joinedNext = joinShadows(next.length ? next : [DEFAULT_SHADOW]);
    const joinedCurrent = joinShadows(shadows);
    if (joinedNext !== joinedCurrent) {
      setShadows(next.length ? next : [DEFAULT_SHADOW]);
    }
  }, [value, shadows]);

  // Emit changes to parent only for user-driven updates, not during sync from parent

  const updateAt = useCallback(
    (idx: number, v: string) => {
      setShadows((prev) => {
        const next = prev.map((s, i) => (i === idx ? v : s));
        onChange(joinShadows(next));
        return next;
      });
    },
    [setShadows, onChange],
  );

  const removeAt = useCallback(
    (idx: number) => {
      setShadows((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        const finalNext = next.length ? next : [DEFAULT_SHADOW];
        onChange(joinShadows(finalNext));
        return finalNext;
      });
    },
    [onChange],
  );

  const addNew = useCallback(() => {
    setShadows((prev) => {
      const next = [...prev, DEFAULT_SHADOW];
      onChange(joinShadows(next));
      return next;
    });
  }, [onChange]);

  const move = useCallback(
    (idx: number, delta: number) => {
      setShadows((prev) => {
        const next = [...prev];
        const newIndex = idx + delta;
        if (newIndex < 0 || newIndex >= next.length) return prev;
        const [item] = next.splice(idx, 1);
        next.splice(newIndex, 0, item);
        onChange(joinShadows(next));
        return next;
      });
    },
    [onChange],
  );

  return (
    <StackWrapper className={className}>
      {shadows.map((s, idx) => (
        <ShadowCard key={idx}>
          <CardHeader>
            {shadows.length > 1 && (
              <CardActions>
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === shadows.length - 1} title="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => removeAt(idx)} title="Remove">
                  Remove
                </button>
              </CardActions>
            )}
          </CardHeader>
          <TextShadowPicker value={s} onChange={(v) => updateAt(idx, v)} />
        </ShadowCard>
      ))}

      <Row>
        <FooterActions>
          <button className="button button-secondary" type="button" onClick={addNew}>
            + Add shadow
          </button>
        </FooterActions>
      </Row>
    </StackWrapper>
  );
};
