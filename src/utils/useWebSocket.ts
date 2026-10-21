import useWebSocketDefault from 'react-use-websocket';

type UseWebSocket = typeof useWebSocketDefault;

// react-use-websocket is a CommonJS package whose default export is the hook. Vite 8 hands over the whole module instead
// of the hook when it bundles a CommonJS default import, so read the hook from its `default` property in that case.
export const useWebSocket: UseWebSocket =
  typeof useWebSocketDefault === 'function' ? useWebSocketDefault : (useWebSocketDefault as unknown as { default: UseWebSocket }).default;
