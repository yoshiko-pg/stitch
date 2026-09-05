import test from 'node:test';
import assert from 'node:assert/strict';
import {
  route,
  quantize,
  sample,
  threads,
  colorRuns,
  optimizeColor,
} from '../lib/stitch.ts';
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

// Independent exhaustive oracle: enumerate every run order and both directions.
function bruteCost(p) {
  const groups = [];
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++) {
      if (!p.cells[y * p.width + x]) continue;
      const cells = [];
      while (x < p.width && p.cells[y * p.width + x]) {
        cells.push(y * p.width + x);
        x++;
      }
      x--;
      groups.push(cells);
    }
  let best = Infinity;
  function search(remaining, previous, cost) {
    if (!remaining.length) {
      best = Math.min(best, cost);
      return;
    }
    for (const id of remaining)
      for (const reverse of [false, true]) {
        const cells = reverse ? [...groups[id]].reverse() : groups[id];
        const stitches = [];
        for (const upper of [false, true])
          for (const cell of upper ? [...cells].reverse() : cells) {
            const x = cell % p.width,
              y = Math.floor(cell / p.width);
            let a = upper ? [x + 1, y] : [x, y],
              b = upper ? [x, y + 1] : [x + 1, y + 1];
            if (reverse) [a, b] = [b, a];
            stitches.push([a, b]);
          }
        let prev = previous,
          total = cost;
        stitches.forEach(([a, b], i) => {
          if (!i && prev && a[0] === prev[0] && a[1] === prev[1])
            [a, b] = [b, a];
          if (prev) {
            const d = Math.hypot(a[0] - prev[0], a[1] - prev[1]);
            total += !i && d > 3 ? 1e6 : d;
          }
          prev = b;
        });
        search(
          remaining.filter((v) => v !== id),
          prev,
          total,
        );
      }
  }
  search(
    groups.map((_, i) => i),
    null,
    0,
  );
  return best;
}
test('exact DP agrees with exhaustive permutations and directions', () => {
  for (const cells of [
    [
      '321',
      '321',
      null,
      null,
      '321',
      null,
      null,
      '321',
      null,
      null,
      '321',
      '321',
    ],
    [
      '321',
      null,
      '321',
      null,
      null,
      '321',
      null,
      null,
      '321',
      null,
      null,
      null,
    ],
  ]) {
    const p = { width: 6, height: 2, cells, name: 'oracle' };
    const result = optimizeColor(p, '321');
    assert.equal(result.exact, true);
    assert.ok(
      Math.abs(
        result.after.cuts * 1e6 + result.after.backLength - bruteCost(p),
      ) < 1e-6,
    );
    verify(p);
  }
});
test('heuristic connects nearby regions and never worsens the baseline', () => {
  const p = {
    width: 14,
    height: 6,
    name: 'two columns',
    cells: Array.from({ length: 84 }, (_, i) =>
      [0, 1, 10, 11].includes(i % 14) ? '321' : null,
    ),
  };
  const result = optimizeColor(p, '321');
  assert.equal(result.exact, false);
  assert.ok(result.after.cuts < result.before.cuts);
  assert.ok(
    result.after.cuts * 1e6 + result.after.backLength <=
      result.before.cuts * 1e6 + result.before.backLength + 1e-6,
  );
  verify(p);
});
test('bounded large-image search preserves every stitch and objective', () => {
  const p = {
    width: 32,
    height: 20,
    name: 'many islands',
    cells: Array.from({ length: 640 }, (_, i) =>
      (i % 32) % 3 === 0 ? '321' : null,
    ),
  };
  const result = optimizeColor(p, '321');
  assert.equal(result.exact, false);
  assert.ok(
    result.after.cuts * 1e6 + result.after.backLength <=
      result.before.cuts * 1e6 + result.before.backLength + 1e-6,
  );
  verify(p);
});
