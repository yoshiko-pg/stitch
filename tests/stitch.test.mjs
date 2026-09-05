import test from 'node:test';
import assert from 'node:assert/strict';
import { route, quantize, sample, threads, colorRuns } from '../lib/stitch.ts';
function verify(p) {
  const steps = route(p);
  assert.equal(steps.length, p.cells.filter(Boolean).length * 2);
  const marks = new Map();
  for (const s of steps) {
    assert.equal(s.color, p.cells[s.cell]);
    assert.ok(s.from.every((v, i) => v >= 0 && v <= [p.width, p.height][i]));
    assert.ok(s.to.every((v, i) => v >= 0 && v <= [p.width, p.height][i]));
    assert.equal(Math.abs(s.from[0] - s.to[0]), 1);
    assert.equal(Math.abs(s.from[1] - s.to[1]), 1);
    const x = s.cell % p.width,
      y = Math.floor(s.cell / p.width);
    assert.equal(Math.min(s.from[0], s.to[0]), x);
    assert.equal(Math.min(s.from[1], s.to[1]), y);
    const m = marks.get(s.cell) || [];
    m.push((s.to[0] - s.from[0]) * (s.to[1] - s.from[1]));
    marks.set(s.cell, m);
  }
  for (const m of marks.values()) assert.deepEqual(m, [1, -1]);
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].color === steps[i - 1].color)
      assert.notDeepEqual(
        steps[i].from,
        steps[i - 1].to,
        'must not undo previous stitch through the same hole',
      );
  }
  return steps;
}
test('every occupancy combination of a 3×3 pattern covers both diagonals exactly once', () => {
  for (let bits = 0; bits < 512; bits++)
    verify({
      width: 3,
      height: 3,
      name: 'test',
      cells: Array.from({ length: 9 }, (_, i) =>
        bits & (1 << i) ? '321' : null,
      ),
    });
});
test('mixed colours, isolated cells and sampler preserve complete coverage', () => {
  verify(sample());
  for (let n = 0; n < 100; n++)
    verify({
      width: 8,
      height: 8,
      name: 'test',
      cells: Array.from(
        { length: 64 },
        (_, i) => [null, '321', '797', 'Blanc'][(i * 17 + n * 11 + i * i) % 4],
      ),
    });
});
test('runs explicitly return and long gaps require cutting', () => {
  const s = verify({
    width: 8,
    height: 2,
    name: 'test',
    cells: [
      '321',
      '321',
      null,
      null,
      null,
      null,
      null,
      '321',
      ...Array(8).fill(null),
    ],
  });
  assert.deepEqual(
    s.map((s) => s.kind),
    ['start', 'forward', 'turn', 'return', 'cut', 'turn'],
  );
  assert.equal(s[2].from[0], 2);
  assert.equal(s[2].to[0], 1);
});
test('short moves are identified and colour changes start new thread', () => {
  const s = verify({
    width: 2,
    height: 2,
    name: 'test',
    cells: ['321', null, '321', '797'],
  });
  assert.ok(s.some((s) => s.kind === 'jump'));
  assert.equal(s.filter((s) => s.kind === 'start').length, 2);
});
test('palette limit, actual thread numbers and alpha holes are preserved', () => {
  const d = new Uint8ClampedArray([
    255, 0, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255, 0, 0, 0, 0,
  ]);
  for (const count of [1, 2, 3]) {
    const p = quantize(d, 2, 2, count, 'test');
    assert.ok(new Set(p.cells.filter(Boolean)).size <= count);
    assert.equal(p.cells[3], null);
    assert.ok(
      p.cells.filter(Boolean).every((id) => threads.some((t) => t.id === id)),
    );
    verify(p);
  }
});
test('empty and transparent images have no steps', () => {
  assert.deepEqual(
    route({ width: 1, height: 1, cells: [null], name: 'empty' }),
    [],
  );
  assert.deepEqual(
    quantize(new Uint8ClampedArray(16), 2, 2, 8, 'empty').cells,
    [null, null, null, null],
  );
});

test('lower backslash and upper slash use the expected holes', () => {
  const s = route({ width: 1, height: 1, cells: ['321'], name: 'one' });
  assert.deepEqual(
    s.map((s) => [s.from, s.to]),
    [
      [
        [0, 0],
        [1, 1],
      ],
      [
        [1, 0],
        [0, 1],
      ],
    ],
  );
});
test('stacked rows never immediately exit through the last entry hole', () => {
  verify({ width: 2, height: 3, cells: Array(6).fill('321'), name: 'stacked' });
});
test('overview groups share exact guide coordinates and continuous numbering', () => {
  const p = sample();
  for (const t of threads) {
    const runs = colorRuns(p, t.id),
      expected = route(p).filter((s) => s.color === t.id);
    const flattened = runs.flatMap((r) => r.steps);
    assert.deepEqual(
      flattened.map(({ needleNumber: _needleNumber, ...s }) => s),
      expected,
    );
    assert.deepEqual(
      flattened.map((s) => s.needleNumber),
      flattened.map((_, i) => i + 1),
    );
    for (const run of runs) {
      const half = run.steps.length / 2;
      assert.equal(run.steps[half].kind, 'turn');
      assert.deepEqual(
        run.steps.slice(0, half).map((s) => s.cell),
        run.steps
          .slice(half)
          .map((s) => s.cell)
          .reverse(),
      );
    }
  }
  assert.deepEqual(colorRuns(p, 'not-a-thread'), []);
});
