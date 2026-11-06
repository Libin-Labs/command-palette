import { createPalette } from '@lp-labs/command-palette';

const palette = createPalette([
  { id: 'save', label: 'Save file', group: 'File', keywords: ['persist'] },
  { id: 'open', label: 'Open folder', group: 'Navigate' },
]);
if (palette.search('persist')[0]?.id !== 'save') throw new Error('Ranking failed');
if (palette.move('first') !== 'save') throw new Error('Navigation failed');

// @ts-expect-error invalid public API input must be rejected
createPalette([], { limit: 'ten' });
