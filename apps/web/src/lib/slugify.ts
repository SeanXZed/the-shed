/** URL-safe studio slug with short suffix to reduce collisions. */
export function slugifyStudioName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'studio';
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
