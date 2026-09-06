import type { Pattern } from './stitch';

export type DotText = { width: number; height: number; dots: boolean[] };

/** Overlay only ink; spaces retain the existing stitches. Reject overflow. */
export function placeDotText(
  pattern: Pattern,
  text: DotText,
  x: number,
  y: number,
  color: string,
): Pattern {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x + text.width > pattern.width ||
    y + text.height > pattern.height
  ) {
    throw new Error(
      '文字がキャンバスに収まりません。サイズや配置位置を調整してください。',
    );
  }
  const cells = [...pattern.cells];
  text.dots.forEach((dot, i) => {
    if (dot)
      cells[
        (y + Math.floor(i / text.width)) * pattern.width + x + (i % text.width)
      ] = color;
  });
  return { ...pattern, cells };
}

/** Rasterize at one pixel per stitch, then enlarge by whole dots. */
export function rasterizeDotText(
  text: string,
  family: string,
  size: number,
  scale: number,
): DotText {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('文字を描画できませんでした。');
  const font = `${size}px "${family}"`;
  ctx.font = font;
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const metrics = lines.map((line) => ctx.measureText(line));
  const left = Math.ceil(
    Math.max(0, ...metrics.map((m) => m.actualBoundingBoxLeft)),
  );
  const ascent = Math.ceil(
    Math.max(size, ...metrics.map((m) => m.actualBoundingBoxAscent)),
  );
  const descent = Math.ceil(
    Math.max(0, ...metrics.map((m) => m.actualBoundingBoxDescent)),
  );
  const lineHeight = ascent + descent + 2;
  canvas.width = Math.max(
    1,
    left +
      Math.ceil(
        Math.max(
          ...metrics.map((m) => Math.max(m.width, m.actualBoundingBoxRight)),
        ),
      ) +
      2,
  );
  canvas.height = lineHeight * lines.length;
  if (canvas.width * scale > 512 || canvas.height * scale > 512)
    throw new Error('文字が長すぎます。文字数やサイズを減らしてください。');
  ctx.font = font;
  ctx.fillStyle = '#000';
  lines.forEach((line, i) => ctx.fillText(line, left, ascent + i * lineHeight));
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width,
    minY = canvas.height,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++) {
      if (pixels[(y * canvas.width + x) * 4 + 3] >= 128) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  if (maxX < 0) throw new Error('描画できる文字を入力してください。');
  const width = (maxX - minX + 1) * scale,
    height = (maxY - minY + 1) * scale;
  const dots = Array.from({ length: width * height }, (_, i) => {
    const x = minX + Math.floor((i % width) / scale);
    const y = minY + Math.floor(Math.floor(i / width) / scale);
    return pixels[(y * canvas.width + x) * 4 + 3] >= 128;
  });
  return { width, height, dots };
}
