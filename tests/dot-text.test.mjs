import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeDotText } from '../lib/dot-text.ts';

test('文字のドットだけ上書きし、元の図案と空白部分を保持する', () => {
  const pattern = {
    width: 4,
    height: 3,
    name: '図案',
    cells: Array(12).fill('321'),
  };
  const text = { width: 2, height: 2, dots: [true, false, false, true] };
  const result = placeDotText(pattern, text, 2, 1, '310');
  assert.deepEqual(result.cells, [
    '321',
    '321',
    '321',
    '321',
    '321',
    '321',
    '310',
    '321',
    '321',
    '321',
    '321',
    '310',
  ]);
  assert.deepEqual(pattern.cells, Array(12).fill('321'));
  assert.equal(result.name, pattern.name);
});

test('はみ出しや不正な座標で図案を壊さない', () => {
  const pattern = { width: 2, height: 2, name: '', cells: Array(4).fill(null) };
  const text = { width: 2, height: 2, dots: Array(4).fill(true) };
  for (const [x, y] of [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [0.5, 0],
    [NaN, 0],
  ]) {
    assert.throws(() => placeDotText(pattern, text, x, y, '310'));
  }
  assert.deepEqual(pattern.cells, Array(4).fill(null));
});
