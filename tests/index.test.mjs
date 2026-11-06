import test from 'node:test';
import assert from 'node:assert/strict';
import { createPalette } from '../dist/esm/index.js';

const items = [
  { id: 'save', label: 'Save file', group: 'File', keywords: ['persist'] },
  { id: 'export', label: 'Export file', group: 'File', keywords: ['save'] },
  { id: 'open', label: 'Open folder', group: 'Navigate' },
  { id: 'hidden', label: 'Save hidden', disabled: true },
];
test('literal ranking prefers weighted label and respects token coverage', () => {
  const p = createPalette(items);
  assert.deepEqual(p.search('save'), [
    { id: 'save', label: 'Save file', group: 'File', score: 6 },
    { id: 'export', label: 'Export file', group: 'File', score: 1 },
  ]);
  assert.deepEqual(
    p.search('persist file').map((m) => [m.id, m.score]),
    [['save', 4]],
  );
  assert.deepEqual(p.search('sv'), []);
});
test('stable bounded ties and custom weights', () => {
  const p = createPalette(items, { limit: 1, keywordWeight: 10 });
  assert.equal(p.search('save')[0].id, 'export');
  assert.equal(p.search('')[0].id, 'save');
});
test('active keyboard wraps and survives search when present', () => {
  const p = createPalette(items);
  assert.equal(p.active(), 'save');
  assert.equal(p.move('previous'), 'open');
  assert.equal(p.move('next'), 'save');
  assert.equal(p.move('last'), 'open');
  assert.equal(p.move('first'), 'save');
  assert.equal(p.move('next'), 'export');
  p.search('file');
  assert.equal(p.active(), 'export');
  p.search('none');
  assert.equal(p.active(), null);
  assert.equal(p.move('next'), null);
});
test('group snapshots and input copies do not own external mutation', () => {
  const source = [{ id: 'a', label: 'Alpha', keywords: ['first'] }];
  const p = createPalette(source);
  source[0].keywords[0] = 'changed';
  assert.equal(p.search('first').length, 1);
  p.groups()[0].items[0].label = 'corrupt';
  assert.equal(p.groups()[0].items[0].label, 'Alpha');
});
test('replacement recomputes query and invalid replacement is atomic', () => {
  const p = createPalette(items);
  p.search('open');
  assert.throws(
    () =>
      p.replace([
        { id: 'x', label: 'x' },
        { id: 'x', label: 'x' },
      ]),
    TypeError,
  );
  assert.equal(p.active(), 'open');
  p.replace([{ id: 'new', label: 'Open new' }]);
  assert.equal(p.active(), 'new');
});
test('bounds reject invalid options, input, query and keyboard', () => {
  for (const options of [
    { limit: 0 },
    { maxItems: 0 },
    { labelWeight: NaN },
    { keywordWeight: -1 },
  ]) {
    assert.throws(() => createPalette(items, options), RangeError);
  }
  assert.throws(() => createPalette(items, { maxItems: 1 }), RangeError);
  assert.throws(() => createPalette([{ id: '', label: 'x' }]), TypeError);
  const p = createPalette([]);
  assert.throws(() => p.search('a'.repeat(4097)), RangeError);
  assert.throws(() => p.move('unknown'), TypeError);
});
test('query token duplication does not boost score', () => {
  const p = createPalette(items);
  assert.deepEqual(p.search('SAVE save'), p.search('save'));
  assert.deepEqual(p.search('open missing'), []);
});
