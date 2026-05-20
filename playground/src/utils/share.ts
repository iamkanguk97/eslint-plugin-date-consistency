import type { PluginOptions } from './linter';

interface ShareState {
  code: string;
  options: PluginOptions;
}

export function encodeState(state: ShareState): string {
  return btoa(encodeURIComponent(JSON.stringify(state)));
}

export function decodeState(s: string): ShareState | null {
  try {
    return JSON.parse(decodeURIComponent(atob(s))) as ShareState;
  } catch {
    return null;
  }
}

export function getSharedState(): ShareState | null {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('s');
  if (!s) return null;
  return decodeState(s);
}

export function buildShareUrl(state: ShareState): string {
  const encoded = encodeState(state);
  const url = new URL(window.location.href);
  url.searchParams.set('s', encoded);
  return url.toString();
}
