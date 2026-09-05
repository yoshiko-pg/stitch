export type Thread = { id: string; name: string; hex: string };
// DMC numbers identify actual Mouliné Spécial threads. RGB values are approximate display swatches.
export const threads: Thread[] = [
  ['Blanc', '白', 'f5f4ed'],
  ['310', '黒', '252528'],
  ['318', 'ライトグレー', 'a5a5a5'],
  ['414', 'ダークグレー', '666971'],
  ['321', '赤', 'bb2439'],
  ['666', 'ブライトレッド', 'e33139'],
  ['761', 'ライトサーモン', 'f5b6b7'],
  ['3716', 'ピンク', 'f2a0b2'],
  ['814', 'ワイン', '722438'],
  ['740', 'オレンジ', 'f78026'],
  ['743', 'イエロー', 'f8d77a'],
  ['444', 'レモン', 'f1cd25'],
  [' Ecru', '生成り', 'e8dfc3'],
  ['801', 'ダークブラウン', '69412f'],
  ['433', 'ブラウン', '835a3b'],
  ['435', 'ライトブラウン', 'ba8959'],
  ['3865', 'ウィンターホワイト', 'f5f1e7'],
  ['469', 'オリーブ', '728144'],
  ['470', 'ライトオリーブ', '95a64d'],
  ['3347', 'グリーン', '71935c'],
  ['699', '深緑', '17663c'],
  ['702', 'ケリーグリーン', '399447'],
  ['3846', 'ターコイズ', '36b8bd'],
  ['3810', 'ブルーグリーン', '488f92'],
  ['597', 'ライトターコイズ', '78b8c4'],
  ['3755', 'ベビーブルー', '91b7d5'],
  ['798', 'ブルー', '5276aa'],
  ['797', 'ロイヤルブルー', '354e91'],
  ['820', 'ネイビー', '263460'],
  ['550', 'バイオレット', '64396f'],
  ['552', 'パープル', '9460a0'],
  ['153', 'ライトバイオレット', 'dfc5e4'],
].map(([id, name, hex]) => ({ id: id.trim(), name, hex: '#' + hex }));
export type Pattern = {
  width: number;
  height: number;
  cells: (string | null)[];
  name: string;
};
export type Point = [number, number];
export type Stitch = {
  color: string;
  cell: number;
  from: Point;
  to: Point;
  kind: 'start' | 'forward' | 'turn' | 'return' | 'jump' | 'cut';
  travel: number;
};
export function route(p: Pattern): Stitch[] {
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
          const from: Point = [a, y + 1],
            to: Point = [a + 1, y];
          const travel = previous
            ? Math.hypot(from[0] - previous[0], from[1] - previous[1])
            : 0;
          const kind = !previous
            ? 'start'
            : a === start
              ? travel > 3
                ? 'cut'
                : 'jump'
              : 'forward';
          result.push({ color, cell: y * p.width + a, from, to, kind, travel });
          previous = to;
        }
        for (let a = end; a >= start; a--) {
          const from: Point = [a + 1, y + 1],
            to: Point = [a, y];
          result.push({
            color,
            cell: y * p.width + a,
            from,
            to,
            kind: a === end ? 'turn' : 'return',
            travel: Math.hypot(from[0] - previous![0], from[1] - previous![1]),
          });
          previous = to;
        }
      }
  }
  return result;
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
        ? '797'
        : d > 6
          ? '3755'
          : d > 4
            ? '743'
            : d > 2
              ? '321'
              : 'Blanc';
  });
  return { width, height, cells, name: 'ひし形のステッチサンプラー' };
}
