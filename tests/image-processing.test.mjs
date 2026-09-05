import test from 'node:test';
import assert from 'node:assert/strict';
import {
  representativePixels,
  simplifySpeckles,
} from '../lib/image-processing.ts';
const white = [255, 255, 255, 255],
  black = [0, 0, 0, 255];
test('flat image boundary creates no intermediate colours', () => {
  const src = new Uint8ClampedArray([
    ...white,
    ...white,
    ...black,
    ...black,
    ...white,
    ...white,
    ...black,
    ...black,
  ]);
  const out = representativePixels(src, 4, 2, 3, 1);
  for (let i = 0; i < out.length; i += 4)
    assert.ok(
      [0, 255].includes(out[i]) &&
        out[i] === out[i + 1] &&
        out[i] === out[i + 2],
    );
  assert.deepEqual(Array.from(out.slice(0, 4)), white);
  assert.deepEqual(Array.from(out.slice(8)), black);
});
test('dominant area wins rather than average or a single centre sample', () => {
  const out = representativePixels(
    new Uint8ClampedArray([...white, ...black, ...white]),
    3,
    1,
    1,
    1,
  );
  assert.deepEqual(Array.from(out), white);
});
test('transparent pixels do not tint the output', () => {
  assert.deepEqual(
    Array.from(
      representativePixels(
        new Uint8ClampedArray([255, 0, 0, 0, ...white, ...white]),
        3,
        1,
        1,
        1,
      ),
    ),
    white,
  );
  assert.equal(
    representativePixels(
      new Uint8ClampedArray([255, 0, 0, 0, 255, 0, 0, 0, ...white]),
      3,
      1,
      1,
      1,
    )[3],
    0,
  );
});
test('output representatives are original RGB samples even with similar shades', () => {
  const colors = [
    [250, 250, 250, 255],
    [253, 253, 253, 255],
    [245, 245, 245, 255],
  ];
  const out = representativePixels(
    new Uint8ClampedArray(colors.flat()),
    3,
    1,
    1,
    1,
  );
  assert.ok(colors.some((c) => c.slice(0, 3).every((v, i) => v === out[i])));
});
const island = (color) => ({
  width: 3,
  height: 3,
  cells: Array.from({ length: 9 }, (_, i) => (i === 4 ? color : 'Blanc')),
  name: 'test',
});
test('cleanup merges similar enclosed speckle, without mutating input', () => {
  const p = island('3865');
  assert.equal(simplifySpeckles(p, 1).cells[4], 'Blanc');
  assert.equal(p.cells[4], '3865');
  assert.equal(simplifySpeckles(p, 0), p);
});
test('cleanup preserves high-contrast eyes, open edges and larger details', () => {
  assert.equal(simplifySpeckles(island('310'), 2).cells[4], '310');
  const p = island('3865');
  p.cells[1] = null;
  assert.equal(simplifySpeckles(p, 2).cells[4], '3865');
  const q = {
    width: 5,
    height: 5,
    name: 'large',
    cells: Array.from({ length: 25 }, (_, i) =>
      [11, 12, 13].includes(i) ? '3865' : 'Blanc',
    ),
  };
  assert.equal(
    simplifySpeckles(q, 2).cells.filter((c) => c === '3865').length,
    3,
  );
});
