/** Regional Portuguese variants intentionally share the European Portuguese catalogue. */
export function normalizeWebsiteLanguage(language: string | null | undefined): string {
  return (language || '').trim().toLowerCase().replace(/_/g, '-').split('-')[0];
}

export function selectWebsiteLanguage(saved: string | null, deviceLanguages: readonly string[], enabled: readonly string[]): string {
  const available = [...new Set(enabled.map(normalizeWebsiteLanguage).filter(Boolean))];
  const preferred = normalizeWebsiteLanguage(saved);
  // Keep an explicit visitor choice ahead of the device preference.
  if (available.includes(preferred)) return preferred;
  for (const deviceLanguage of deviceLanguages) {
    const language = normalizeWebsiteLanguage(deviceLanguage);
    if (available.includes(language)) return language;
  }
  return available.includes('en') ? 'en' : available[0] || 'en';
}
