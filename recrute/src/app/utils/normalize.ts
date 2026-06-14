/** Lowercase + strip accents for case/accent-insensitive comparisons. */
export function norm(s: string | null | undefined): string {
  if (!s) return '';
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
