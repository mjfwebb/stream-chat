// User/message filter utilities: schema, compiler, and URL (de)serialization

export type MatchType = 'exact' | 'contains' | 'wildcard';

export type UserFilterRule = {
  // Exclude-only rules
  matchType: MatchType;
  pattern: string;
  caseSensitive?: boolean; // default false
};

export type UserFilterConfig<Rule extends UserFilterRule = UserFilterRule> = {
  rules: Rule[];
};

export const EMPTY_FILTER_CONFIG: UserFilterConfig = { rules: [] };

// Escape regex metacharacters
const reEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Convert a single rule into a regex body string
function ruleToBody(rule: UserFilterRule): string {
  const raw = rule.pattern ?? '';
  switch (rule.matchType) {
    case 'exact':
      return `^${reEscape(raw)}$`;
    case 'contains':
      return `${reEscape(raw)}`;
    case 'wildcard': {
      // Convert user wildcard to safe regex:
      //   * -> .*
      //   ? -> .
      let body = raw
        .split('')
        .map((ch) => {
          if (ch === '*') return '__STAR__';
          if (ch === '?') return '__Q__';
          return reEscape(ch);
        })
        .join('');
      body = body.split('__STAR__').join('.*').split('__Q__').join('.');
      return `^${body}$`;
    }
    default:
      return `${reEscape(raw)}`;
  }
}

// Transform a pattern to behave case-insensitively without using the global 'i' flag.
// This keeps case sensitivity configurable per rule by expanding ASCII letters.
function toCaseInsensitive(body: string): string {
  return body.replace(/[A-Za-z]/g, (ch) => {
    const lo = ch.toLowerCase();
    const up = ch.toUpperCase();
    // non-alphabetic or non-ASCII
    if (lo === up) {
      return ch;
    }
    // Use a simple character class for the two cases
    return `[${lo}${up}]`;
  });
}

// Build final regex from exclude-only rules with per-rule case sensitivity.
// We construct chained negative lookaheads, one per rule, anchored at ^ ... .*$
export function buildFilterRegex(cfg: UserFilterConfig): RegExp | null {
  if (!cfg || !Array.isArray(cfg.rules) || cfg.rules.length === 0) {
    return null;
  }

  const lookaheads: string[] = [];

  for (const r of cfg.rules) {
    if (!r || !r.pattern?.length) {
      continue;
    }
    let body = ruleToBody(r);
    // Apply per-rule case handling by expanding letters for insensitive rules
    if (!r.caseSensitive) {
      body = toCaseInsensitive(body);
    }
    // Make 'contains' rules match anywhere within the string
    if (r.matchType === 'contains') {
      body = `.*${body}.*`;
    }
    lookaheads.push(`(?!${body})`);
  }

  if (lookaheads.length === 0) {
    return null;
  }

  // Chain all negative lookaheads so all rules must not match
  const body = `^${lookaheads.join('')}.*$`;

  try {
    return new RegExp(body);
  } catch {
    return null;
  }
}

// Base64url helpers with browser/Node compatibility
function toBase64(s: string): string {
  return btoa(s);
}

function fromBase64(s: string): string {
  return atob(s);
}

export function toBase64Url(s: string): string {
  return toBase64(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function fromBase64Url(s: string): string {
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) {
    t += '=';
  }
  return fromBase64(t);
}

export function encodeFiltersToUrl(cfg: UserFilterConfig): string {
  try {
    const json = JSON.stringify(cfg ?? EMPTY_FILTER_CONFIG);
    // If empty config, return empty string to avoid cluttering URL
    if (json === JSON.stringify(EMPTY_FILTER_CONFIG)) {
      return '';
    }
    return toBase64Url(json);
  } catch {
    return '';
  }
}

// Rules can carry extra fields, such as the color of a highlight rule. They pass through unchanged.
export function decodeFiltersFromUrl<Rule extends UserFilterRule = UserFilterRule>(b64u: string | null | undefined): UserFilterConfig<Rule> {
  const empty = EMPTY_FILTER_CONFIG as UserFilterConfig<Rule>;
  if (!b64u) {
    return empty;
  }
  try {
    const json = fromBase64Url(b64u);
    const parsed = JSON.parse(json) as UserFilterConfig<Rule>;
    if (!parsed || !Array.isArray(parsed.rules)) {
      return empty;
    }
    return parsed;
  } catch {
    return empty;
  }
}

// Bots that many channels run. The "common bots" preset hides their messages.
export const COMMON_BOT_NAMES = ['Nightbot', 'StreamElements', 'Streamlabs', 'Moobot', 'Fossabot', 'WizeBot'];

/** Adds a username rule for each common bot that the config does not hide yet. */
export function withCommonBots(cfg: UserFilterConfig): UserFilterConfig {
  const hidden = new Set(cfg.rules.filter((rule) => rule.matchType === 'exact').map((rule) => rule.pattern.toLowerCase()));
  const added: UserFilterRule[] = COMMON_BOT_NAMES.filter((name) => !hidden.has(name.toLowerCase())).map((name) => ({
    matchType: 'exact',
    pattern: name,
    caseSensitive: false,
  }));
  return { rules: [...cfg.rules, ...added] };
}

/** Adds a message rule that hides chat commands, such as !socials. It does nothing when the rule is already there. */
export function withCommandFilter(cfg: UserFilterConfig): UserFilterConfig {
  const alreadyThere = cfg.rules.some((rule) => rule.matchType === 'wildcard' && rule.pattern === '!*');
  return alreadyThere ? cfg : { rules: [...cfg.rules, { matchType: 'wildcard', pattern: '!*', caseSensitive: false }] };
}
