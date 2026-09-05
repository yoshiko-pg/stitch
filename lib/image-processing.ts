import { threadColorDistance, type Pattern } from './stitch.ts';
export type ConversionMode = 'illustration' | 'photo' | 'pixel';

// Area-weighted colour voting: no averaged RGB is ever introduced. Similar source
// colours share a 5-bit bin; the bin's original sample nearest the cell centre wins.
export function representativePixels(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  w: number,
  h: number,
) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const left = (x * sw) / w,
        right = ((x + 1) * sw) / w,
        top = (y * sh) / h,
        bottom = ((y + 1) * sh) / h;
      const bins = new Map<
        number,
        { weight: number; index: number; center: number }
      >();
      let opaque = 0;
      for (let sy = Math.floor(top); sy < Math.min(sh, Math.ceil(bottom)); sy++)
        for (
          let sx = Math.floor(left);
          sx < Math.min(sw, Math.ceil(right));
          sx++
        ) {
          const i = (sy * sw + sx) * 4;
          if (data[i + 3] < 80) continue;
          const area =
            (Math.min(right, sx + 1) - Math.max(left, sx)) *
            (Math.min(bottom, sy + 1) - Math.max(top, sy));
          const weight = (area * data[i + 3]) / 255;
          opaque += weight;
          const key =
            (data[i] >> 3) * 1024 +
            (data[i + 1] >> 3) * 32 +
            (data[i + 2] >> 3);
          const center =
            (sx + 0.5 - (left + right) / 2) ** 2 +
            (sy + 0.5 - (top + bottom) / 2) ** 2;
          const bin = bins.get(key);
          if (bin) {
            bin.weight += weight;
            if (center < bin.center) {
              bin.index = i;
              bin.center = center;
            }
          } else bins.set(key, { weight, index: i, center });
        }
      if (opaque < (right - left) * (bottom - top) * 0.5) continue;
      let winner: { weight: number; index: number; center: number } | undefined;
      for (const bin of bins.values())
        if (
          !winner ||
          bin.weight > winner.weight + 1e-9 ||
          (Math.abs(bin.weight - winner.weight) < 1e-9 &&
            bin.center < winner.center)
        )
          winner = bin;
      if (winner) {
        out.set(data.subarray(winner.index, winner.index + 3), (y * w + x) * 4);
        out[(y * w + x) * 4 + 3] = 255;
      }
    }
  return out;
}

// Only merge tiny, enclosed, low-contrast islands. Decisions use the unchanged
// input so changes cannot cascade into larger deletions or cross transparent gaps.
export function simplifySpeckles(pattern: Pattern, maxSize: number): Pattern {
  if (maxSize <= 0) return pattern;
  const visited = new Set<number>(),
    cells = [...pattern.cells];
  for (let seed = 0; seed < cells.length; seed++) {
    const color = pattern.cells[seed];
    if (!color || visited.has(seed)) continue;
    const region = [seed],
      boundary = new Map<string, number>();
    visited.add(seed);
    let open = false;
    for (let cursor = 0; cursor < region.length; cursor++) {
      const i = region[cursor],
        x = i % pattern.width,
        y = Math.floor(i / pattern.width);
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || nx >= pattern.width || ny < 0 || ny >= pattern.height) {
          open = true;
          continue;
        }
        const j = ny * pattern.width + nx,
          c = pattern.cells[j];
        if (c === color) {
          if (!visited.has(j)) {
            visited.add(j);
            region.push(j);
          }
        } else if (c === null) open = true;
        else boundary.set(c, (boundary.get(c) || 0) + 1);
      }
    }
    if (open || region.length > maxSize) continue;
    const sorted = [...boundary].sort((a, b) => b[1] - a[1]);
    const target = sorted[0];
    const total = [...boundary.values()].reduce((a, b) => a + b, 0);
    if (
      target &&
      target[1] / total >= 0.8 &&
      threadColorDistance(color, target[0]) <= 12
    )
      region.forEach((i) => (cells[i] = target[0]));
  }
  return { ...pattern, cells };
}
