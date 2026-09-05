import { jsPDF } from 'jspdf';
import { threads, colorRuns, type Pattern } from './stitch.ts';

const W = 794,
  H = 1123,
  M = 48;
const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
export type PdfOptions = {
  kind: 'pattern' | 'route';
  color?: string;
  onProgress?: (page: number) => void;
};
// Canvas text uses the device's Japanese font, avoiding missing PDF glyphs.
// Each A4 page is rasterized at 2× (192 dpi); source is drawn directly, not captured from the UI.
export async function createPatternPdf(
  pattern: Pattern,
  options: PdfOptions,
  canvasFactory: () => HTMLCanvasElement = () =>
    document.createElement('canvas'),
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const palette = threads.filter((t) => pattern.cells.includes(t.id));
  let page = 0;
  async function emit(
    title: string,
    draw: (c: CanvasRenderingContext2D) => void,
  ) {
    const canvas = canvasFactory();
    canvas.width = W * 2;
    canvas.height = H * 2;
    const c = canvas.getContext('2d')!;
    c.scale(2, 2);
    c.fillStyle = '#fff';
    c.fillRect(0, 0, W, H);
    text(c, 'ito / クロスステッチ図案室', M, 40, 13, '#627666');
    text(c, title, M, 76, 22);
    text(
      c,
      `${pattern.width} × ${pattern.height}目 · ${palette.length}色`,
      M,
      101,
      12,
    );
    draw(c);
    page++;
    text(
      c,
      `${page}  /  ${options.kind === 'pattern' ? '図案' : '運針'} · 左上の穴が (0, 0)`,
      M,
      H - 30,
      11,
      '#697567',
    );
    if (page > 1) doc.addPage();
    doc.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      210,
      297,
      undefined,
      'FAST',
    );
    canvas.width = 1;
    canvas.height = 1;
    options.onProgress?.(page);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  function text(
    c: CanvasRenderingContext2D,
    s: string,
    x: number,
    y: number,
    size = 14,
    color = '#253d32',
  ) {
    c.font = `${size}px "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", sans-serif`;
    c.fillStyle = color;
    c.fillText(s, x, y, W - x - M);
  }
  function line(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    a: number,
    b: number,
    color = '#a7b1a5',
    width = 1,
  ) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(a, b);
    c.stroke();
  }
  function grid(
    c: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    cols: number,
    rows: number,
    size: number,
    top = 150,
  ) {
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const id = pattern.cells[(y + y0) * pattern.width + x + x0],
          t = palette.find((t) => t.id === id);
        c.fillStyle = t?.hex || '#ffffff';
        c.fillRect(M + x * size, top + y * size, size, size);
        if (t) {
          const rgb = [1, 3, 5].map((i) => parseInt(t.hex.slice(i, i + 2), 16));
          const ink =
            rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 150
              ? '#17251c'
              : '#ffffff';
          text(
            c,
            symbols[palette.indexOf(t)],
            M + x * size + size * 0.3,
            top + y * size + size * 0.72,
            size * 0.58,
            ink,
          );
        }
      }
    for (let x = 0; x <= cols; x++) {
      line(
        c,
        M + x * size,
        top,
        M + x * size,
        top + rows * size,
        (x + x0) % 10 ? '#b0b9ab' : '#445c46',
        (x + x0) % 10 ? 0.4 : 1.3,
      );
      if (x % 5 === 0) text(c, String(x + x0), M + x * size - 4, top - 10, 10);
    }
    for (let y = 0; y <= rows; y++) {
      line(
        c,
        M,
        top + y * size,
        M + cols * size,
        top + y * size,
        (y + y0) % 10 ? '#b0b9ab' : '#445c46',
        (y + y0) % 10 ? 0.4 : 1.3,
      );
      if (y % 5 === 0) text(c, String(y + y0), 20, top + y * size + 4, 10);
    }
  }
  if (options.kind === 'pattern') {
    await emit('図案の全体 / ' + pattern.name, (c) => {
      const size = Math.min(698 / pattern.width, 700 / pattern.height, 24);
      grid(c, 0, 0, pattern.width, pattern.height, size);
      text(c, '細かい図案は、続く拡大ページを使用してください。', M, 920, 14);
      text(
        c,
        '色記号・DMC糸番号は最後の凡例ページに記載しています。',
        M,
        948,
        14,
      );
    });
    // Consistent 5.3 mm cells, coordinate-labelled tiles with no missing or duplicate cells.
    for (let y = 0; y < pattern.height; y += 40)
      for (let x = 0; x < pattern.width; x += 34) {
        await emit(
          `図案 / 列 ${x + 1}-${Math.min(x + 34, pattern.width)} · 段 ${y + 1}-${Math.min(y + 40, pattern.height)}`,
          (c) =>
            grid(
              c,
              x,
              y,
              Math.min(34, pattern.width - x),
              Math.min(40, pattern.height - y),
              20,
            ),
        );
      }
    for (let offset = 0; offset < Math.max(1, palette.length); offset += 24) {
      await emit('糸の凡例 / ' + pattern.name, (c) => {
        palette.slice(offset, offset + 24).forEach((t, i) => {
          const y = 155 + i * 32;
          c.fillStyle = t.hex;
          c.fillRect(M, y - 16, 22, 22);
          text(
            c,
            `${symbols[offset + i]}   DMC ${t.id}   ${t.name}`,
            84,
            y,
            14,
          );
          text(
            c,
            `${pattern.cells.filter((v) => v === t.id).length}目`,
            650,
            y,
            13,
          );
        });
        text(
          c,
          '表示色は近似色です。購入前に実物の色見本をご確認ください。',
          M,
          975,
          13,
        );
      });
    }
  } else {
    const selected = palette.filter(
      (t) => !options.color || t.id === options.color,
    );
    if (!selected.length) throw new Error('運針を出力する色がありません');
    for (const t of selected) {
      const runs = colorRuns(pattern, t.id);
      type Block = {
        label: string;
        steps: (typeof runs)[number]['steps'];
        note: string;
      };
      const blocks: Block[] = [];
      for (const run of runs) {
        const half = run.steps.length / 2,
          first = run.steps[0];
        for (const upper of [false, true]) {
          const layer = upper
            ? run.steps.slice(half)
            : run.steps.slice(0, half);
          for (let i = 0; i < layer.length; i += 10) {
            const steps = layer.slice(i, i + 10);
            const firstUpper = run.steps[half];
            const reverse = firstUpper.from[0] < firstUpper.to[0];
            const right = upper ? reverse : !reverse;
            blocks.push({
              label: `区間 ${run.id} · ${upper ? '上糸 ／' : '下糸 ＼'} · ${right ? '右へ →' : '← 左へ'}${i ? '（続き）' : ''}`,
              steps,
              note:
                upper && !i
                  ? '折り返し：上糸を刺して戻ります。'
                  : !upper && !i
                    ? first.kind === 'cut'
                      ? `糸を始末して再開。出す穴 (${first.from.join(', ')})`
                      : first.kind === 'jump'
                        ? `前の区間から裏側を移動 → (${first.from.join(', ')})`
                        : `開始：糸を固定し、穴 (${first.from.join(', ')}) から`
                    : '番号順に続けます。',
            });
          }
        }
      }
      for (let offset = 0; offset < blocks.length; offset += 5) {
        await emit(`運針 / DMC ${t.id} · ${t.name}`, (c) => {
          text(
            c,
            '● 奇数：針を出す　■ 偶数：針を入れる。数字の小さい順に進みます。',
            M,
            130,
            13,
          );
          blocks.slice(offset, offset + 5).forEach((block, i) => {
            const y = 168 + i * 169;
            const minX = Math.min(
              ...block.steps.flatMap((s) => [s.from[0], s.to[0]]),
            );
            const minY = Math.min(
              ...block.steps.flatMap((s) => [s.from[1], s.to[1]]),
            );
            text(c, block.label, M, y, 15);
            text(c, block.note, M, y + 22, 12);
            block.steps.forEach((s) => {
              const ax = 70 + (s.from[0] - minX) * 61,
                ay = y + 53 + (s.from[1] - minY) * 53,
                bx = 70 + (s.to[0] - minX) * 61,
                by = y + 53 + (s.to[1] - minY) * 53;
              line(
                c,
                ax,
                ay,
                bx,
                by,
                block.label.includes('上糸') ? '#b76132' : '#277394',
                2.5,
              );
              c.fillStyle = '#1b775f';
              c.beginPath();
              c.arc(ax, ay, 16, 0, Math.PI * 2);
              c.fill();
              c.fillStyle = '#b5542e';
              c.fillRect(bx - 16, by - 16, 32, 32);
              c.textAlign = 'center';
              text(
                c,
                String(s.needleNumber * 2 - 1),
                ax,
                ay + 4,
                11,
                '#ffffff',
              );
              text(c, String(s.needleNumber * 2), bx, by + 4, 11, '#ffffff');
              c.textAlign = 'left';
            });
            text(
              c,
              `左端 x=${minX} ／ 上の穴 y=${minY}・下の穴 y=${minY + 1}`,
              M,
              y + 139,
              11,
            );
            line(c, M, y + 151, W - M, y + 151, '#dde3d8');
          });
          text(
            c,
            offset + 5 >= blocks.length
              ? 'この色はここまで。最後に裏側で糸を始末します。'
              : '次のページの番号へ続きます。',
            M,
            1040,
            13,
          );
        });
      }
    }
  }
  doc.setProperties({
    title:
      pattern.name +
      ' / ' +
      (options.kind === 'pattern' ? 'Pattern' : 'Stitch route'),
    creator: 'ito',
  });
  return doc;
}
