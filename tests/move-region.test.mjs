import test from 'node:test';
import assert from 'node:assert/strict';
import { moveRegion, setCellStyle, toggleCellLine } from '../lib/stitch.ts';

test('backstitch lines toggle per segment and travel with the region', () => {
  const base = { width: 2, height: 1, cells: [null, null], name: 'lines' };
  let p = toggleCellLine(base, 0, 't', '310');
  p = toggleCellLine(p, 0, 'u', '310');
  assert.deepEqual(p.lines, ['310:tu', null]);
  p = toggleCellLine(p, 0, 't', '321');
  assert.deepEqual(p.lines, ['310:u', null]);
  const moved = moveRegion(p, { x: 0, y: 0, width: 1, height: 1 }, 1, 0);
  assert.deepEqual(moved.lines, [null, '310:u']);
  assert.equal(toggleCellLine(p, 0, 'u', '310').lines[0], null);
});

test('cell styles travel with their stitches', () => {
  const base = {
    width: 3,
    height: 1,
    cells: ['321', null, null],
    name: 'styled',
  };
  const styled = setCellStyle(base, 0, 'tl');
  const moved = moveRegion(styled, { x: 0, y: 0, width: 1, height: 1 }, 2, 0);
  assert.deepEqual(moved.cells, [null, null, '321']);
  assert.deepEqual(moved.styles, [null, null, 'tl']);
});

test('moves stitches inside the region and empties the vacated cells', () => {
  const p = Object.freeze({
    width: 4,
    height: 3,
    cells: Object.freeze([
      '321',
      'Blanc',
      null,
      null,
      null,
      '797',
      null,
      null,
      null,
      null,
      null,
      null,
    ]),
    name: 'move',
  });
  const moved = moveRegion(p, { x: 0, y: 0, width: 2, height: 2 }, 2, 1);
  assert.deepEqual(moved.cells, [
    null,
    null,
    null,
    null,
    null,
    null,
    '321',
    'Blanc',
    null,
    null,
    null,
    '797',
  ]);
  assert.equal(p.cells[0], '321');
});

test('overwrites the destination and keeps empty region cells transparent', () => {
  const p = {
    width: 3,
    height: 1,
    cells: ['321', null, 'Blanc'],
    name: 'overlap',
  };
  assert.deepEqual(
    moveRegion(p, { x: 0, y: 0, width: 2, height: 1 }, 1, 0).cells,
    [null, '321', 'Blanc'],
  );
});

test('stitches shifted past the edge are dropped', () => {
  const p = { width: 2, height: 1, cells: ['321', 'Blanc'], name: 'edge' };
  assert.deepEqual(
    moveRegion(p, { x: 0, y: 0, width: 2, height: 1 }, 1, 0).cells,
    [null, '321'],
  );
});

test('zero offset and empty regions return the same pattern', () => {
  const p = {
    width: 2,
    height: 2,
    cells: ['321', null, null, null],
    name: 'same',
  };
  assert.equal(moveRegion(p, { x: 0, y: 0, width: 2, height: 2 }, 0, 0), p);
  assert.equal(moveRegion(p, { x: 1, y: 1, width: 1, height: 1 }, -1, 0), p);
});

test('fillRegion paints full squares and erasing also clears backstitch', async () => {
  const { fillRegion } = await import('../lib/stitch.ts');
  let p = { width: 3, height: 1, cells: ['321', null, null], name: 't' };
  p = setCellStyle(p, 0, 'tl');
  p = toggleCellLine(p, 1, 't', '310');
  const region = { x: 0, y: 0, width: 2, height: 1 };
  const filled = fillRegion(p, region, '797');
  assert.deepEqual(filled.cells, ['797', '797', null]);
  assert.equal(filled.styles[0], null);
  assert.equal(filled.lines[1], '310:t');
  const erased = fillRegion(filled, region, null);
  assert.deepEqual(erased.cells, [null, null, null]);
  assert.equal(erased.lines[1], null);
});
