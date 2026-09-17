import test from 'node:test';
import assert from 'node:assert/strict';
import { doublePattern } from '../lib/stitch.ts';

test('every cell becomes a 2×2 block', () => {
  const p = Object.freeze({
    width: 2,
    height: 1,
    cells: Object.freeze(['321', null]),
    name: 'double',
  });
  const doubled = doublePattern(p);
  assert.equal(doubled.width, 4);
  assert.equal(doubled.height, 2);
  assert.deepEqual(doubled.cells, [
    '321',
    '321',
    null,
    null,
    '321',
    '321',
    null,
    null,
  ]);
  assert.equal(doubled.styles, undefined);
  assert.equal(doubled.lines, undefined);
});

test('triangles and backstitch lines keep their shape', () => {
  const doubled = doublePattern({
    width: 1,
    height: 1,
    cells: ['321'],
    styles: ['tl'],
    lines: ['310:tdu'],
    name: 'shape',
  });
  assert.deepEqual(doubled.cells, ['321', '321', '321', null]);
  assert.deepEqual(doubled.styles, [null, 'tl', 'tl', null]);
  assert.deepEqual(doubled.lines, ['310:td', '310:tu', '310:u', '310:d']);
});
