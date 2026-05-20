// Browser-compatible shim for Node.js `url` module.
// Only fileURLToPath / pathToFileURL are needed by ESLint internals at runtime.

export const URL = globalThis.URL;
export const URLSearchParams = globalThis.URLSearchParams;

export function fileURLToPath(url: string | { pathname: string }): string {
  const pathname = typeof url === 'string' ? new globalThis.URL(url).pathname : url.pathname;
  return decodeURIComponent(pathname);
}

export function pathToFileURL(path: string): URL {
  const normalized = path.startsWith('/') ? path : '/' + path;
  return new globalThis.URL('file://' + normalized);
}

export default { URL, URLSearchParams, fileURLToPath, pathToFileURL };
