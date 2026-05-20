export function normalizePackageName(source: string): string {
  if (source.startsWith('@')) {
    const parts = source.split('/');
    return parts.slice(0, 2).join('/');
  }
  return source.split('/')[0];
}

export function isDateLibImport(source: string, libs: string[]): boolean {
  return libs.includes(normalizePackageName(source));
}
