export type Thread = { id: string; name: string; hex: string };
// DMC numbers identify actual Mouliné Spécial threads. RGB values are approximate display swatches.
export const threads: Thread[] = [
  ["Blanc", "白", "f5f4ed"],
  ["310", "黒", "252528"],
  ["318", "ライトグレー", "a5a5a5"],
  ["414", "ダークグレー", "666971"],
  ["321", "赤", "bb2439"],
  ["666", "ブライトレッド", "e33139"],
  ["761", "ライトサーモン", "f5b6b7"],
  ["3716", "ピンク", "f2a0b2"],
  ["814", "ワイン", "722438"],
  ["740", "オレンジ", "f78026"],
  ["743", "イエロー", "f8d77a"],
  ["444", "レモン", "f1cd25"],
  [" Ecru", "生成り", "e8dfc3"],
  ["801", "ダークブラウン", "69412f"],
  ["433", "ブラウン", "835a3b"],
  ["435", "ライトブラウン", "ba8959"],
  ["3865", "ウィンターホワイト", "f5f1e7"],
  ["469", "オリーブ", "728144"],
  ["470", "ライトオリーブ", "95a64d"],
  ["3347", "グリーン", "71935c"],
  ["699", "深緑", "17663c"],
  ["702", "ケリーグリーン", "399447"],
  ["3846", "ターコイズ", "36b8bd"],
  ["3810", "ブルーグリーン", "488f92"],
  ["597", "ライトターコイズ", "78b8c4"],
  ["3755", "ベビーブルー", "91b7d5"],
  ["798", "ブルー", "5276aa"],
  ["797", "ロイヤルブルー", "354e91"],
  ["820", "ネイビー", "263460"],
  ["550", "バイオレット", "64396f"],
  ["552", "パープル", "9460a0"],
  ["153", "ライトバイオレット", "dfc5e4"],
].map(([id, name, hex]) => ({ id: id.trim(), name, hex: "#" + hex }));
export type Pattern = {
  width: number;
  height: number;
  cells: (string | null)[];
  name: string;
};
export type Point = [number, number];
/** Remove only empty outer rows/columns; keep interior gaps and every thread. */
export function trimPattern(p: Pattern): Pattern {
  let left = p.width,
    top = p.height,
    right = -1,
    bottom = -1;
  p.cells.forEach((color, cell) => {
    if (color === null) return;
    const x = cell % p.width,
      y = Math.floor(cell / p.width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  });
  if (
    right < 0 ||
    (left === 0 &&
      top === 0 &&
      right === p.width - 1 &&
      bottom === p.height - 1)
  )
    return p;
  const cells: Pattern["cells"] = [];
  for (let y = top; y <= bottom; y++)
    cells.push(...p.cells.slice(y * p.width + left, y * p.width + right + 1));
  return { ...p, width: right - left + 1, height: bottom - top + 1, cells };
}
export type Region = { x: number; y: number; width: number; height: number };
/** Shift every stitch inside the region; vacated cells empty, covered cells are overwritten. */
export function moveRegion(
  p: Pattern,
  region: Region,
  dx: number,
  dy: number,
): Pattern {
  if (dx === 0 && dy === 0) return p;
  const cells = [...p.cells];
  const moved: [number, number, string][] = [];
  for (let y = region.y; y < region.y + region.height; y++)
    for (let x = region.x; x < region.x + region.width; x++) {
      const color = p.cells[y * p.width + x];
      if (color === null) continue;
      cells[y * p.width + x] = null;
      moved.push([x + dx, y + dy, color]);
    }
  let changed = false;
  for (const [x, y, color] of moved) {
    if (x < 0 || y < 0 || x >= p.width || y >= p.height) continue;
    const cell = y * p.width + x;
    if (p.cells[cell] !== color) changed = true;
    cells[cell] = color;
  }
  if (!changed && cells.every((c, i) => c === p.cells[i])) return p;
  return { ...p, cells };
}
/** Change the canvas size, keeping stitches anchored top-left; overflow is cropped. */
export function resizePattern(
  p: Pattern,
  width: number,
  height: number,
): Pattern {
  if (width === p.width && height === p.height) return p;
  const cells: Pattern["cells"] = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      cells.push(x < p.width && y < p.height ? p.cells[y * p.width + x] : null);
  return { ...p, width, height, cells };
}
export type Stitch = {
  color: string;
  cell: number;
  from: Point;
  to: Point;
  kind: "start" | "forward" | "turn" | "return" | "jump" | "cut";
  travel: number;
};
export function baselineRoute(p: Pattern): Stitch[] {
  const result: Stitch[] = [];
  for (const color of [...new Set(p.cells.filter(Boolean))] as string[]) {
    let previous: Point | undefined;
    for (let y = 0; y < p.height; y++)
      for (let x = 0; x < p.width; x++) {
        if (p.cells[y * p.width + x] !== color) continue;
        const start = x;
        while (x + 1 < p.width && p.cells[y * p.width + x + 1] === color) x++;
        const end = x;
        for (let a = start; a <= end; a++) {
          let from: Point = [a, y],
            to: Point = [a + 1, y + 1];
          // Never exit the hole just entered: it would undo the previous stitch.
          // Reversing this diagonal preserves the lower \ while choosing another exit.
          if (previous && from[0] === previous[0] && from[1] === previous[1]) {
            [from, to] = [to, from];
          }
          const travel = previous
            ? Math.hypot(from[0] - previous[0], from[1] - previous[1])
            : 0;
          const kind = !previous
            ? "start"
            : a === start
              ? travel > 3
                ? "cut"
                : "jump"
              : "forward";
          result.push({ color, cell: y * p.width + a, from, to, kind, travel });
          previous = to;
        }
        for (let a = end; a >= start; a--) {
          const from: Point = [a + 1, y],
            to: Point = [a, y + 1];
          result.push({
            color,
            cell: y * p.width + a,
            from,
            to,
            kind: a === end ? "turn" : "return",
            travel: Math.hypot(from[0] - previous![0], from[1] - previous![1]),
          });
          previous = to;
        }
      }
  }
  return result;
}
type Variant = Stitch[];
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function variants(p: Pattern, color: string): Variant[] {
  const groups: Stitch[][] = [];
  for (const s of baselineRoute(p).filter((s) => s.color === color)) {
    if (["start", "jump", "cut"].includes(s.kind)) groups.push([]);
    groups.at(-1)!.push(s);
  }
  return groups.flatMap((group) => {
    const cells = group.slice(0, group.length / 2).map((s) => s.cell);
    return [false, true].map((reverse) => {
      const ordered = reverse ? [...cells].reverse() : cells;
      const result: Stitch[] = [];
      for (const upper of [false, true])
        for (const cell of upper ? [...ordered].reverse() : ordered) {
          const x = cell % p.width,
            y = Math.floor(cell / p.width);
          let from: Point = upper ? [x + 1, y] : [x, y];
          let to: Point = upper ? [x, y + 1] : [x + 1, y + 1];
          if (reverse) [from, to] = [to, from];
          result.push({
            cell,
            color,
            from,
            to,
            kind:
              result.length === 0
                ? "start"
                : upper
                  ? result.length === cells.length
                    ? "turn"
                    : "return"
                  : "forward",
            travel: 0,
          });
        }
      return result;
    });
  });
}
// Keep each edge-connected region together, visiting its runs top-to-bottom,
// then left-to-right. Union adjacent rows through their occupied cells so a
// split row that rejoins below still belongs to the same region.
function readingOrder(
  vs: Variant[],
  width: number,
  cellCount: number,
): number[] {
  const n = vs.length / 2;
  const parents = Array.from({ length: n }, (_, i) => i);
  const owner = new Int32Array(cellCount);
  owner.fill(-1);
  function root(id: number): number {
    while (parents[id] !== id) {
      parents[id] = parents[parents[id]];
      id = parents[id];
    }
    return id;
  }
  for (let id = 0; id < n; id++) {
    const run = vs[id * 2];
    for (let i = 0; i < run.length / 2; i++) {
      const cell = run[i].cell;
      owner[cell] = id;
      if (cell >= width && owner[cell - width] !== -1)
        parents[root(id)] = root(owner[cell - width]);
    }
  }
  const regions = new Map<number, number[]>();
  for (let id = 0; id < n; id++) {
    const key = root(id);
    if (!regions.has(key)) regions.set(key, []);
    regions.get(key)!.push(id);
  }
  return [...regions.values()].flat();
}
function enter(v: Variant, previous?: Point): Stitch[] {
  const copy = v.map((s) => ({ ...s }));
  if (previous && distance(previous, copy[0].from) === 0)
    [copy[0].from, copy[0].to] = [copy[0].to, copy[0].from];
  copy.forEach((s, i) => {
    const prev = i ? copy[i - 1].to : previous;
    s.travel = prev ? distance(prev, s.from) : 0;
    if (!i) s.kind = !prev ? "start" : s.travel > 3 ? "cut" : "jump";
  });
  return copy;
}
export function routeMetrics(steps: Stitch[]) {
  return {
    cuts: steps.filter((s) => s.kind === "cut").length,
    backLength: steps.reduce(
      (sum, s) => sum + (["cut", "start"].includes(s.kind) ? 0 : s.travel),
      0,
    ),
  };
}
// Lexicographic objective: cuts first, then actual back-thread length (cut gaps excluded).
// This weight exceeds the maximum possible back-thread length of a 120×120 pattern.
const CUT_WEIGHT = 1_000_000;
function score(steps: Stitch[]) {
  const m = routeMetrics(steps);
  return m.cuts * CUT_WEIGHT + m.backLength;
}
export type Optimization = {
  steps: Stitch[];
  before: ReturnType<typeof routeMetrics>;
  after: ReturnType<typeof routeMetrics>;
  /** Directions are optimal for the fixed region/row order, not all permutations. */
  exact: boolean;
  runs: number;
};
const optimizationCache = new WeakMap<Pattern, Map<string, Optimization>>();
export function optimizeColor(p: Pattern, color: string): Optimization {
  let cache = optimizationCache.get(p);
  if (!cache) {
    cache = new Map();
    optimizationCache.set(p, cache);
  }
  const cached = cache.get(color);
  if (cached) return cached;
  const vs = variants(p, color),
    n = vs.length / 2;
  const base = baselineRoute(p).filter((s) => s.color === color);
  if (!n) {
    const empty = {
      steps: [],
      before: routeMetrics([]),
      after: routeMetrics([]),
      exact: true,
      runs: 0,
    };
    cache.set(color, empty);
    return empty;
  }
  const internal = vs.map((v) => score(enter(v)));
  const edge = (a: number, b: number) => {
    const v = vs[b],
      previous = vs[a].at(-1)!.to;
    let from = v[0].from,
      to = v[0].to;
    if (distance(previous, from) === 0) [from, to] = [to, from];
    const gap = distance(previous, from);
    const delta = distance(to, v[1].from) - distance(v[0].to, v[1].from);
    return internal[b] + delta + (gap > 3 ? CUT_WEIGHT : gap);
  };
  const runs = readingOrder(vs, p.width, p.cells.length);
  // The run order expresses readability. Optimize only the two entry directions
  // along that order; never trade skipped rows for a shorter thread.
  // State: (run position, direction). Each transition uses the actual holes,
  // including the first-diagonal reversal needed to avoid undoing a stitch.
  const parents = new Int8Array(n * 2);
  let costs = [internal[runs[0] * 2], internal[runs[0] * 2 + 1]];
  for (let i = 1; i < n; i++) {
    const nextCosts = [Infinity, Infinity];
    for (let direction = 0; direction < 2; direction++) {
      const next = runs[i] * 2 + direction;
      for (let previous = 0; previous < 2; previous++) {
        const cost = costs[previous] + edge(runs[i - 1] * 2 + previous, next);
        if (cost < nextCosts[direction] - 1e-8) {
          nextCosts[direction] = cost;
          parents[i * 2 + direction] = previous;
        }
      }
    }
    costs = nextCosts;
  }
  const order = Array.from({ length: n }, () => 0);
  let direction = costs[1] < costs[0] - 1e-8 ? 1 : 0;
  for (let i = n - 1; i >= 0; i--) {
    order[i] = runs[i] * 2 + direction;
    direction = parents[i * 2 + direction];
  }
  let previous: Point | undefined;
  const steps = order.flatMap((id) => {
    const s = enter(vs[id], previous);
    previous = s.at(-1)!.to;
    return s;
  });
  const result = {
    steps,
    before: routeMetrics(base),
    after: routeMetrics(steps),
    // Exact only for the fixed reading order, not all run permutations.
    exact: true,
    runs: n,
  };
  cache.set(color, result);
  return result;
}
export function route(p: Pattern): Stitch[] {
  return ([...new Set(p.cells.filter(Boolean))] as string[]).flatMap(
    (c) => optimizeColor(p, c).steps,
  );
}
const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
// Perceptual distance in CIE Lab, with sRGB/D65 conversion.
function lab(c: number[]) {
  const v = c.map((n) => {
    n /= 255;
    return n > 0.04045 ? ((n + 0.055) / 1.055) ** 2.4 : n / 12.92;
  });
  const [r, g, b] = v;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047),
    y = f(r * 0.2126 + g * 0.7152 + b * 0.0722),
    z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const labs = threads.map((t) => lab(rgb(t.hex)));
const dist = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);
export function quantize(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  count: number,
  name: string,
): Pattern {
  const pixels = Array.from({ length: width * height }, (_, i) =>
    data[i * 4 + 3] < 80 ? null : lab(Array.from(data.slice(i * 4, i * 4 + 3))),
  );
  const nearest = (p: number[], ids: number[]) =>
    ids.reduce(
      (best, id) => (dist(p, labs[id]) < dist(p, labs[best]) ? id : best),
      ids[0],
    );
  const ids = threads.map((_, i) => i);
  const frequency = new Map<number, number>();
  pixels.forEach((p) => {
    if (p) {
      const id = nearest(p, ids);
      frequency.set(id, (frequency.get(id) || 0) + 1);
    }
  });
  const candidates = [...frequency.keys()];
  const selected: number[] = [];
  // Greedily minimize total approximation error, weighting every original colour.
  while (selected.length < Math.min(count, candidates.length)) {
    let best = -1,
      score = Infinity;
    for (const id of candidates.filter((i) => !selected.includes(i))) {
      const palette = [...selected, id];
      const error = [...frequency].reduce(
        (s, [i, n]) => s + n * dist(labs[i], labs[nearest(labs[i], palette)]),
        0,
      );
      if (error < score) {
        score = error;
        best = id;
      }
    }
    selected.push(best);
  }
  return {
    width,
    height,
    name,
    cells: pixels.map((p) => (p ? threads[nearest(p, selected)].id : null)),
  };
}
export function sample(): Pattern {
  // An abstract stitch sampler exercises runs, returns, gaps, and thread changes.
  const width = 24,
    height = 24;
  const cells = Array.from({ length: width * height }, (_, i) => {
    const x = i % width,
      y = Math.floor(i / width);
    const d = Math.abs(x - 11.5) + Math.abs(y - 11.5);
    return d > 10
      ? null
      : d > 8
        ? "797"
        : d > 6
          ? "3755"
          : d > 4
            ? "743"
            : d > 2
              ? "321"
              : "Blanc";
  });
  return { width, height, cells, name: "ひし形のステッチサンプラー" };
}

export type RouteRun = {
  id: number;
  steps: (Stitch & { needleNumber: number })[];
};
export function colorRuns(pattern: Pattern, color: string): RouteRun[] {
  const runs: RouteRun[] = [];
  route(pattern)
    .filter((s) => s.color === color)
    .forEach((s, i) => {
      if (["start", "jump", "cut"].includes(s.kind)) {
        runs.push({ id: runs.length + 1, steps: [] });
      }
      runs[runs.length - 1].steps.push({ ...s, needleNumber: i + 1 });
    });
  return runs;
}

export function threadColorDistance(a: string, b: string): number {
  const i = threads.findIndex((t) => t.id === a),
    j = threads.findIndex((t) => t.id === b);
  return i < 0 || j < 0 ? Infinity : Math.sqrt(dist(labs[i], labs[j]));
}
