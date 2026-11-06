export interface Command {
  id: string;
  label: string;
  keywords?: readonly string[];
  group?: string;
  disabled?: boolean;
}
export interface PaletteOptions {
  limit?: number;
  maxItems?: number;
  labelWeight?: number;
  keywordWeight?: number;
}
export interface Match {
  id: string;
  label: string;
  group: string;
  score: number;
}
export interface Palette {
  search(query: string): Match[];
  move(key: 'next' | 'previous' | 'first' | 'last'): string | null;
  active(): string | null;
  groups(): { group: string; items: Match[] }[];
  replace(items: readonly Command[]): void;
}

/** Literal, case-insensitive token coverage; every query token must match. */
export function createPalette(items: readonly Command[], options: PaletteOptions = {}): Palette {
  const limit = options.limit ?? 20;
  const max = options.maxItems ?? 10000;
  const lw = options.labelWeight ?? 3;
  const kw = options.keywordWeight ?? 1;
  for (const n of [limit, max]) {
    if (!Number.isSafeInteger(n) || n < 1 || n > 100000) throw new RangeError('Invalid bound');
  }
  for (const n of [lw, kw]) {
    if (!Number.isFinite(n) || n < 0 || n > 1000) throw new RangeError('Invalid weight');
  }
  let source: Command[] = [];
  let query = '';
  let matches: Match[] = [];
  let active: string | null = null;
  function search(text: string): Match[] {
    if (typeof text !== 'string' || text.length > 4096) throw new RangeError('Invalid query');
    query = text;
    const tokens = [...new Set(text.toLowerCase().trim().split(/\s+/).filter(Boolean))];
    matches = source
      .flatMap((item) => {
        if (item.disabled) return [];
        const label = item.label.toLowerCase();
        const keywords = (item.keywords ?? []).map((s) => s.toLowerCase());
        let score = 0;
        for (const token of tokens) {
          const labelMatch = label.includes(token);
          const keywordMatch = keywords.some((word) => word.includes(token));
          if (!labelMatch && !keywordMatch) return [];
          score +=
            (labelMatch ? lw * (label.startsWith(token) ? 2 : 1) : 0) + (keywordMatch ? kw : 0);
        }
        return [{ id: item.id, label: item.label, group: item.group ?? '', score }];
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    if (!matches.some((m) => m.id === active)) active = matches[0]?.id ?? null;
    return matches.map((m) => ({ ...m }));
  }
  function replace(next: readonly Command[]): void {
    if (next.length > max) throw new RangeError('Too many commands');
    const ids = new Set<string>();
    const copy = next.map((item) => {
      if (
        typeof item.id !== 'string' ||
        !item.id ||
        ids.has(item.id) ||
        typeof item.label !== 'string' ||
        !item.label ||
        (item.group !== undefined && typeof item.group !== 'string') ||
        (item.disabled !== undefined && typeof item.disabled !== 'boolean') ||
        item.label.length > 4096 ||
        (item.keywords ?? []).some((s) => typeof s !== 'string' || s.length > 4096) ||
        (item.keywords?.length ?? 0) > 100
      )
        throw new TypeError('Invalid command');
      ids.add(item.id);
      return { ...item, keywords: [...(item.keywords ?? [])] };
    });
    source = copy;
    search(query);
  }
  replace(items);
  return {
    search,
    replace,
    active: () => active,
    move(key) {
      if (!['next', 'previous', 'first', 'last'].includes(key)) throw new TypeError('Invalid key');
      const n = matches.length;
      if (!n) return null;
      const index = matches.findIndex((m) => m.id === active);
      const next =
        key === 'first' ? 0 : key === 'last' ? n - 1 : (index + (key === 'next' ? 1 : -1) + n) % n;
      active = matches[next]!.id;
      return active;
    },
    groups() {
      const groups = new Map<string, Match[]>();
      for (const match of matches) {
        const group = groups.get(match.group) ?? [];
        group.push({ ...match });
        groups.set(match.group, group);
      }
      return [...groups].map(([group, items]) => ({ group, items }));
    },
  };
}
