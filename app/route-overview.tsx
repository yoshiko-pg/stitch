/* oxlint-disable jsx-a11y/prefer-tag-over-role */
import { useMemo, useState, useId } from 'react';
import { colorRuns, threads, type Pattern, type RouteRun } from '@/lib/stitch';

export function RouteOverview({ pattern }: { pattern: Pattern }) {
  const palette = useMemo(
    () => threads.filter((t) => pattern.cells.includes(t.id)),
    [pattern],
  );
  const [selected, setSelected] = useState('');
  const color = palette.find((t) => t.id === selected) || palette[0];
  const runs = useMemo(
    () => colorRuns(pattern, color?.id || ''),
    [pattern, color?.id],
  );
  const marker = useId().replace(/:/g, '');
  if (!color)
    return (
      <p className="overview-empty">色のあるマスを作ると運針が表示されます。</p>
    );
  return (
    <div className="route-overview">
      <div className="route-color-list" aria-label="運針を表示する糸色">
        {palette.map((t) => (
          <button
            key={t.id}
            aria-pressed={color.id === t.id}
            className={color.id === t.id ? 'selected' : ''}
            onClick={() => setSelected(t.id)}
          >
            <i style={{ background: t.hex }} />
            DMC {t.id}
          </button>
        ))}
      </div>
      <div className="overview-title">
        <div>
          <h3>
            DMC {color.id} <span>{color.name}</span>
          </h3>
          <p>
            {runs.length}区間・
            {runs.reduce((n, r) => n + r.steps.length / 2, 0)}目 —
            区間1から番号順に
          </p>
        </div>
      </div>
      <p className="overview-caption">
        区間の位置と順番 <span>青：下糸 ＼　橙：上糸 ／</span>
      </p>
      <div className="overview-map-scroll">
        <svg
          width="100%"
          viewBox={`-1.5 -1.5 ${pattern.width + 3} ${pattern.height + 3}`}
          role="img"
          aria-label={`DMC ${color.id}の${runs.length}区間の位置。区間番号順に進みます。`}
        >
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10z" fill="#819386" />
            </marker>
          </defs>
          <rect
            x="0"
            y="0"
            width={pattern.width}
            height={pattern.height}
            fill="white"
          />
          {pattern.cells.map((c, i) => (
            <rect
              key={i}
              x={i % pattern.width}
              y={Math.floor(i / pattern.width)}
              width="1"
              height="1"
              fill={c === color.id ? color.hex : '#f3f5f0'}
              fillOpacity={c === color.id ? 0.22 : 1}
              stroke="#d6dfd4"
              strokeWidth=".025"
            />
          ))}
          {Array.from({ length: Math.floor(pattern.width / 5) + 1 }, (_, i) => (
            <text key={i} x={i * 5} y={-0.5} fontSize=".4" textAnchor="middle">
              {i * 5}
            </text>
          ))}
          {Array.from(
            { length: Math.floor(pattern.height / 5) + 1 },
            (_, i) => (
              <text
                key={i}
                x={-0.7}
                y={i * 5 + 0.2}
                fontSize=".4"
                textAnchor="middle"
              >
                {i * 5}
              </text>
            ),
          )}
          {runs.map((run, i) => {
            const first = run.steps[0],
              x = Math.min(...run.steps.map((s) => s.cell % pattern.width)),
              y = Math.floor(first.cell / pattern.width),
              length = run.steps.length / 2;
            const reversed = isReversed(run);
            const prev = i ? runs[i - 1].steps.at(-1) : null;
            return (
              <g key={run.id}>
                {prev && first.kind === 'jump' && (
                  <path
                    d={`M${prev.to[0]} ${prev.to[1]} Q${Math.max(prev.to[0], x) + 1} ${y - 0.5} ${first.from.join(' ')}`}
                    stroke="#819386"
                    strokeWidth=".06"
                    fill="none"
                    strokeDasharray=".12 .12"
                    markerEnd={`url(#${marker})`}
                  />
                )}
                <path
                  d={
                    reversed
                      ? `M${x + length - 0.12} ${y + 0.2}H${x + 0.12}l.16 -.09m-.16 .09l.16 .09`
                      : `M${x + 0.12} ${y + 0.2}H${x + length - 0.12}l-.16 -.09m.16 .09l-.16 .09`
                  }
                  stroke="#2376a0"
                  strokeWidth=".07"
                  fill="none"
                />
                <path
                  d={
                    reversed
                      ? `M${x + 0.12} ${y + 0.8}H${x + length - 0.12}l-.16 -.09m.16 .09l-.16 .09`
                      : `M${x + length - 0.12} ${y + 0.8}H${x + 0.12}l.16 -.09m-.16 .09l.16 .09`
                  }
                  stroke="#c86832"
                  strokeWidth=".07"
                  fill="none"
                />
                <rect
                  x={x + length / 2 - 0.34}
                  y={y + 0.3}
                  width=".68"
                  height=".4"
                  rx=".1"
                  fill="#fff"
                  stroke="#8b9e8b"
                  strokeWidth=".02"
                />
                <text
                  x={x + length / 2}
                  y={y + 0.6}
                  textAnchor="middle"
                  fontSize=".3"
                  fontWeight="bold"
                >
                  {run.id}
                </text>
                {first.kind === 'cut' && (
                  <text
                    x={reversed ? x + length + 0.1 : x - 0.4}
                    y={y + 0.65}
                    fontSize=".4"
                    fill="#ad4827"
                  >
                    ✂
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="all-runs-heading">
        <h3>全区間の穴と順番</h3>
        <p>
          ● 針を出す　■ 針を入れる
          <br />
          穴に付いた数字を、小さい順にたどります。
        </p>
      </div>
      <ol className="run-list">
        {runs.map((run, i) => {
          const first = run.steps[0],
            last = run.steps.at(-1)!;
          const prev = i ? runs[i - 1].steps.at(-1) : null;
          return (
            <li key={run.id}>
              <div className="run-heading">
                <strong>区間 {run.id}</strong>
                <span>
                  {run.steps.length / 2}目 · {(first.cell % pattern.width) + 1}
                  列目から / {Math.floor(first.cell / pattern.width) + 1}段目
                </span>
              </div>
              <p
                className={
                  'run-transition ' + (first.kind === 'cut' ? 'cut' : '')
                }
              >
                {first.kind === 'start'
                  ? `開始：穴 (${first.from.join(', ')}) で新しい糸を固定`
                  : first.kind === 'cut'
                    ? `✂ 区間${run.id - 1}で糸を始末し、穴 (${first.from.join(', ')}) で新しく固定`
                    : `裏側を移動：(${prev?.to.join(', ')}) → (${first.from.join(', ')}) · 約${first.travel.toFixed(1)}目`}
              </p>
              <div className="run-diagrams">
                <RunDiagram run={run} upper={false} />
                <div className="turn-between">
                  右端で
                  <br />
                  折り返す ↘
                </div>
                <RunDiagram run={run} upper />
              </div>
              {i === runs.length - 1 && (
                <p className="run-end">
                  この色はここまで。最後の穴 ({last.to.join(', ')})
                  の裏側で糸を始末します。
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
function RunDiagram({ run, upper }: { run: RouteRun; upper: boolean }) {
  const half = run.steps.length / 2;
  const steps = upper ? run.steps.slice(half) : run.steps.slice(0, half);
  return (
    <>
      {Array.from({ length: Math.ceil(steps.length / 8) }, (_, i) => (
        <RunDiagramPart
          key={i}
          run={run}
          upper={upper}
          steps={steps.slice(i * 8, i * 8 + 8)}
          continued={i > 0}
        />
      ))}
    </>
  );
}
function RunDiagramPart({
  run,
  upper,
  steps,
  continued,
}: {
  run: RouteRun;
  upper: boolean;
  steps: RouteRun['steps'];
  continued: boolean;
}) {
  const length = steps.length;
  const left = run.steps[0].cell; // Coordinates below come from actual route holes, not reconstructed directions.
  const minX = Math.min(...steps.flatMap((s) => [s.from[0], s.to[0]]));
  const minY = Math.min(...steps.flatMap((s) => [s.from[1], s.to[1]]));
  const pitch = 76,
    pad = 32,
    w = length * pitch + pad * 2;
  const tone = upper ? '#c86832' : '#2376a0';
  return (
    <section
      className="run-layer"
      aria-label={`区間${run.id} ${upper ? '上糸' : '下糸'}`}
      data-cell={left}
    >
      <h4 style={{ color: tone }}>
        {upper
          ? isReversed(run)
            ? '② 上糸 ／ → 右へ戻る'
            : '② 上糸 ／ ← 左へ戻る'
          : isReversed(run)
            ? '① 下糸 ＼ ← 左へ進む'
            : '① 下糸 ＼ → 右へ進む'}
      </h4>
      {continued && <p>続き：前の図の番号から順に進みます。</p>}
      <div className="run-layer-scroll">
        <svg
          width={w}
          height="132"
          viewBox={`0 0 ${w} 132`}
          role="img"
          aria-label={steps
            .map(
              (s) =>
                `${s.needleNumber * 2 - 1}番で穴${s.from.join(',')}から出し、${s.needleNumber * 2}番で穴${s.to.join(',')}に入れる`,
            )
            .join('。')}
        >
          {Array.from({ length: length + 1 }, (_, i) => (
            <g key={i}>
              <path d={`M${pad + i * pitch} 30V90`} stroke="#dce3da" />
              <text
                x={pad + i * pitch}
                y="125"
                fontSize="12"
                textAnchor="middle"
                fill="#6c7b6a"
              >
                x={minX + i}
              </text>
            </g>
          ))}
          <path
            d={`M${pad} 30H${w - pad}M${pad} 90H${w - pad}`}
            stroke="#dce3da"
          />
          {steps.map((s) => {
            const ax = (s.from[0] - minX) * pitch + pad,
              ay = (s.from[1] - minY) * 60 + 30,
              bx = (s.to[0] - minX) * pitch + pad,
              by = (s.to[1] - minY) * 60 + 30;
            return (
              <g key={s.needleNumber}>
                <path
                  d={`M${ax} ${ay}L${bx} ${by}`}
                  stroke={tone}
                  strokeWidth="3"
                />
                <circle cx={ax} cy={ay} r="20" fill="#17765e" />
                <rect
                  x={bx - 20}
                  y={by - 20}
                  width="40"
                  height="40"
                  rx="3"
                  fill="#b5542e"
                />
                <text
                  x={ax}
                  y={ay + 4}
                  fontSize="12"
                  fill="white"
                  textAnchor="middle"
                >
                  {s.needleNumber * 2 - 1}
                </text>
                <text
                  x={bx}
                  y={by + 4}
                  fontSize="12"
                  fill="white"
                  textAnchor="middle"
                >
                  {s.needleNumber * 2}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p>
        上の穴 y={minY} ／ 下の穴 y={minY + 1}　（左上が 0, 0）
      </p>
    </section>
  );
}

function isReversed(run: RouteRun) {
  const upper = run.steps[run.steps.length / 2];
  return upper.from[0] < upper.to[0];
}
