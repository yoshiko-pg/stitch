'use client';
// Client-only persistence deliberately hydrates after mount; the compiler rule also reports an internal PruneHoistedContexts invariant here.
/* oxlint-disable react/react-compiler */
// Inline SVGs require an accessible image role; replacing them with img would lose their dynamic geometry.
/* oxlint-disable jsx-a11y/prefer-tag-over-role */
import { RouteOverview } from './route-overview';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  Download,
  RotateCcw,
  Scissors,
  Check,
  Grid2X2,
  Route,
  ZoomIn,
  ZoomOut,
  Undo2,
  Eraser,
  Save,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { threads, route, sample, quantize, type Pattern } from '@/lib/stitch';
const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
const labels = {
  start: 'ここからスタート',
  forward: '右へ進む',
  turn: 'ここで折り返す',
  return: '左へ戻る',
  jump: '次の列・まとまりへ移動',
  cut: '糸を始末して、ここから再開',
};
export default function Home() {
  const [pattern, setPattern] = useState<Pattern>(sample);
  const [width, setWidth] = useState(48);
  const [colors, setColors] = useState(8);
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
  const [sourceName, setSourceName] = useState('');
  const source = useRef<HTMLImageElement | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const board = useRef<SVGSVGElement>(null);
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
  const stitched = pattern.cells.filter(Boolean).length;
  const active = threads.find((t) => t.id === current?.color);
  useEffect(() => {
    try {
      const raw =
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
                s.routeVersion === 2 ? Math.floor(Number(s.step)) || 0 : 0,
                route(s.pattern).length,
              ),
            ),
          );
          setMessage(
            s.routeVersion === 2
              ? '前回の図案と進み具合を復元しました'
              : '図案を復元しました。下糸の向きを変更したため、運針は最初からになります。',
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
        'ito-project-v2',
        JSON.stringify({ pattern, step, routeVersion: 2 }),
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
  function convert(w = width, c = colors) {
    const img = source.current;
    if (!img) return;
    const ratio = img.height / img.width;
    const h = Math.max(1, Math.min(120, Math.round(w * ratio)));
    const actualW = Math.max(1, Math.min(120, Math.round(h / ratio)));
    const canvas = document.createElement('canvas');
    canvas.width = actualW;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, actualW, h);
    update(
      quantize(
        ctx.getImageData(0, 0, actualW, h).data,
        actualW,
        h,
        c,
        sourceName || 'マイ図案',
      ),
    );
    setMessage('図案を更新しました。運針は最初からになります。');
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
        const h = Math.max(
          1,
          Math.min(120, Math.round((width * img.height) / img.width)),
        );
        const w = Math.max(
          1,
          Math.min(120, Math.round((h * img.width) / img.height)),
        );
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        update(
          quantize(
            ctx.getImageData(0, 0, w, h).data,
            w,
            h,
            colors,
            file.name.replace(/\.[^.]+$/, ''),
          ),
        );
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
  function edit(i: number) {
    if (paint === undefined || view !== 'pattern') return;
    const cells = [...pattern.cells];
    cells[i] = paint;
    update({ ...pattern, cells });
  }
  function download(text: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        return `<rect x="${x}" y="${y}" width="22" height="22" fill="${t.hex}" stroke="#888" stroke-width=".5"/><text x="${x + 11}" y="${y + 15}" text-anchor="middle" font-size="12" fill="${ink(t.hex)}">${symbols[palette.indexOf(t)]}</text>`;
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
  const progress = sequence.length
    ? Math.round((step / sequence.length) * 100)
    : 0;
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="ito ホーム">
          ito<span className="brand-stitch">×</span>
        </a>
        <span className="brand-sub">クロスステッチ図案室</span>
        <span className="local-note">
          <span /> {saved ? 'この端末に自動保存' : '端末内で画像を処理'}
        </span>
        <button className="outline" onClick={exportSvg}>
          <Download size={16} />
          図案を保存
        </button>
      </header>
      <div className="intro">
        <div>
          <div className="eyebrow">YOUR IMAGE, ONE STITCH AT A TIME</div>
          <h1>ひと針ずつ、かたちに。</h1>
        </div>
        <p>
          好きな画像を、あなたの図案へ。
          <br />
          針の道すじも、一緒に。
        </p>
      </div>
      <main className="workspace">
        <aside className="settings">
          <div className="panel-heading">
            <span className="section-number">01</span>
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
            <span>または、ここにドラッグ</span>
            <small>JPG / PNG / WebP・20MBまで</small>
          </button>
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
            <div className="range-notes">
              <span>ざっくり</span>
              <span>こまかく</span>
            </div>
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
            <div className="range-notes">
              <span>シンプル</span>
              <span>豊かな色合い</span>
            </div>
          </div>
          <button
            className="primary full"
            disabled={!source.current || busy}
            onClick={() => convert()}
          >
            この設定で図案を更新
            <ArrowRight size={16} />
          </button>
          <p className="micro">
            {sourceName || '画像を選ぶと、目数と色数を調整できます。'}
            <br />
            縦横比を保ち、最大120目に収めます。
          </p>
          <div className="divider" />
          <div className="palette-heading">
            <h3>糸のパレット</h3>
            <span>DMC · {palette.length}色</span>
          </div>
          <p className="micro">色を選んで、図案のマスを修正できます。</p>
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
            <p>例：少しだけ残った E を、A に置き換える。</p>
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
            <p className="micro">
              図案全体の該当色を置き換えます。統合後は記号を振り直し、運針は最初からになります。「一つ戻す」で取り消せます。
            </p>
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
          <p className="micro source-note">
            DMCの実在する32色から選びます。表示色は近似値です。購入前に実物の色見本をご確認ください。
            <a
              href="https://www.dmc.com/GB/en-GB/products/embroidery-thread-shade-card-printed"
              target="_blank"
              rel="noreferrer"
            >
              DMC 色見本 ↗
            </a>
          </p>
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
            {view !== 'guide' && (
              <button
                className={'symbol-toggle ' + (showSymbols ? 'on' : '')}
                aria-pressed={showSymbols}
                onClick={() => setShowSymbols(!showSymbols)}
              >
                A 記号
              </button>
            )}
          </div>
          <div className="project-heading">
            <div>
              <h2>{pattern.name}</h2>
              <span>
                {pattern.width} × {pattern.height}目 <b>·</b>{' '}
                {stitched.toLocaleString()} stitches <b>·</b> {palette.length}{' '}
                colors
              </span>
            </div>
            <span className="sample-tag">
              {sourceName ? 'MY PATTERN' : 'STITCH PATTERN'}
            </span>
          </div>
          {view === 'guide' ? (
            <RouteOverview pattern={pattern} />
          ) : (
            <>
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
                    className={
                      'pattern-grid ' + (paint !== undefined ? 'painting' : '')
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
                    {pattern.cells.map((c, i) => {
                      const t = threads.find((t) => t.id === c);
                      const x = i % pattern.width,
                        y = Math.floor(i / pattern.width);
                      const faded =
                        view === 'step' && current && c !== current.color;
                      return (
                        <g
                          key={i}
                          opacity={faded ? 0.2 : 1}
                          onClick={() => edit(i)}
                        >
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
                                {symbols[palette.indexOf(t)]}
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
              <div className="canvas-bottom">
                <div className="edit-tools">
                  <button
                    aria-label="選択を解除"
                    className={paint === undefined ? 'active' : ''}
                    onClick={() => setPaint(undefined)}
                  >
                    <Grid2X2 size={17} />
                  </button>
                  <button
                    aria-label="消しゴム"
                    className={paint === null ? 'active' : ''}
                    onClick={() => {
                      setPaint(null);
                      setView('pattern');
                    }}
                  >
                    <Eraser size={17} />
                  </button>
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
                  <span>
                    {paint === null
                      ? '消しゴム'
                      : paint
                        ? 'DMC ' + paint + ' で描く'
                        : '色を選ぶと編集できます'}
                  </span>
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
                </div>
              </div>
            </>
          )}
        </section>
        <aside className="guide-panel">
          <div className="panel-heading">
            <span className="section-number">02</span>
            <h2>針の道しるべ</h2>
            <span className="beta">BETA</span>
          </div>
          {view === 'guide' ? (
            <OverviewHelp />
          ) : (
            <>
              <p className="guide-intro">
                出す穴と、入れる穴。
                <br />
                ひと針ずつ確認して進めましょう。
              </p>
              {current && step < sequence.length ? (
                <>
                  <div className="current-thread">
                    <span
                      className="swatch"
                      style={{ background: active?.hex }}
                    />
                    <div>
                      <small>いま使う糸</small>
                      <strong>
                        DMC {active?.id} <span>{active?.name}</span>
                      </strong>
                    </div>
                  </div>
                  <div
                    className={
                      'instruction ' + (current.kind === 'turn' ? 'turn' : '')
                    }
                  >
                    <span className="step-label">
                      STEP {step + 1} / {sequence.length}
                    </span>
                    <h3>
                      {current.kind === 'cut' ? (
                        <Scissors size={19} />
                      ) : current.kind === 'turn' ? (
                        <RotateCcw size={19} />
                      ) : (
                        <ArrowRight size={19} />
                      )}{' '}
                      {labels[current.kind]}
                    </h3>
                    <HoleDiagram from={current.from} to={current.to} />
                    <div className="hole-legend">
                      <span>
                        <i className="out-dot" />
                        針を出す
                      </span>
                      <span>
                        <i className="in-dot" />
                        針を入れる
                      </span>
                    </div>
                    <div className="coordinates">
                      <p>
                        出す穴 <strong>({current.from.join(', ')})</strong>
                      </p>
                      <ArrowRight size={16} />
                      <p>
                        入れる穴 <strong>({current.to.join(', ')})</strong>
                      </p>
                    </div>
                    <p className="instruction-note">
                      {current.kind === 'cut'
                        ? '裏で糸を始末して切り、新しい糸を固定してから再開します。'
                        : current.kind === 'jump'
                          ? `前の穴から裏側を約${current.travel.toFixed(1)}目分移動します。糸を強く引きすぎないで。`
                          : current.kind === 'turn'
                            ? '右端まで来ました。上に重なる「／」を刺して、左へ戻ります。'
                            : current.kind === 'start'
                              ? step > 0
                                ? '前の色の糸を裏で始末します。新しい色の糸を固定して、緑の穴から出します。'
                                : '裏側で糸を固定してから、緑の穴に針を出します。'
                              : '緑の穴から表へ出し、オレンジの穴から裏へ入れます。'}
                    </p>
                  </div>
                  <button
                    className="primary full next"
                    onClick={() => {
                      setStep((s) => Math.min(sequence.length, s + 1));
                      setView('step');
                    }}
                  >
                    刺した、次のひと針へ
                    <ArrowRight size={17} />
                  </button>
                  <button
                    className="back"
                    disabled={step === 0}
                    onClick={() => {
                      setStep((s) => s - 1);
                      setView('step');
                    }}
                  >
                    <ArrowLeft size={15} />
                    ひと針戻る
                  </button>
                </>
              ) : (
                <div className="finished">
                  <Check size={32} />
                  <h3>
                    {stitched ? 'できあがり！' : '糸色を選んで描いてみよう'}
                  </h3>
                  <p>
                    {stitched
                      ? '最後に裏側で糸を始末しましょう。'
                      : '色のあるマスから運針が作られます。'}
                  </p>
                  <button className="outline" onClick={() => setStep(0)}>
                    最初に戻る
                  </button>
                </div>
              )}
              <div className="progress-label">
                <span>運針の進み具合</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-track">
                <div style={{ width: progress + '%' }} />
              </div>
              <p className="micro">
                1ステップ＝片方の斜めのひと針。
                <br />
                穴の座標は図案の左上が (0, 0) です。
              </p>
              <details className="route-rules">
                <summary>運針の基本パターン</summary>
                <p>
                  ① 下糸「＼」を右へ刺す
                  <br />② 上糸「／」で左へ戻る
                  <br />③ 次のまとまりへ裏側を移動
                  <br />④ 3目を超える移動は糸を切って再開
                </p>
                <p>
                  下糸は「＼」、上糸は「／」に統一します。裏側の糸始末は手作業です。最短経路や絡まないことを保証するものではありません。
                </p>
              </details>
              <button className="text-button" onClick={exportRoute}>
                <Download size={15} />
                運針表をCSVで保存
              </button>
            </>
          )}
        </aside>
      </main>
      <footer>
        <output className="status">
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
              JSON.stringify({ pattern, step, routeVersion: 2 }),
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
                      s.routeVersion === 2
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
function HoleDiagram({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) {
  const minX = Math.min(from[0], to[0]),
    minY = Math.min(from[1], to[1]);
  const a = [(from[0] - minX) * 90 + 55, (from[1] - minY) * 90 + 35],
    b = [(to[0] - minX) * 90 + 55, (to[1] - minY) * 90 + 35];
  return (
    <svg
      className="hole-diagram"
      viewBox="0 0 200 165"
      role="img"
      aria-label={`穴${from.join(',')}から出し、穴${to.join(',')}へ入れる`}
    >
      <defs>
        <pattern id="cloth" width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M9 0H0V9" fill="none" stroke="#d7ded4" strokeWidth=".6" />
        </pattern>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" fill="#204e45" />
        </marker>
      </defs>
      <rect width="200" height="165" rx="8" fill="url(#cloth)" />
      {[55, 145].flatMap((x) =>
        [35, 125].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#8a9990" />
        )),
      )}
      <path
        d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`}
        stroke="#204e45"
        strokeWidth="4"
        strokeDasharray="5 3"
        markerEnd="url(#arrow)"
      />
      <circle
        cx={a[0]}
        cy={a[1]}
        r="14"
        fill="#16866d"
        stroke="white"
        strokeWidth="3"
      />
      <text
        x={a[0]}
        y={a[1] + 5}
        textAnchor="middle"
        fontSize="14"
        fill="white"
      >
        出
      </text>
      <circle
        cx={b[0]}
        cy={b[1]}
        r="14"
        fill="#d95b32"
        stroke="white"
        strokeWidth="3"
      />
      <text
        x={b[0]}
        y={b[1] + 5}
        textAnchor="middle"
        fontSize="14"
        fill="white"
      >
        入
      </text>
    </svg>
  );
}

function OverviewHelp() {
  return (
    <div className="overview-help">
      <h3>色ごとに、道すじを一覧。</h3>
      <p>見たい糸色を選ぶと、その色の運針をまとめて表示します。</p>
      <ol>
        <li>
          図の <b>区間1</b> から始める
        </li>
        <li>
          下糸 <b>＼</b> を右へ刺す
        </li>
        <li>
          右端で折り返し、上糸 <b>／</b> で左へ戻る
        </li>
        <li>移動の案内を確認して次の区間へ</li>
      </ol>
      <div className="route-key">
        <p>
          <span className="lower-key">青い線</span> 下糸・往路 →
        </p>
        <p>
          <span className="upper-key">橙の線</span> 上糸・復路 ←
        </p>
        <p>点線：裏側の移動</p>
        <p>✂：糸を始末して再開</p>
      </div>
      <p>
        下の区間一覧には、出す穴・入れる穴と順番をすべて表示します。1ステップずつ送る必要はありません。
      </p>
      <p className="micro">
        区間ごとに「下糸→上糸」を完了してください。図案全体の下糸を先に刺す順番ではありません。
      </p>
    </div>
  );
}
