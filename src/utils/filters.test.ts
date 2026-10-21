import { describe, expect, it } from 'vitest';
import { buildFilterRegex, COMMON_BOT_NAMES, withCommandFilter, withCommonBots, type UserFilterConfig } from './filters';

describe('buildUsernameRegex - per-rule case sensitivity', () => {
  it('contains: case-insensitive when caseSensitive=false', () => {
    const cfg: UserFilterConfig = {
      rules: [{ matchType: 'contains', pattern: 'foo', caseSensitive: false }],
    } as const;
    const re = buildFilterRegex(cfg)!;
    expect(re.test('bar')).toBe(true); // not excluded
    expect(re.test('foobar')).toBe(false); // excluded
    expect(re.test('FOObar')).toBe(false); // excluded due to per-rule insensitivity
  });

  it('contains: case-sensitive when caseSensitive=true', () => {
    const cfg: UserFilterConfig = {
      rules: [{ matchType: 'contains', pattern: 'foo', caseSensitive: true }],
    } as const;
    const re = buildFilterRegex(cfg)!;
    expect(re.test('foobar')).toBe(false); // excluded
    expect(re.test('FOObar')).toBe(true); // not excluded (case mismatch)
  });

  it('exact: applies sensitivity only to that rule', () => {
    const cfg: UserFilterConfig = {
      rules: [{ matchType: 'exact', pattern: 'Alice', caseSensitive: false }],
    } as const;
    const re = buildFilterRegex(cfg)!;
    expect(re.test('Alice')).toBe(false);
    expect(re.test('ALICE')).toBe(false); // excluded via per-rule insensitivity
    expect(re.test('Alice1')).toBe(true); // not exact
  });

  it('wildcard: respects case-sensitive matching', () => {
    const cfg: UserFilterConfig = {
      rules: [{ matchType: 'wildcard', pattern: 'a*e', caseSensitive: true }],
    } as const;
    const re = buildFilterRegex(cfg)!;
    expect(re.test('axe')).toBe(false); // excluded
    expect(re.test('Axe')).toBe(true); // case mismatch, allowed
  });

  it('mixed rules: each rule sensitivity is independent', () => {
    const cfg: UserFilterConfig = {
      rules: [
        { matchType: 'exact', pattern: 'Mod', caseSensitive: true },
        { matchType: 'contains', pattern: 'bot', caseSensitive: false },
      ],
    } as const;
    const re = buildFilterRegex(cfg)!;
    expect(re.test('Mod')).toBe(false); // excluded by exact
    expect(re.test('MOD')).toBe(true); // exact is sensitive, so allowed
    expect(re.test('NightBot')).toBe(false); // excluded by contains (insensitive)
  });
});

describe('withCommonBots', () => {
  it('adds a rule for every common bot to an empty config', () => {
    const cfg = withCommonBots({ rules: [] });
    expect(cfg.rules.map((rule) => rule.pattern)).toEqual(COMMON_BOT_NAMES);
    expect(cfg.rules.every((rule) => rule.matchType === 'exact' && rule.caseSensitive === false)).toBe(true);
  });

  it('keeps existing rules and skips bots that are already hidden, ignoring case', () => {
    const cfg = withCommonBots({ rules: [{ matchType: 'exact', pattern: 'nightbot', caseSensitive: false }] });
    expect(cfg.rules.filter((rule) => rule.pattern.toLowerCase() === 'nightbot')).toHaveLength(1);
    expect(cfg.rules).toHaveLength(COMMON_BOT_NAMES.length);
  });

  it('hides the bots once added', () => {
    const regex = buildFilterRegex(withCommonBots({ rules: [] }))!;
    expect(regex.test('Nightbot')).toBe(false);
    expect(regex.test('Alice')).toBe(true);
  });
});

describe('withCommandFilter', () => {
  it('adds a rule that hides messages starting with an exclamation mark', () => {
    const regex = buildFilterRegex(withCommandFilter({ rules: [] }))!;
    expect(regex.test('!socials')).toBe(false);
    expect(regex.test('hello')).toBe(true);
  });

  it('does not add the rule twice', () => {
    const once = withCommandFilter({ rules: [] });
    expect(withCommandFilter(once).rules).toHaveLength(1);
  });
});
