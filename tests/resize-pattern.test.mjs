import test from 'node:test';
import assert from 'node:assert/strict';
import { resizePattern } from '../lib/stitch.ts';

test('growing pads the right and bottom with empty cells', () => {
  const p = Object.freeze({
    width: 2,
    height: 2,
    cells: Object.freeze(['321', null, null, 'Blanc']),
    name: 'grow',
  });
  const grown = resizePattern(p, 3, 3);
  assert.deepEqual(grown, {
    width: 3,
    height: 3,
    name: 'grow',
    cells: ['321', null, null, null, 'Blanc', null, null, null, null],
  });
  assert.equal(p.cells.length, 4);
});

test('shrinking keeps the top-left corner and crops the overflow', () => {
  const p = {
    width: 3,
    height: 2,
    cells: ['321', '743', 'Blanc', null, '797', '699'],
    name: 'crop',
  };
  assert.deepEqual(resizePattern(p, 2, 1).cells, ['321', '743']);
});

test('growing one axis while shrinking the other works', () => {
  const p = {
    width: 2,
    height: 2,
    cells: ['321', 'Blanc', '797', null],
    name: 'mixed',
  };
  assert.deepEqual(resizePattern(p, 1, 3).cells, ['321', '797', null]);
});

test('an unchanged size returns the same pattern', () => {
  const p = { width: 2, height: 1, cells: ['321', null], name: 'same' };
  assert.equal(resizePattern(p, 2, 1), p);
});
