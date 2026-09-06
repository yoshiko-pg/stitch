import test from 'node:test';
import assert from 'node:assert/strict';
import { trimPattern, route } from '../lib/stitch.ts';

test('trim removes outer margins while preserving white thread and interior empty rows', () => {
  const cells = Array(42).fill(null);
  cells[1 * 7 + 2] = 'Blanc';
  cells[1 * 7 + 4] = '321';
  cells[3 * 7 + 3] = '797';
  const p = Object.freeze({
    width: 7,
    height: 6,
    cells: Object.freeze(cells),
    name: 'bird',
  });
  const cropped = trimPattern(p);
  assert.deepEqual(cropped, {
    width: 3,
    height: 3,
    name: 'bird',
    cells: ['Blanc', null, '321', null, null, null, null, '797', null],
  });
  assert.equal(p.cells.length, 42);
  assert.equal(route(cropped).length, 6);
  assert.equal(trimPattern(cropped), cropped);
});

test('empty and already tight patterns are unchanged', () => {
  for (const cells of [
    Array(6).fill(null),
    ['321', null, null, null, null, 'Blanc'],
  ]) {
    const p = { width: 3, height: 2, cells, name: 'unchanged' };
    assert.equal(trimPattern(p), p);
  }
});

test('one occupied corner becomes a valid single-cell pattern', () => {
  const p = {
    width: 3,
    height: 2,
    cells: [null, null, null, null, null, '321'],
    name: 'one',
  };
  assert.deepEqual(trimPattern(p), {
    width: 1,
    height: 1,
    cells: ['321'],
    name: 'one',
  });
});
