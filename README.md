# @lp-labs/command-palette

Bounded literal-token command ranking, grouping and active keyboard navigation.

Standalone original implementation with zero runtime, peer or sibling dependencies.
Library ID 434. ES2022, strict TypeScript, NodeNext ESM and CommonJS with declarations.

## Install

```bash
npm install @lp-labs/command-palette
```

CommonJS: `const { createPalette } = require('@lp-labs/command-palette')`.

## Quickstart

```js
import { createPalette } from '@lp-labs/command-palette';

const palette = createPalette([
  { id: 'save', label: 'Save file', group: 'File', keywords: ['persist'] },
  { id: 'open', label: 'Open folder', group: 'Navigate' },
]);
if (palette.search('persist')[0]?.id !== 'save') throw new Error('Ranking failed');
if (palette.move('first') !== 'save') throw new Error('Navigation failed');
```

## API, customization and contracts

`createPalette(items, options?)` copies the supplied commands and keyword arrays.
Every distinct lowercased whitespace query token must occur as a literal substring in the
label or any keyword. Label matches contribute labelWeight (default 3), doubled for label
prefixes; keyword matches add keywordWeight (default 1). Weights are finite 0..1000.
Equal scores keep source order; disabled commands never appear. No normalization beyond
lowercasing, fuzzy matching or external corpus is used.

`search(query)` returns detached matches and preserves an existing active ID if still present;
otherwise it selects the first result or null. Empty query lists enabled items in source order.
`move('next'|'previous'|'first'|'last')` wraps within the bounded result set.
`active()` returns the current ID or null. `groups()` returns copied groups in first-result
appearance order with score-sorted items. `replace(items)` atomically validates and copies items,
then reruns the current query.

Options: limit defaults to 20, maxItems to 10000 (both integers 1..100000). Query and labels
are bounded to 4096 characters; keywords to 100 per item, each 4096 characters.
Empty/duplicate IDs, invalid labels or keywords and keyboard commands throw TypeError;
invalid bounds, weights and overlong queries throw RangeError.

Copying items costs O(N); construction/replacement also runs the current search.
Search costs O(N * tokens * searchable text + N log N), memory O(N + limit).
Groups and keyboard operations inspect at most limit matches. Groups are metadata, not
hierarchical menus. This is separate from the existing flat selection-model: it ranks an
explicit command corpus and owns only the active result, never item selection.

## Complete public declarations

```ts
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
  groups(): {
    group: string;
    items: Match[];
  }[];
  replace(items: readonly Command[]): void;
}
/** Literal, case-insensitive token coverage; every query token must match. */
export declare function createPalette(items: readonly Command[], options?: PaletteOptions): Palette;
```

## Scope and performance

Supplied-corpus weighted token coverage, not fuzzy search, a UI, an action executor or a hidden command registry.

Complexities and bounds above assume ordinary JavaScript number arithmetic and Map/Set
average constant-time lookup. No runtime or peer dependencies, automatic browser adapters,
global registries or hidden services are included. Importing the module has no browser effects.

## Development

```bash
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
