'use client';
// Client-only persistence deliberately hydrates after mount; the compiler rule also reports an internal PruneHoistedContexts invariant here.
/* oxlint-disable react/react-compiler */
// Inline SVGs require an accessible image role; replacing them with img would lose their dynamic geometry.
/* oxlint-disable jsx-a11y/prefer-tag-over-role */
import { RouteOverview } from './route-overview';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  Grid2X2,
  Route,
  ZoomIn,
  ZoomOut,
  Undo2,
  Save,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { threads, route, sample, quantize, type Pattern } from '@/lib/stitch';
import {
  representativePixels,
  simplifySpeckles,
  type ConversionMode,
} from '@/lib/image-processing';
const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
const labels = {
  start: 'ここからスタート',
  forward: '下糸を刺して進む',
  turn: 'ここで折り返す',
  return: '上糸を刺して戻る',
  jump: '次の列・まとまりへ移動',
  cut: '糸を始末して、ここから再開',
};
export default function Home() {
  const [pattern, setPattern] = useState<Pattern>(sample);
  const [width, setWidth] = useState(48);
  const [colors, setColors] = useState(8);
  const [conversionMode, setConversionMode] =
    useState<ConversionMode>('illustration');
  const [speckles, setSpeckles] = useState(0);
  const [view, setView] = useState('guide');
  const [showSymbols, setShowSymbols] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [step, setStep] = useState(0);
  const [paint, setPaint] = useState<string | null | undefined>();
  const [mergeFrom, setMergeFrom] = useState('');
  const [mergeTo, setMergeTo] = useState('');
  const [history, setHistory] = useState<Pattern[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfColor, setPdfColor] = useState('all');
  const [sourceName, setSourceName] = useState('');
  const source = useRef<HTMLImageElement | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const board = useRef<SVGSVGElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = footer.current;
    const root = shell.current;
    if (!element || !root) return;
    const measure = () =>
      root.style.setProperty(
        '--footer-height',
        `${Math.ceil(element.getBoundingClientRect().height)}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const [draftCells, setDraftCells] = useState<(string | null)[] | null>(null);
  const stroke = useRef<{
    pointerId: number;
    original: Pattern;
    cells: (string | null)[];
    color: string | null;
    last: [number, number] | null;
    changed: boolean;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const sequence = useMemo(() => route(pattern), [pattern]);
  const current = sequence[Math.min(step, sequence.length - 1)];
  const palette = useMemo(
    () => threads.filter((t) => pattern.cells.includes(t.id)),
    [pattern],
  );
  const mergeSource = palette.find((t) => t.id === mergeFrom);
  const mergeTarget = palette.find((t) => t.id === mergeTo);
  const mergeCount = mergeSource
    ? pattern.cells.filter((c) => c === mergeSource.id).length
    : 0;
  const canMerge =
    !!mergeSource && !!mergeTarget && mergeSource.id !== mergeTarget.id;
  function mergeColors() {
    if (!canMerge || !mergeSource || !mergeTarget) return;
    update({
      ...pattern,
      cells: pattern.cells.map((c) =>
        c === mergeSource.id ? mergeTarget.id : c,
      ),
    });
    setPaint(mergeTarget.id);
    setMergeFrom('');
    setView('pattern');
    setMessage(
      `DMC ${mergeSource.id} の ${mergeCount}目を DMC ${mergeTarget.id} にまとめました。「一つ戻す」で取り消せます。運針は最初からになります。`,
    );
  }
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem('ito-project-v3') ||
        localStorage.getItem('ito-project-v2') ||
        localStorage.getItem('ito-project-v1');
      if (raw) {
        const s = JSON.parse(raw);
        if (valid(s.pattern)) {
          setPattern(s.pattern);
          setStep(
            Math.max(
              0,
              Math.min(
                s.routeVersion === 3 ? Math.floor(Number(s.step)) || 0 : 0,
                route(s.pattern).length,
              ),
            ),
          );
          setMessage(
            s.routeVersion === 3
              ? '前回の図案と進み具合を復元しました'
              : '図案を復元しました。運針を最適化したため、運針は最初からになります。',
          );
        }
      }
    } catch {
      setMessage('保存データを読み込めませんでした');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        'ito-project-v3',
        JSON.stringify({ pattern, step, routeVersion: 3 }),
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [pattern, step, ready]);
  function valid(p: Pattern) {
    return (
      p &&
      Number.isInteger(p.width) &&
      p.width >= 1 &&
      p.width <= 120 &&
      Number.isInteger(p.height) &&
      p.height >= 1 &&
      p.height <= 120 &&
      Array.isArray(p.cells) &&
      p.cells.length === p.width * p.height &&
      p.cells.every((c) => c === null || threads.some((t) => t.id === c)) &&
      typeof p.name === 'string'
    );
  }
  function update(p: Pattern) {
    setHistory((h) => [...h.slice(-19), pattern]);
    setPattern(p);
    setStep(0);
  }
  function imagePattern(
    img: HTMLImageElement,
    name: string,
    w = width,
    count = colors,
  ): Pattern {
    const ratio = img.naturalHeight / img.naturalWidth;
    const h = Math.max(1, Math.min(120, Math.round(w * ratio)));
    const actualW = Math.max(1, Math.min(120, Math.round(h / ratio)));
    const canvas = document.createElement('canvas');
    let pixels: Uint8ClampedArray;
    if (conversionMode === 'illustration') {
      // Bound source readback memory; nearest sampling never blends source colours.
      const scale = Math.min(
        1,
        2048 / Math.max(img.naturalWidth, img.naturalHeight),
      );
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      pixels = representativePixels(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data,
        canvas.width,
        canvas.height,
        actualW,
        h,
      );
    } else {
      canvas.width = actualW;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = conversionMode === 'photo';
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, actualW, h);
      pixels = ctx.getImageData(0, 0, actualW, h).data;
    }
    const result = quantize(pixels, actualW, h, count, name);
    return conversionMode === 'illustration'
      ? simplifySpeckles(result, speckles)
      : result;
  }
  function convert(w = width, c = colors) {
    if (!source.current) return;
    try {
      update(imagePattern(source.current, sourceName || 'マイ図案', w, c));
      setMessage('図案を更新しました。運針は最初からになります。');
    } catch {
      setMessage('画像を処理できませんでした。小さい画像でお試しください。');
    }
  }
  function load(file?: File) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMessage('20MB以下の画像を選んでください');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage('PNG・JPEG・WebPの画像を選んでください');
      return;
    }
    setBusy(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        source.current = img;
        setSourceName(file.name);
        update(imagePattern(img, file.name.replace(/\.[^.]+$/, '')));
        setMessage('画像から図案を作りました');
        setView('pattern');
      } catch {
        setMessage('画像を処理できませんでした');
      } finally {
        setBusy(false);
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      setMessage('画像を読み込めませんでした');
      setBusy(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }
  function pointerCell(
    e: ReactPointerEvent<SVGSVGElement>,
  ): [number, number] | null {
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      matrix.inverse(),
    );
    const x = Math.floor(point.x),
      y = Math.floor(point.y);
    return x >= 0 && y >= 0 && x < pattern.width && y < pattern.height
      ? [x, y]
      : null;
  }
  function paintStroke(e: ReactPointerEvent<SVGSVGElement>) {
    const active = stroke.current;
    if (!active || active.pointerId !== e.pointerId) return;
    const cell = pointerCell(e);
    // Leaving the grid breaks the line, so re-entry does not paint across it.
    if (!cell) {
      active.last = null;
      return;
    }
    let [x, y] = active.last || cell;
    const [endX, endY] = cell;
    const dx = Math.abs(endX - x),
      dy = -Math.abs(endY - y);
    const sx = x < endX ? 1 : -1,
      sy = y < endY ? 1 : -1;
    let error = dx + dy,
      changed = false;
    // Fill skipped cells between pointer events, including fast diagonal strokes.
    while (true) {
      const i = y * active.original.width + x;
      if (active.cells[i] !== active.color) {
        active.cells[i] = active.color;
        active.changed = true;
        changed = true;
      }
      if (x === endX && y === endY) break;
      const twice = 2 * error;
      if (twice >= dy) {
        error += dy;
        x += sx;
      }
      if (twice <= dx) {
        error += dx;
        y += sy;
      }
    }
    active.last = cell;
    if (changed) setDraftCells([...active.cells]);
  }
  function beginStroke(e: ReactPointerEvent<SVGSVGElement>) {
    if (
      view !== 'pattern' ||
      paint === undefined ||
      e.button !== 0 ||
      !e.isPrimary ||
      stroke.current ||
      !pointerCell(e)
    )
      return;
    e.preventDefault();
    stroke.current = {
      pointerId: e.pointerId,
      original: pattern,
      cells: [...pattern.cells],
      color: paint,
      last: null,
      changed: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    paintStroke(e);
  }
  function finishStroke(e: ReactPointerEvent<SVGSVGElement>) {
    const active = stroke.current;
    if (!active || active.pointerId !== e.pointerId) return;
    if (e.type === 'pointerup') paintStroke(e);
    stroke.current = null;
    if (active.changed) {
      setHistory((h) => [...h.slice(-19), active.original]);
      setPattern({ ...active.original, cells: active.cells });
      setStep(0);
    }
    setDraftCells(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function download(text: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function exportPdf(kind: 'pattern' | 'route') {
    setPdfBusy(true);
    try {
      const { createPatternPdf } = await import('@/lib/pdf-export');
      const doc = await createPatternPdf(pattern, {
        kind,
        color:
          pdfColor === 'all' || !palette.some((t) => t.id === pdfColor)
            ? undefined
            : pdfColor,
        onProgress: (page) => setMessage(`PDFを作成中… ${page}ページ`),
      });
      doc.save(`ito-${kind}.pdf`);
      setMessage('PDFを保存しました');
    } catch {
      setMessage('PDFを作成できませんでした。運針は色を絞ってお試しください。');
    } finally {
      setPdfBusy(false);
    }
  }
  function exportSvg() {
    const cell = 22,
      pad = 35;
    const body = pattern.cells
      .map((c, i) => {
        if (!c) return '';
        const t = threads.find((t) => t.id === c)!;
        const x = (i % pattern.width) * cell + pad,
          y = Math.floor(i / pattern.width) * cell + pad;
        return `<rect x="${x}" y="${y}" width="22" height="22" fill="${t.hex}" stroke="#888" stroke-width=".5"/><text x="${x + 11}" y="${y + 15}" text-anchor="middle" font-size="12" fill="${ink(t.hex)}">${symbols[palette.indexOf(t)] || '＋'}</text>`;
      })
      .join('');
    const legend = palette
      .map(
        (t, i) =>
          `<text x="35" y="${pattern.height * cell + 70 + i * 24}" font-size="15">${symbols[i]} · DMC ${t.id} · ${pattern.cells.filter((c) => c === t.id).length} stitches</text>`,
      )
      .join('');
    download(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(360, pattern.width * cell + 70)}" height="${pattern.height * cell + 100 + palette.length * 24}"><rect width="100%" height="100%" fill="white"/><text x="35" y="23" font-size="16">ito / ${pattern.width} x ${pattern.height}</text>${body}${legend}</svg>`,
      'ito-pattern.svg',
      'image/svg+xml',
    );
  }
  function exportRoute() {
    download(
      '手順,DMC,動作,出す穴X,出す穴Y,入れる穴X,入れる穴Y\n' +
        sequence
          .map(
            (s, i) =>
              `${i + 1},${s.color},${labels[s.kind]},${s.from[0]},${s.from[1]},${s.to[0]},${s.to[1]}`,
          )
          .join('\n'),
      'ito-route.csv',
      'text/csv;charset=utf-8',
    );
  }
  function ink(hex: string) {
    const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return n[0] * 0.299 + n[1] * 0.587 + n[2] * 0.114 > 150
      ? '#243533'
      : '#fff';
  }
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'read_stitch_guide',
            title: '現在の運針を確認',
            description:
              'Read the current pattern dimensions and exact needle entry/exit holes without changing progress.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute: (input: unknown) => {
              if (
                !input ||
                typeof input !== 'object' ||
                Object.keys(input).length
              )
                throw Error('Expected an empty object');
              return {
                width: pattern.width,
                height: pattern.height,
                step: step + 1,
                total: sequence.length,
                complete: step >= sequence.length,
                current: step < sequence.length ? current : null,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [pattern, step, current, sequence.length]);
  return (
    <div className="app-shell" ref={shell}>
      <main className="workspace">
        <aside className="settings" aria-label="図案の設定">
          <div className="panel-heading">
            <h2>図案をつくる</h2>
          </div>
          <input
            ref={upload}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              load(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            className="upload-zone"
            onClick={() => upload.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              load(e.dataTransfer.files[0]);
            }}
            disabled={busy}
          >
            <Upload size={23} />
            <strong>{busy ? '変換しています…' : '画像をアップロード'}</strong>
          </button>
          <div className="conversion-controls">
            <label htmlFor="conversion-mode">画像の変換方法</label>
            <NativeSelect
              id="conversion-mode"
              value={conversionMode}
              onChange={(e) =>
                setConversionMode(e.target.value as ConversionMode)
              }
              disabled={busy}
            >
              <NativeSelectOption value="illustration">
                イラスト向け · 代表色でくっきり
              </NativeSelectOption>
              <NativeSelectOption value="pixel">
                ドット絵向け · 色を混ぜない
              </NativeSelectOption>
              <NativeSelectOption value="photo">
                写真向け · なめらか
              </NativeSelectOption>
            </NativeSelect>
            {conversionMode === 'illustration' && (
              <>
                <label htmlFor="speckles">近い色の小さな点を整理</label>
                <NativeSelect
                  id="speckles"
                  value={speckles}
                  onChange={(e) => setSpeckles(Number(e.target.value))}
                  disabled={busy}
                >
                  <NativeSelectOption value={0}>
                    しない（細部を残す）
                  </NativeSelectOption>
                  <NativeSelectOption value={1}>1目の点だけ</NativeSelectOption>
                  <NativeSelectOption value={2}>2目までの点</NativeSelectOption>
                </NativeSelect>
              </>
            )}
          </div>
          <div className="setting">
            <label id="size-label">
              横の目数{' '}
              <strong>
                {width}
                <small> 目</small>
              </strong>
            </label>
            <Slider
              aria-labelledby="size-label"
              min={12}
              max={96}
              step={4}
              value={[width]}
              onValueChange={(v) => setWidth(Array.isArray(v) ? v[0] : v)}
            />
          </div>
          <div className="setting">
            <label id="color-label">
              使う色数の上限{' '}
              <strong>
                {colors}
                <small> 色</small>
              </strong>
            </label>
            <Slider
              aria-labelledby="color-label"
              min={2}
              max={24}
              value={[colors]}
              onValueChange={(v) => setColors(Array.isArray(v) ? v[0] : v)}
            />
          </div>
          <button
            className="primary full"
            disabled={!source.current || busy}
            onClick={() => convert()}
          >
            この設定で図案を更新
            <ArrowRight size={16} />
          </button>
          <section className="pdf-controls">
            <h3>PDFで保存</h3>
            <button
              className="outline full"
              disabled={pdfBusy}
              onClick={() => void exportPdf('pattern')}
            >
              図案PDFを保存
            </button>
            <label htmlFor="pdf-color">運針PDFに含める色</label>
            <NativeSelect
              id="pdf-color"
              value={
                pdfColor === 'all' || palette.some((t) => t.id === pdfColor)
                  ? pdfColor
                  : 'all'
              }
              onChange={(e) => setPdfColor(e.target.value)}
            >
              <NativeSelectOption value="all">すべての色</NativeSelectOption>
              {palette.map((t, i) => (
                <NativeSelectOption key={t.id} value={t.id}>
                  {symbols[i]} · DMC {t.id}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <button
              className="outline full"
              disabled={pdfBusy || !palette.length}
              onClick={() => void exportPdf('route')}
            >
              {pdfBusy ? 'PDFを作成中…' : '運針PDFを保存'}
            </button>
            <button className="text-button" onClick={exportSvg}>
              図案SVGを保存
            </button>
            <button className="text-button" onClick={exportRoute}>
              運針表をCSVで保存
            </button>
          </section>
          <div className="divider" />
          <div className="palette-heading">
            <h3>糸のパレット</h3>
            <span>DMC · {palette.length}色</span>
          </div>
          <div className="palette">
            {palette.map((t, i) => (
              <button
                key={t.id}
                className={'thread ' + (paint === t.id ? 'selected' : '')}
                onClick={() => {
                  setPaint(paint === t.id ? undefined : t.id);
                  setView('pattern');
                }}
              >
                <span
                  className="swatch"
                  style={{ background: t.hex, color: ink(t.hex) }}
                >
                  {symbols[i]}
                </span>
                <span>
                  <strong>{t.id}</strong>
                  <small>{t.name}</small>
                </span>
                <span className="count">
                  {pattern.cells.filter((c) => c === t.id).length}目
                </span>
              </button>
            ))}
          </div>
          <section className="merge-colors" aria-labelledby="merge-title">
            <h3 id="merge-title">似た色をまとめる</h3>
            <label htmlFor="merge-from">置き換える色</label>
            <NativeSelect
              id="merge-from"
              value={mergeSource?.id || ''}
              disabled={palette.length < 2}
              onChange={(e) => {
                setMergeFrom(e.target.value);
                setView('pattern');
                setPaint(undefined);
              }}
            >
              <NativeSelectOption value="">色を選ぶ</NativeSelectOption>
              {palette.map((t, i) => (
                <NativeSelectOption key={t.id} value={t.id}>
                  {symbols[i]} · DMC {t.id} ·{' '}
                  {pattern.cells.filter((c) => c === t.id).length}目
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <label htmlFor="merge-to">残す色</label>
            <NativeSelect
              id="merge-to"
              value={mergeTarget?.id || ''}
              disabled={palette.length < 2}
              onChange={(e) => setMergeTo(e.target.value)}
            >
              <NativeSelectOption value="">色を選ぶ</NativeSelectOption>
              {palette.map((t, i) => (
                <NativeSelectOption
                  key={t.id}
                  value={t.id}
                  disabled={t.id === mergeSource?.id}
                >
                  {symbols[i]} · DMC {t.id} · {t.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {canMerge && (
              <div className="merge-preview">
                <span
                  style={{
                    background: mergeSource!.hex,
                    color: ink(mergeSource!.hex),
                  }}
                >
                  {symbols[palette.indexOf(mergeSource!)]}
                </span>
                <ArrowRight size={16} />
                <span
                  style={{
                    background: mergeTarget!.hex,
                    color: ink(mergeTarget!.hex),
                  }}
                >
                  {symbols[palette.indexOf(mergeTarget!)]}
                </span>
                <strong>{mergeCount}目</strong>
              </div>
            )}
            <button
              className="primary full"
              disabled={!canMerge}
              onClick={mergeColors}
            >
              {canMerge ? `${mergeCount}目をまとめる` : '色を選んでまとめる'}
            </button>
          </section>
          <details>
            <summary>ほかの糸色を追加</summary>
            <div className="extra-palette">
              {threads
                .filter((t) => !palette.includes(t))
                .map((t) => (
                  <button
                    key={t.id}
                    title={`DMC ${t.id} ${t.name}`}
                    aria-label={`DMC ${t.id} ${t.name}で描く`}
                    style={{ background: t.hex, color: ink(t.hex) }}
                    onClick={() => {
                      setPaint(t.id);
                      setView('pattern');
                    }}
                  >
                    {t.id}
                  </button>
                ))}
            </div>
          </details>
        </aside>
        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <Tabs value={view} onValueChange={(v) => setView(String(v))}>
              <TabsList>
                <TabsTrigger value="pattern">
                  <Grid2X2 size={16} />
                  図案
                </TabsTrigger>
                <TabsTrigger value="guide">
                  <Route size={16} />
                  色ごとの運針
                </TabsTrigger>
                <TabsTrigger value="step">ひと針ずつ</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {view === 'guide' ? (
            <RouteOverview pattern={pattern} />
          ) : (
            <>
              <div className="canvas-actions">
                <div className="edit-tools">
                  <RadioGroup
                    className="paint-color-options"
                    aria-label="塗る色"
                    value={paint || ''}
                    onValueChange={(value) => {
                      setPaint(String(value));
                      setView('pattern');
                    }}
                  >
                    {palette.map((t, i) => (
                      <label
                        key={t.id}
                        className="paint-choice"
                        htmlFor={`paint-${t.id}`}
                        title={`DMC ${t.id} · ${t.name}`}
                      >
                        <RadioGroupItem
                          id={`paint-${t.id}`}
                          value={t.id}
                          aria-label={`${symbols[i]} · DMC ${t.id} · ${t.name}`}
                          className="paint-color-radio"
                          style={{ background: t.hex, color: ink(t.hex) }}
                        />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <button
                    aria-label="一つ戻す"
                    disabled={!history.length}
                    onClick={() => {
                      setPattern(history[history.length - 1]);
                      setHistory((h) => h.slice(0, -1));
                      setStep(0);
                    }}
                  >
                    <Undo2 size={17} />
                  </button>
                </div>
                <div className="zoom-tools">
                  <button
                    aria-label="縮小"
                    disabled={zoom <= 0.6}
                    onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                  >
                    <ZoomOut size={17} />
                  </button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button
                    aria-label="拡大"
                    disabled={zoom >= 3}
                    onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  >
                    <ZoomIn size={17} />
                  </button>
                  <button
                    className={'symbol-toggle ' + (showSymbols ? 'on' : '')}
                    aria-pressed={showSymbols}
                    onClick={() => setShowSymbols(!showSymbols)}
                  >
                    A 記号
                  </button>
                </div>
              </div>
              <div className="board-scroll">
                <div
                  className="board-wrap"
                  style={{
                    width:
                      Math.max(
                        300,
                        Math.max(pattern.width, pattern.height) * 17,
                      ) * zoom,
                  }}
                >
                  <svg
                    ref={board}
                    onPointerDown={beginStroke}
                    onPointerMove={paintStroke}
                    onPointerUp={finishStroke}
                    onPointerCancel={finishStroke}
                    onLostPointerCapture={finishStroke}
                    style={{
                      touchAction:
                        view === 'pattern' && paint !== undefined
                          ? 'none'
                          : 'auto',
                    }}
                    className={
                      'pattern-grid ' +
                      (view === 'pattern' && paint !== undefined
                        ? 'painting'
                        : '')
                    }
                    viewBox={`-2 -2 ${pattern.width + 4} ${pattern.height + 4}`}
                    role="img"
                    aria-label={`${pattern.width}×${pattern.height}目の図案。運針位置を枠で表示。`}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={pattern.width}
                      height={pattern.height}
                      fill="#fffefa"
                    />
                    {(draftCells || pattern.cells).map((c, i) => {
                      const t = threads.find((t) => t.id === c);
                      const x = i % pattern.width,
                        y = Math.floor(i / pattern.width);
                      const faded =
                        view === 'step' && current && c !== current.color;
                      return (
                        <g key={i} opacity={faded ? 0.2 : 1}>
                          <rect
                            x={x}
                            y={y}
                            width={1}
                            height={1}
                            fill={t?.hex || '#fffefa'}
                          />
                          {t &&
                            (showSymbols ? (
                              <text
                                x={x + 0.5}
                                y={y + 0.68}
                                textAnchor="middle"
                                fontSize=".48"
                                fill={ink(t.hex)}
                                fontFamily="monospace"
                              >
                                {symbols[palette.indexOf(t)] || '＋'}
                              </text>
                            ) : (
                              <path
                                d={`M${x + 0.17} ${y + 0.17}l.66 .66m0 -.66l-.66 .66`}
                                fill="none"
                                stroke={ink(t.hex)}
                                opacity=".45"
                                strokeWidth=".07"
                              />
                            ))}
                        </g>
                      );
                    })}
                    {Array.from({ length: pattern.width + 1 }, (_, x) => (
                      <path
                        key={'x' + x}
                        d={`M${x} 0V${pattern.height}`}
                        stroke={x % 10 === 0 ? '#6f807d' : '#b7beb5'}
                        strokeWidth={x % 10 === 0 ? 0.055 : 0.018}
                        pointerEvents="none"
                      />
                    ))}
                    {Array.from({ length: pattern.height + 1 }, (_, y) => (
                      <path
                        key={'y' + y}
                        d={`M0 ${y}H${pattern.width}`}
                        stroke={y % 10 === 0 ? '#6f807d' : '#b7beb5'}
                        strokeWidth={y % 10 === 0 ? 0.055 : 0.018}
                        pointerEvents="none"
                      />
                    ))}
                    {Array.from(
                      { length: Math.floor(pattern.width / 5) + 1 },
                      (_, i) => (
                        <text
                          key={'nx' + i}
                          x={i * 5}
                          y={-0.65}
                          fontSize=".6"
                          textAnchor="middle"
                          fill="#5a6965"
                        >
                          {i * 5}
                        </text>
                      ),
                    )}
                    {Array.from(
                      { length: Math.floor(pattern.height / 5) + 1 },
                      (_, i) => (
                        <text
                          key={'ny' + i}
                          x={-1}
                          y={i * 5 + 0.2}
                          fontSize=".6"
                          textAnchor="middle"
                          fill="#5a6965"
                        >
                          {i * 5}
                        </text>
                      ),
                    )}
                    {view === 'pattern' &&
                      mergeSource &&
                      pattern.cells.map((c, i) =>
                        c === mergeSource.id ? (
                          <rect
                            key={'merge-' + i}
                            x={(i % pattern.width) + 0.07}
                            y={Math.floor(i / pattern.width) + 0.07}
                            width={0.86}
                            height={0.86}
                            fill="none"
                            stroke="#d05f22"
                            strokeWidth=".12"
                            pointerEvents="none"
                          />
                        ) : null,
                      )}
                    {view === 'step' && current && step < sequence.length && (
                      <g pointerEvents="none">
                        <rect
                          x={(current.cell % pattern.width) - 0.12}
                          y={Math.floor(current.cell / pattern.width) - 0.12}
                          width={1.24}
                          height={1.24}
                          fill="none"
                          stroke="#102f2b"
                          strokeWidth=".14"
                        />
                        <circle
                          cx={current.from[0]}
                          cy={current.from[1]}
                          r=".18"
                          fill="#16a085"
                          stroke="white"
                          strokeWidth=".05"
                        />
                        <circle
                          cx={current.to[0]}
                          cy={current.to[1]}
                          r=".18"
                          fill="#f16b43"
                          stroke="white"
                          strokeWidth=".05"
                        />
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            </>
          )}
          {view === 'step' && (
            <div className="step-navigation">
              <button
                className="outline"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft size={16} />
                戻る
              </button>
              <div aria-live="polite">
                {current && step < sequence.length ? (
                  <>
                    <strong>
                      {step + 1} / {sequence.length} · DMC {current.color} ·{' '}
                      {labels[current.kind]}
                    </strong>
                    <span>
                      出す穴 ({current.from.join(', ')}) → 入れる穴 (
                      {current.to.join(', ')})
                    </span>
                    {current.kind === 'cut' && (
                      <span>
                        裏で糸を始末し、新しい糸を固定して再開します。
                      </span>
                    )}
                  </>
                ) : (
                  <strong>
                    {sequence.length
                      ? '完成です。最後に裏で糸を始末します。'
                      : '色のあるマスを作ると運針が表示されます。'}
                  </strong>
                )}
              </div>
              <button
                className="primary"
                disabled={step >= sequence.length}
                onClick={() => setStep((s) => s + 1)}
              >
                次へ
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>
      <PatternPreview pattern={pattern} cells={draftCells || pattern.cells} />
      <footer ref={footer}>
        <span>{saved ? 'この端末に自動保存' : '端末内で画像を処理'}</span>
        <output
          className="status"
          title={
            message || 'まずはサンプルで、針の道すじを試してみてください。'
          }
        >
          {message || 'まずはサンプルで、針の道すじを試してみてください。'}
        </output>
        <button
          onClick={() => {
            source.current = null;
            setSourceName('');
            update(sample());
            setMessage('サンプルに切り替えました');
          }}
        >
          サンプルを開く
        </button>
        <button
          onClick={() =>
            download(
              JSON.stringify({ pattern, step, routeVersion: 3 }),
              'ito-project.json',
              'application/json',
            )
          }
        >
          <Save size={14} />
          作業を保存
        </button>
        <label className="import-label">
          作業を読み込む
          <input
            type="file"
            accept=".json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 2e6) throw Error();
                const s = JSON.parse(await f.text());
                if (!valid(s.pattern)) throw Error();
                update(s.pattern);
                source.current = null;
                setSourceName('');
                setStep(
                  Math.max(
                    0,
                    Math.min(
                      s.routeVersion === 3
                        ? Math.floor(Number(s.step)) || 0
                        : 0,
                      route(s.pattern).length,
                    ),
                  ),
                );
                setMessage('作業を読み込みました');
              } catch {
                setMessage('この作業ファイルは読み込めません');
              }
            }}
          />
        </label>
      </footer>
    </div>
  );
}

function PatternPreview({
  pattern,
  cells,
}: {
  pattern: Pattern;
  cells: Pattern['cells'];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const count = 14;
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const cellSize = 12;
    target.width = pattern.width * cellSize;
    target.height = pattern.height * cellSize;
    const ctx = target.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    const colors = new Map(threads.map((t) => [t.id, t.hex]));
    cells.forEach((color, i) => {
      if (!color) return;
      const x = (i % pattern.width) * cellSize;
      const y = Math.floor(i / pattern.width) * cellSize;
      ctx.strokeStyle = colors.get(color) || '#ffffff';
      // Lower backslash, then upper slash, matching the actual stitch order.
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + 10, y + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 2);
      ctx.lineTo(x + 2, y + 10);
      ctx.stroke();
    });
  }, [cells, pattern.width, pattern.height]);
  const cssWidth = (pattern.width / count) * 96,
    cssHeight = (pattern.height / count) * 96;
  const scale = Math.min(1, 180 / cssWidth, 150 / cssHeight);
  return (
    <details className="pattern-preview" open>
      <summary>完成プレビュー</summary>
      <div className="preview-content">
        <div className="preview-image">
          <canvas
            ref={canvas}
            role="img"
            aria-label="糸色のクロスステッチで表した完成プレビュー"
            style={{ width: cssWidth * scale, height: cssHeight * scale }}
          />
        </div>
        <p title="14ctの布での完成サイズ目安です。画面上の大きさは端末によって変わります。">
          {((pattern.width / count) * 2.54).toFixed(1)} ×{' '}
          {((pattern.height / count) * 2.54).toFixed(1)} cm{' '}
          <span>14ct目安</span>
        </p>
      </div>
    </details>
  );
}
