import { useState } from 'react';

import './SourceUrl.less';

/** Shows an overlay URL with parameter names highlighted and the access token hidden. Click to show the whole URL. */
export const SourceUrl = ({ url }: { url: string }) => {
  const [open, setOpen] = useState(false);

  let origin = url;
  let entries: [string, string][] = [];
  try {
    const parsed = new URL(url);
    origin = `${parsed.origin}${parsed.pathname}?`;
    entries = Array.from(parsed.searchParams.entries());
  } catch {
    // Not a URL yet: show the raw text.
  }

  return (
    <button
      type="button"
      className={`source-url ${open ? 'source-url-open' : ''}`}
      onClick={() => setOpen((o) => !o)}
      title="Click to show the whole URL"
    >
      <span className="source-url-muted">{origin}</span>
      {entries.map(([key, value], idx) => (
        <span key={key}>
          {idx > 0 && <span className="source-url-muted">&amp;</span>}
          <span className="source-url-key">{key}</span>=
          {key === 'access_token' ? <span className="source-url-muted">••••••••</span> : encodeURIComponent(value)}
        </span>
      ))}
    </button>
  );
};
