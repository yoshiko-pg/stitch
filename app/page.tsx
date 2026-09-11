"use client";
// Client-only persistence deliberately hydrates after mount; the compiler rule also reports an internal PruneHoistedContexts invariant here.
/* oxlint-disable react/react-compiler */
// Inline SVGs require an accessible image role; replacing them with img would lose their dynamic geometry.
/* oxlint-disable jsx-a11y/prefer-tag-over-role */
// The pattern board is an interactive drawing surface despite its image role.
/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions */
import { DotTextTool } from "@/components/dot-text-tool";
import { RouteOverview } from "./route-overview";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Upload,
  ArrowRight,
  Grid2X2,
  Route,
  ZoomIn,
  ZoomOut,
  Undo2,
  Eraser,
  BoxSelect,
  Ruler,
  Plus,
  Ellipsis,
  Save,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  threads,
  sample,
  quantize,
  trimPattern,
  moveRegion,
  resizePattern,
  cellStyle,
  cellStyles,
  cellLines,
  type CellStyle,
  type LineSegment,
  type Pattern,
  type Region,
} from "@/lib/stitch";
import {
  representativePixels,
  simplifySpeckles,
  type ConversionMode,
} from "@/lib/image-processing";
const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
export default function Home() {
  const [pattern, setPattern] = useState<Pattern>(sample);
  const [width, setWidth] = useState(48);
  const [canvasWidth, setCanvasWidth] = useState("32");
  const [canvasHeight, setCanvasHeight] = useState("32");
  const validCanvasSize = [canvasWidth, canvasHeight].every(
    (value) =>
      Number.isInteger(Number(value)) &&
      Number(value) >= 1 &&
      Number(value) <= 120,
  );
  const [colors, setColors] = useState(8);
  const [conversionMode, setConversionMode] =
    useState<ConversionMode>("illustration");
  const [speckles, setSpeckles] = useState(0);
  const [view, setView] = useState("pattern");
  const [tool, setTool] = useState("draw");
  const [showSymbols, setShowSymbols] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [paint, setPaint] = useState<string | null | undefined>();
  const [mergeFrom, setMergeFrom] = useState("");
  const [mergeTo, setMergeTo] = useState("");
  const [history, setHistory] = useState<Pattern[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const source = useRef<HTMLImageElement | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const board = useRef<SVGSVGElement>(null);

  const [draft, setDraft] = useState<Pattern | null>(null);
  const stroke = useRef<{
    pointerId: number;
    original: Pattern;
    cells: (string | null)[];
    styles: (CellStyle | null)[];
    lines: (string | null)[];
    color: string | null;
    mode: "fill" | "lines";
    brush: CellStyle | null;
    segments: string;
    last: [number, number] | null;
    changed: boolean;
  } | null>(null);
  const [brush, setBrush] = useState<CellStyle | null>(null);
  const [lineBrush, setLineBrush] = useState("");
  const [brushMode, setBrushMode] = useState<"fill" | "lines">("fill");
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<Region | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [measure, setMeasure] = useState<Region | null>(null);
  const measureDrag = useRef<{
    pointerId: number;
    anchor: [number, number];
  } | null>(null);
  const selectDrag = useRef<
    | { pointerId: number; kind: "draw"; anchor: [number, number] }
    | {
        pointerId: number;
        kind: "move";
        origin: [number, number];
        region: Region;
        original: Pattern;
        offset: [number, number];
      }
    | null
  >(null);
  // A new paint tool or a resized pattern makes the current selection stale.
  useEffect(() => {
    if (paint !== undefined) {
      setSelecting(false);
      setSelection(null);
      setMeasuring(false);
      setMeasure(null);
    }
  }, [paint]);
  useEffect(() => {
    setSelection(null);
    setMeasure(null);
  }, [pattern.width, pattern.height]);
  // Keep the size fields prefilled with the current canvas size.
  useEffect(() => {
    setCanvasWidth(String(pattern.width));
    setCanvasHeight(String(pattern.height));
  }, [pattern.width, pattern.height]);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const shown = draft || pattern;
  const trimmedPattern = useMemo(() => trimPattern(pattern), [pattern]);
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
    setMergeFrom("");
    setView("pattern");
    setMessage(
      `DMC ${mergeSource.id} の ${mergeCount}目を DMC ${mergeTarget.id} にまとめました。「一つ戻す」で取り消せます。`,
    );
  }
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("ito-project-v3") ||
        localStorage.getItem("ito-project-v2") ||
        localStorage.getItem("ito-project-v1");
      if (raw) {
        const s = JSON.parse(raw);
        if (valid(s.pattern)) {
          setPattern(s.pattern);
          setMessage("前回の図案を復元しました");
        }
      }
    } catch {
      setMessage("保存データを読み込めませんでした");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("ito-project-v3", JSON.stringify({ pattern }));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [pattern, ready]);
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
      (p.styles === undefined ||
        (Array.isArray(p.styles) &&
          p.styles.length === p.cells.length &&
          p.styles.every(
            (s) => s === null || cellStyles.includes(s as CellStyle),
          ))) &&
      (p.lines === undefined ||
        (Array.isArray(p.lines) &&
          p.lines.length === p.cells.length &&
          p.lines.every(
            (l) =>
              l === null ||
              (typeof l === "string" &&
                /^[^:]+:[trbldu]{1,6}$/.test(l) &&
                threads.some((t) => t.id === l.slice(0, l.indexOf(":")))),
          ))) &&
      typeof p.name === "string"
    );
  }
  function update(p: Pattern) {
    setHistory((h) => [...h.slice(-19), pattern]);
    setPattern(p);
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
    const canvas = document.createElement("canvas");
    let pixels: Uint8ClampedArray;
    if (conversionMode === "illustration") {
      // Bound source readback memory; nearest sampling never blends source colours.
      const scale = Math.min(
        1,
        2048 / Math.max(img.naturalWidth, img.naturalHeight),
      );
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d")!;
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
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = conversionMode === "photo";
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, actualW, h);
      pixels = ctx.getImageData(0, 0, actualW, h).data;
    }
    const result = quantize(pixels, actualW, h, count, name);
    return conversionMode === "illustration"
      ? simplifySpeckles(result, speckles)
      : result;
  }
  function convert(w = width, c = colors) {
    if (!source.current) return;
    try {
      update(imagePattern(source.current, sourceName || "マイ図案", w, c));
      setMessage("図案を更新しました。");
    } catch {
      setMessage("画像を処理できませんでした。小さい画像でお試しください。");
    }
  }
  function load(file?: File) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMessage("20MB以下の画像を選んでください");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setMessage("PNG・JPEG・WebPの画像を選んでください");
      return;
    }
    setBusy(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        source.current = img;
        setSourceName(file.name);
        update(imagePattern(img, file.name.replace(/\.[^.]+$/, "")));
        setMessage("画像から図案を作りました");
        setView("pattern");
      } catch {
        setMessage("画像を処理できませんでした");
      } finally {
        setBusy(false);
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      setMessage("画像を読み込めませんでした");
      setBusy(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }
  function pointerCell(e: {
    clientX: number;
    clientY: number;
    currentTarget: SVGSVGElement;
  }): [number, number] | null {
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
      if (active.mode === "lines") {
        // The line brush stamps exactly the selected segments; the eraser removes them.
        const value =
          active.color === null ? null : `${active.color}:${active.segments}`;
        if (active.lines[i] !== value) {
          active.lines[i] = value;
          active.changed = true;
          changed = true;
        }
      } else {
        const style = active.color === null ? null : active.brush;
        if (
          active.cells[i] !== active.color ||
          active.styles[i] !== style ||
          (active.color === null && active.lines[i] !== null)
        ) {
          active.cells[i] = active.color;
          active.styles[i] = style;
          if (active.color === null) active.lines[i] = null;
          active.changed = true;
          changed = true;
        }
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
    if (changed)
      setDraft({
        ...active.original,
        cells: [...active.cells],
        styles: [...active.styles],
        lines: [...active.lines],
      });
  }
  const lineMode = brushMode === "lines" && lineBrush.length > 0;
  const canPaint = paint !== undefined || lineMode;
  function beginStroke(e: ReactPointerEvent<SVGSVGElement>) {
    if (
      view !== "pattern" ||
      !canPaint ||
      e.button !== 0 ||
      !e.isPrimary ||
      stroke.current ||
      !pointerCell(e)
    )
      return;
    e.preventDefault();
    const blank = () =>
      Array.from({ length: pattern.cells.length }, () => null);
    stroke.current = {
      pointerId: e.pointerId,
      original: pattern,
      cells: [...pattern.cells],
      styles: pattern.styles ? [...pattern.styles] : blank(),
      lines: pattern.lines ? [...pattern.lines] : blank(),
      color: paint === undefined ? "310" : paint,
      mode: lineMode ? "lines" : "fill",
      brush,
      segments: lineBrush,
      last: null,
      changed: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    paintStroke(e);
  }
  function finishStroke(e: ReactPointerEvent<SVGSVGElement>) {
    const active = stroke.current;
    if (!active || active.pointerId !== e.pointerId) return;
    if (e.type === "pointerup") paintStroke(e);
    stroke.current = null;
    if (active.changed) {
      setHistory((h) => [...h.slice(-19), active.original]);
      setPattern({
        ...active.original,
        cells: active.cells,
        styles: active.styles,
        lines: active.lines,
      });
    }
    setDraft(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function pointerCellClamped(
    e: ReactPointerEvent<SVGSVGElement>,
  ): [number, number] | null {
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      matrix.inverse(),
    );
    return [
      Math.max(0, Math.min(pattern.width - 1, Math.floor(point.x))),
      Math.max(0, Math.min(pattern.height - 1, Math.floor(point.y))),
    ];
  }
  function beginSelect(e: ReactPointerEvent<SVGSVGElement>) {
    if (
      view !== "pattern" ||
      !selecting ||
      e.button !== 0 ||
      !e.isPrimary ||
      selectDrag.current ||
      !pointerCell(e)
    )
      return;
    const cell = pointerCellClamped(e);
    if (!cell) return;
    e.preventDefault();
    const inside =
      selection &&
      cell[0] >= selection.x &&
      cell[0] < selection.x + selection.width &&
      cell[1] >= selection.y &&
      cell[1] < selection.y + selection.height;
    selectDrag.current = inside
      ? {
          pointerId: e.pointerId,
          kind: "move",
          origin: cell,
          region: selection,
          original: pattern,
          offset: [0, 0],
        }
      : { pointerId: e.pointerId, kind: "draw", anchor: cell };
    if (!inside) setSelection({ x: cell[0], y: cell[1], width: 1, height: 1 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveSelect(e: ReactPointerEvent<SVGSVGElement>) {
    const active = selectDrag.current;
    if (!active || active.pointerId !== e.pointerId) return;
    const cell = pointerCellClamped(e);
    if (!cell) return;
    if (active.kind === "draw") {
      const [ax, ay] = active.anchor;
      setSelection({
        x: Math.min(ax, cell[0]),
        y: Math.min(ay, cell[1]),
        width: Math.abs(cell[0] - ax) + 1,
        height: Math.abs(cell[1] - ay) + 1,
      });
      return;
    }
    // Keep the whole region on the canvas so no stitch is dropped off an edge.
    const dx = Math.max(
      -active.region.x,
      Math.min(
        pattern.width - active.region.x - active.region.width,
        cell[0] - active.origin[0],
      ),
    );
    const dy = Math.max(
      -active.region.y,
      Math.min(
        pattern.height - active.region.y - active.region.height,
        cell[1] - active.origin[1],
      ),
    );
    if (dx === active.offset[0] && dy === active.offset[1]) return;
    active.offset = [dx, dy];
    setDraft(moveRegion(active.original, active.region, dx, dy));
    setSelection({
      ...active.region,
      x: active.region.x + dx,
      y: active.region.y + dy,
    });
  }
  function endSelect(e: ReactPointerEvent<SVGSVGElement>) {
    const active = selectDrag.current;
    if (!active || active.pointerId !== e.pointerId) return;
    if (e.type === "pointerup") moveSelect(e);
    selectDrag.current = null;
    setDraft(null);
    if (active.kind === "move") {
      // An interrupted drag reverts; only a completed pointerup commits the move.
      const next =
        e.type === "pointerup"
          ? moveRegion(active.original, active.region, ...active.offset)
          : active.original;
      if (next !== active.original) {
        setHistory((h) => [...h.slice(-19), active.original]);
        setPattern(next);
        setMessage(
          "選択範囲を移動しました。「一つ戻す」で取り消せます。",
        );
      } else {
        setSelection(active.region);
      }
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function beginMeasure(e: ReactPointerEvent<SVGSVGElement>) {
    if (
      view !== "pattern" ||
      !measuring ||
      e.button !== 0 ||
      !e.isPrimary ||
      measureDrag.current ||
      !pointerCell(e)
    )
      return;
    const cell = pointerCellClamped(e);
    if (!cell) return;
    e.preventDefault();
    measureDrag.current = { pointerId: e.pointerId, anchor: cell };
    setMeasure({ x: cell[0], y: cell[1], width: 1, height: 1 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveMeasure(e: ReactPointerEvent<SVGSVGElement>) {
    const active = measureDrag.current;
    if (!active || active.pointerId !== e.pointerId) return;
    const cell = pointerCellClamped(e);
    if (!cell) return;
    const [ax, ay] = active.anchor;
    setMeasure({
      x: Math.min(ax, cell[0]),
      y: Math.min(ay, cell[1]),
      width: Math.abs(cell[0] - ax) + 1,
      height: Math.abs(cell[1] - ay) + 1,
    });
  }
  function endMeasure(e: ReactPointerEvent<SVGSVGElement>) {
    const active = measureDrag.current;
    if (!active || active.pointerId !== e.pointerId) return;
    if (e.type === "pointerup") moveMeasure(e);
    measureDrag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  const brushOptions: {
    style: CellStyle | null;
    mark: string;
    label: string;
  }[] = [
    { style: null, mark: "■", label: "全面" },
    { style: "tl", mark: "◤", label: "左上の三角" },
    { style: "tr", mark: "◥", label: "右上の三角" },
    { style: "bl", mark: "◣", label: "左下の三角" },
    { style: "br", mark: "◢", label: "右下の三角" },
  ];
  const glyphSegments: {
    segment: LineSegment;
    label: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }[] = [
    { segment: "t", label: "上の罫線", x1: 3, y1: 3, x2: 19, y2: 3 },
    { segment: "b", label: "下の罫線", x1: 3, y1: 19, x2: 19, y2: 19 },
    { segment: "l", label: "左の罫線", x1: 3, y1: 3, x2: 3, y2: 19 },
    { segment: "r", label: "右の罫線", x1: 19, y1: 3, x2: 19, y2: 19 },
    { segment: "d", label: "斜めの罫線（＼）", x1: 3, y1: 3, x2: 19, y2: 19 },
    { segment: "u", label: "斜めの罫線（／）", x1: 19, y1: 3, x2: 3, y2: 19 },
  ];
  function toggleGlyphSegment(segment: LineSegment) {
    const next = lineBrush.includes(segment)
      ? lineBrush.replace(segment, "")
      : lineBrush + segment;
    setLineBrush(next);
    setBrushMode(next ? "lines" : "fill");
    setView("pattern");
  }
  function saveStamp() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }
  function download(text: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function exportPdf() {
    setPdfBusy(true);
    try {
      const { createPatternPdf } = await import("@/lib/pdf-export");
      const doc = await createPatternPdf(pattern, {
        kind: "pattern",
        onProgress: (page) => setMessage(`PDFを作成中… ${page}ページ`),
      });
      doc.save(`ito-pattern-${saveStamp()}.pdf`);
      setMessage("PDFを保存しました");
    } catch {
      setMessage("PDFを作成できませんでした");
    } finally {
      setPdfBusy(false);
    }
  }
  function patternSvg() {
    const cell = 22,
      pad = 35;
    const body = pattern.cells
      .map((c, i) => {
        if (!c) return "";
        const t = threads.find((t) => t.id === c)!;
        const x = (i % pattern.width) * cell + pad,
          y = Math.floor(i / pattern.width) * cell + pad;
        const s = cellStyle(pattern, i);
        if (s === "frame")
          return `<rect x="${x + 2}" y="${y + 2}" width="18" height="18" fill="none" stroke="${t.hex}" stroke-width="3"/>`;
        if (s) {
          const triangle = {
            tl: `M${x} ${y}h${cell}L${x} ${y + cell}Z`,
            tr: `M${x} ${y}h${cell}v${cell}Z`,
            bl: `M${x} ${y}v${cell}h${cell}Z`,
            br: `M${x + cell} ${y}v${cell}h${-cell}Z`,
          };
          return `<path d="${triangle[s]}" fill="${t.hex}"/>`;
        }
        return `<rect x="${x}" y="${y}" width="22" height="22" fill="${t.hex}"/><text x="${x + 11}" y="${y + 15}" text-anchor="middle" font-size="12" fill="${ink(t.hex)}">${symbols[palette.indexOf(t)] || "＋"}</text>`;
      })
      .join("");
    const backstitch = (pattern.lines || [])
      .map((raw, i) => {
        if (!raw) return "";
        const at = cellLines(pattern, i)!;
        const t = threads.find((th) => th.id === at.color);
        if (!t) return "";
        const x = (i % pattern.width) * cell + pad,
          y = Math.floor(i / pattern.width) * cell + pad;
        const paths: Record<string, string> = {
          t: `M${x} ${y}H${x + cell}`,
          r: `M${x + cell} ${y}V${y + cell}`,
          b: `M${x} ${y + cell}H${x + cell}`,
          l: `M${x} ${y}V${y + cell}`,
          d: `M${x} ${y}L${x + cell} ${y + cell}`,
          u: `M${x + cell} ${y}L${x} ${y + cell}`,
        };
        return `<path d="${at.segments
          .split("")
          .map((s) => paths[s])
          .join(
            "",
          )}" fill="none" stroke="${t.hex}" stroke-width="3" stroke-linecap="round"/>`;
      })
      .join("");
    const grid = [
      ...Array.from(
        { length: pattern.width + 1 },
        (_, x) =>
          `<path d="M${x * cell + pad} ${pad}V${pattern.height * cell + pad}" stroke="${x % 10 === 0 ? "#6f807d" : "#b7beb5"}" stroke-width="${x % 10 === 0 ? 1.4 : 0.5}"/>`,
      ),
      ...Array.from(
        { length: pattern.height + 1 },
        (_, y) =>
          `<path d="M${pad} ${y * cell + pad}H${pattern.width * cell + pad}" stroke="${y % 10 === 0 ? "#6f807d" : "#b7beb5"}" stroke-width="${y % 10 === 0 ? 1.4 : 0.5}"/>`,
      ),
    ].join("");
    const legend = palette
      .map(
        (t, i) =>
          `<text x="35" y="${pattern.height * cell + 70 + i * 24}" font-size="15">${symbols[i]} · DMC ${t.id} · ${pattern.cells.filter((c) => c === t.id).length} stitches</text>`,
      )
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(360, pattern.width * cell + 70)}" height="${pattern.height * cell + 100 + palette.length * 24}"><rect width="100%" height="100%" fill="white"/><text x="35" y="23" font-size="16">ito / ${pattern.width} x ${pattern.height}</text>${body}${grid}${backstitch}${legend}</svg>`;
  }
  function exportPng() {
    const url = URL.createObjectURL(
      new Blob([patternSvg()], { type: "image/svg+xml" }),
    );
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setMessage("図案PNGを作成できませんでした");
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          setMessage("図案PNGを作成できませんでした");
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `ito-pattern-${saveStamp()}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
        setMessage("図案PNGを保存しました");
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setMessage("図案PNGを作成できませんでした");
    };
    img.src = url;
  }
  function ink(hex: string) {
    const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return n[0] * 0.299 + n[1] * 0.587 + n[2] * 0.114 > 150
      ? "#243533"
      : "#fff";
  }
  return (
    <div className="app-shell">
      <main className="workspace">
        <aside className="settings" aria-label="図案の設定">
          <Tabs value={tool} onValueChange={(v) => setTool(String(v))}>
            <TabsList>
              <TabsTrigger value="draw">自由に描く</TabsTrigger>
              <TabsTrigger value="text">ドット文字</TabsTrigger>
              <TabsTrigger value="image">画像から</TabsTrigger>
            </TabsList>
          </Tabs>
          {tool === "draw" && (
            <form
              className="freehand-controls"
              onSubmit={(e) => {
                e.preventDefault();
                if (!validCanvasSize || busy) return;
                const w = Number(canvasWidth),
                  h = Number(canvasHeight);
                update({
                  width: w,
                  height: h,
                  cells: Array.from({ length: w * h }, () => null),
                  name: "手描きの図案",
                });
                source.current = null;
                setSourceName("");
                setPaint("310");
                setView("pattern");
                setZoom(1);
                setMessage(
                  `${w}×${h}目のキャンバスを作りました。黒で描けます。糸色は図案上の「＋」から追加できます。「一つ戻す」で前の図案に戻せます。`,
                );
              }}
            >
              <div className="canvas-size-fields">
                <label htmlFor="canvas-width">
                  横の目数
                  <Input
                    id="canvas-width"
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    required
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <label htmlFor="canvas-height">
                  縦の目数
                  <Input
                    id="canvas-height"
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    required
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(e.target.value)}
                    disabled={busy}
                  />
                </label>
              </div>
              <button
                className="primary full"
                type="submit"
                disabled={!validCanvasSize || busy}
              >
                空のキャンバスを作る
              </button>
              <button
                className="outline full"
                type="button"
                disabled={
                  !validCanvasSize ||
                  busy ||
                  (Number(canvasWidth) === pattern.width &&
                    Number(canvasHeight) === pattern.height)
                }
                onClick={() => {
                  const w = Number(canvasWidth),
                    h = Number(canvasHeight);
                  const next = resizePattern(pattern, w, h);
                  if (next === pattern) return;
                  const dropped =
                    pattern.cells.filter(Boolean).length -
                    next.cells.filter(Boolean).length;
                  update(next);
                  setView("pattern");
                  setMessage(
                    `キャンバスを${pattern.width}×${pattern.height}目から${w}×${h}目に変更しました。` +
                      (dropped > 0
                        ? `はみ出した${dropped}目は削除されました。`
                        : "") +
                      "「一つ戻す」で取り消せます。",
                  );
                }}
              >
                今の図案をこのサイズに変更
              </button>
              <button
                className="outline full"
                type="button"
                disabled={trimmedPattern === pattern || busy}
                title="絵柄の外側にある空白の行・列を取り除きます"
                onClick={() => {
                  if (trimmedPattern === pattern) return;
                  update(trimmedPattern);
                  setMessage(
                    `余白を詰めました（${pattern.width}×${pattern.height} → ${trimmedPattern.width}×${trimmedPattern.height}目）。「一つ戻す」で取り消せます。`,
                  );
                }}
              >
                余白を詰める
              </button>
            </form>
          )}
          {tool === "text" && (
            <DotTextTool
              pattern={pattern}
              onPlace={(next) => {
                update(next);
                setView("pattern");
                setPaint(undefined);
                setMessage(
                  "ドット文字を配置しました。「一つ戻す」で取り消せます。",
                );
              }}
            />
          )}
          <input
            ref={upload}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              load(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {tool === "image" && (
            <>
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
                <strong>
                  {busy ? "変換しています…" : "画像をアップロード"}
                </strong>
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
                {conversionMode === "illustration" && (
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
                      <NativeSelectOption value={1}>
                        1目の点だけ
                      </NativeSelectOption>
                      <NativeSelectOption value={2}>
                        2目までの点
                      </NativeSelectOption>
                    </NativeSelect>
                  </>
                )}
              </div>
              <div className="setting">
                <label id="size-label">
                  横の目数{" "}
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
                  使う色数の上限{" "}
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
            </>
          )}
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
              </TabsList>
            </Tabs>
            <output
              className="status"
              title={
                message || "自由に描いて、あなたの図案を作ってみてください。"
              }
            >
              {message || "自由に描いて、あなたの図案を作ってみてください。"}
            </output>
            <Popover>
              <PopoverTrigger className="save-trigger">
                <Save size={15} />
                保存
              </PopoverTrigger>
              <PopoverContent align="end">
                <div className="save-menu">
                  <h4>PDF</h4>
                  <button disabled={pdfBusy} onClick={() => void exportPdf()}>
                    {pdfBusy ? "PDFを作成中…" : "図案PDFを保存"}
                  </button>
                  <h4>画像</h4>
                  <button onClick={exportPng}>図案PNGを保存</button>
                  <h4>作業データ</h4>
                  <button
                    onClick={() =>
                      download(
                        JSON.stringify({ pattern }),
                        `ito-project-${saveStamp()}.json`,
                        "application/json",
                      )
                    }
                  >
                    作業データを保存
                  </button>
                  <label className="import-label">
                    作業データを読み込む
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
                          setSourceName("");
                          setMessage("作業を読み込みました");
                        } catch {
                          setMessage("この作業ファイルは読み込めません");
                        }
                      }}
                    />
                  </label>
                  <p>
                    {saved
                      ? "この端末に自動保存されています"
                      : "画像は端末内で処理されます"}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {view === "guide" ? (
            <RouteOverview pattern={pattern} />
          ) : (
            <>
              <div className="canvas-actions">
                <div className="edit-tools">
                  <RadioGroup
                    className="paint-color-options"
                    aria-label="塗る色"
                    value={paint || ""}
                    onValueChange={(value) => {
                      setPaint(String(value));
                      setView("pattern");
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
                  <Popover>
                    <PopoverTrigger title="ほかの糸色を追加">
                      <Plus size={17} />
                    </PopoverTrigger>
                    <PopoverContent align="start">
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
                                setView("pattern");
                              }}
                            >
                              {t.id}
                            </button>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <button
                    type="button"
                    className={paint === null ? "active" : ""}
                    aria-pressed={paint === null}
                    aria-label="消しゴム"
                    title="消しゴム · ドラッグして目を消す"
                    onClick={() => {
                      setPaint(paint === null ? undefined : null);
                      setView("pattern");
                    }}
                  >
                    <Eraser size={17} />
                  </button>
                  <div
                    className="brush-shapes"
                    role="group"
                    aria-label="塗る形"
                  >
                    {brushOptions.map((option) => (
                      <button
                        key={option.mark}
                        type="button"
                        className={
                          brushMode === "fill" && brush === option.style
                            ? "active"
                            : ""
                        }
                        aria-pressed={
                          brushMode === "fill" && brush === option.style
                        }
                        aria-label={`${option.label}で塗る`}
                        title={`${option.label}で塗る`}
                        onClick={() => {
                          setBrushMode("fill");
                          setBrush(option.style);
                          setView("pattern");
                        }}
                      >
                        {option.mark}
                      </button>
                    ))}
                    <svg
                      className={
                        "line-brush " + (brushMode === "lines" ? "active" : "")
                      }
                      viewBox="0 0 22 22"
                      role="group"
                      aria-label="罫線で塗る · 入れる線をクリックで選択"
                    >
                      <title>罫線で塗る · 入れる線をクリックで選択</title>
                      {glyphSegments.map((seg) => (
                        <g key={seg.segment}>
                          <line
                            x1={seg.x1}
                            y1={seg.y1}
                            x2={seg.x2}
                            y2={seg.y2}
                            stroke={
                              lineBrush.includes(seg.segment)
                                ? "#2c5a41"
                                : "#c9d3c5"
                            }
                            strokeWidth={
                              lineBrush.includes(seg.segment) ? 2.6 : 1.8
                            }
                            strokeLinecap="round"
                            pointerEvents="none"
                          />
                          <line
                            x1={seg.x1}
                            y1={seg.y1}
                            x2={seg.x2}
                            y2={seg.y2}
                            stroke="transparent"
                            strokeWidth={5}
                            strokeLinecap="round"
                            role="button"
                            tabIndex={0}
                            aria-pressed={lineBrush.includes(seg.segment)}
                            aria-label={seg.label}
                            onClick={() => toggleGlyphSegment(seg.segment)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleGlyphSegment(seg.segment);
                              }
                            }}
                          >
                            <title>{seg.label}</title>
                          </line>
                        </g>
                      ))}
                    </svg>
                  </div>
                  <button
                    type="button"
                    className={selecting ? "active" : ""}
                    aria-pressed={selecting}
                    aria-label="範囲選択"
                    title="範囲選択 · ドラッグで範囲を選び、選択範囲をドラッグして移動"
                    onClick={() => {
                      const next = !selecting;
                      setSelecting(next);
                      setSelection(null);
                      if (next) {
                        setPaint(undefined);
                        setMeasuring(false);
                        setMeasure(null);
                        setMessage(
                          "ドラッグで範囲を選択し、選択範囲の中をドラッグすると移動できます。",
                        );
                      }
                      setView("pattern");
                    }}
                  >
                    <BoxSelect size={17} />
                  </button>
                  <button
                    type="button"
                    className={measuring ? "active" : ""}
                    aria-pressed={measuring}
                    aria-label="メジャー"
                    title="メジャー · ドラッグして目数を測る"
                    onClick={() => {
                      const next = !measuring;
                      setMeasuring(next);
                      setMeasure(null);
                      if (next) {
                        setPaint(undefined);
                        setSelecting(false);
                        setSelection(null);
                        setMessage(
                          "ドラッグした範囲の目数が表示されます。もう一度押すと終了します。",
                        );
                      }
                      setView("pattern");
                    }}
                  >
                    <Ruler size={17} />
                  </button>
                  <button
                    aria-label="一つ戻す"
                    disabled={!history.length}
                    onClick={() => {
                      setPattern(history[history.length - 1]);
                      setHistory((h) => h.slice(0, -1));
                    }}
                  >
                    <Undo2 size={17} />
                  </button>
                  <Popover>
                    <PopoverTrigger aria-label="その他の操作">
                      <Ellipsis size={17} />
                    </PopoverTrigger>
                    <PopoverContent align="end">
                      <section
                        className="merge-colors"
                        aria-labelledby="merge-title"
                      >
                        <h3 id="merge-title">似た色をまとめる</h3>
                        <label htmlFor="merge-from">置き換える色</label>
                        <NativeSelect
                          id="merge-from"
                          value={mergeSource?.id || ""}
                          disabled={palette.length < 2}
                          onChange={(e) => {
                            setMergeFrom(e.target.value);
                            setView("pattern");
                            setPaint(undefined);
                          }}
                        >
                          <NativeSelectOption value="">
                            色を選ぶ
                          </NativeSelectOption>
                          {palette.map((t, i) => (
                            <NativeSelectOption key={t.id} value={t.id}>
                              {symbols[i]} · DMC {t.id} ·{" "}
                              {pattern.cells.filter((c) => c === t.id).length}目
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        <label htmlFor="merge-to">残す色</label>
                        <NativeSelect
                          id="merge-to"
                          value={mergeTarget?.id || ""}
                          disabled={palette.length < 2}
                          onChange={(e) => setMergeTo(e.target.value)}
                        >
                          <NativeSelectOption value="">
                            色を選ぶ
                          </NativeSelectOption>
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
                          {canMerge
                            ? `${mergeCount}目をまとめる`
                            : "色を選んでまとめる"}
                        </button>
                      </section>
                    </PopoverContent>
                  </Popover>
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
                    className={"symbol-toggle " + (showSymbols ? "on" : "")}
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
                    onPointerDown={
                      measuring
                        ? beginMeasure
                        : selecting
                          ? beginSelect
                          : beginStroke
                    }
                    onPointerMove={
                      measuring
                        ? moveMeasure
                        : selecting
                          ? moveSelect
                          : paintStroke
                    }
                    onPointerUp={
                      measuring
                        ? endMeasure
                        : selecting
                          ? endSelect
                          : finishStroke
                    }
                    onPointerCancel={
                      measuring
                        ? endMeasure
                        : selecting
                          ? endSelect
                          : finishStroke
                    }
                    onLostPointerCapture={
                      measuring
                        ? endMeasure
                        : selecting
                          ? endSelect
                          : finishStroke
                    }
                    style={{
                      touchAction:
                        view === "pattern" &&
                        (canPaint || selecting || measuring)
                          ? "none"
                          : "auto",
                    }}
                    className={
                      "pattern-grid " +
                      (view === "pattern" &&
                      (canPaint || selecting || measuring)
                        ? "painting"
                        : "")
                    }
                    viewBox={`-2 -2 ${pattern.width + 4} ${pattern.height + 4}`}
                    role="img"
                    aria-label={`${pattern.width}×${pattern.height}目の図案。`}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={pattern.width}
                      height={pattern.height}
                      fill="#fffefa"
                    />
                    {shown.cells.map((c, i) => {
                      const t = threads.find((t) => t.id === c);
                      const x = i % pattern.width,
                        y = Math.floor(i / pattern.width);
                      const s = cellStyle(shown, i);
                      const triangle = {
                        tl: `M${x} ${y}h1L${x} ${y + 1}Z`,
                        tr: `M${x} ${y}h1v1Z`,
                        bl: `M${x} ${y}v1h1Z`,
                        br: `M${x + 1} ${y}v1h-1Z`,
                      };
                      return (
                        <g key={i}>
                          {t && s === null && (
                            <rect
                              x={x}
                              y={y}
                              width={1}
                              height={1}
                              fill={t.hex}
                            />
                          )}
                          {t && s && s !== "frame" && (
                            <path d={triangle[s]} fill={t.hex} />
                          )}
                          {t && s === "frame" && (
                            <rect
                              x={x + 0.09}
                              y={y + 0.09}
                              width={0.82}
                              height={0.82}
                              fill="none"
                              stroke={t.hex}
                              strokeWidth=".14"
                            />
                          )}
                          {t &&
                            s === null &&
                            (showSymbols ? (
                              <text
                                x={x + 0.5}
                                y={y + 0.68}
                                textAnchor="middle"
                                fontSize=".48"
                                fill={ink(t.hex)}
                                fontFamily="monospace"
                              >
                                {symbols[palette.indexOf(t)] || "＋"}
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
                        key={"x" + x}
                        d={`M${x} 0V${pattern.height}`}
                        stroke={x % 10 === 0 ? "#6f807d" : "#b7beb5"}
                        strokeWidth={x % 10 === 0 ? 0.055 : 0.018}
                        pointerEvents="none"
                      />
                    ))}
                    {Array.from({ length: pattern.height + 1 }, (_, y) => (
                      <path
                        key={"y" + y}
                        d={`M0 ${y}H${pattern.width}`}
                        stroke={y % 10 === 0 ? "#6f807d" : "#b7beb5"}
                        strokeWidth={y % 10 === 0 ? 0.055 : 0.018}
                        pointerEvents="none"
                      />
                    ))}
                    {(shown.lines || []).map((raw, i) => {
                      if (!raw) return null;
                      const at = cellLines(shown, i)!;
                      const t = threads.find((th) => th.id === at.color);
                      if (!t) return null;
                      const x = i % pattern.width,
                        y = Math.floor(i / pattern.width);
                      const paths: Record<string, string> = {
                        t: `M${x} ${y}H${x + 1}`,
                        r: `M${x + 1} ${y}V${y + 1}`,
                        b: `M${x} ${y + 1}H${x + 1}`,
                        l: `M${x} ${y}V${y + 1}`,
                        d: `M${x} ${y}L${x + 1} ${y + 1}`,
                        u: `M${x + 1} ${y}L${x} ${y + 1}`,
                      };
                      return (
                        <path
                          key={"line" + i}
                          d={at.segments
                            .split("")
                            .map((s) => paths[s])
                            .join("")}
                          fill="none"
                          stroke={t.hex}
                          strokeWidth=".12"
                          strokeLinecap="round"
                          pointerEvents="none"
                        />
                      );
                    })}
                    {Array.from(
                      { length: Math.floor(pattern.width / 5) + 1 },
                      (_, i) => (
                        <text
                          key={"nx" + i}
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
                          key={"ny" + i}
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
                    {view === "pattern" &&
                      mergeSource &&
                      pattern.cells.map((c, i) =>
                        c === mergeSource.id ? (
                          <rect
                            key={"merge-" + i}
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
                    {view === "pattern" && selecting && selection && (
                      <rect
                        x={selection.x + 0.05}
                        y={selection.y + 0.05}
                        width={selection.width - 0.1}
                        height={selection.height - 0.1}
                        fill="#16a08514"
                        stroke="#0d7a66"
                        strokeWidth=".12"
                        strokeDasharray=".34 .2"
                        pointerEvents="none"
                      />
                    )}
                    {view === "pattern" && measuring && measure && (
                      <g pointerEvents="none">
                        <rect
                          x={measure.x + 0.05}
                          y={measure.y + 0.05}
                          width={measure.width - 0.1}
                          height={measure.height - 0.1}
                          fill="#d38b3418"
                          stroke="#c26d1b"
                          strokeWidth=".12"
                          strokeDasharray=".34 .2"
                        />
                        <text
                          x={measure.x + measure.width / 2}
                          y={
                            measure.y >= 1
                              ? measure.y - 0.35
                              : measure.y + measure.height + 0.85
                          }
                          textAnchor="middle"
                          fontSize=".85"
                          fontWeight="600"
                          fill="#a35510"
                          stroke="#fffefa"
                          strokeWidth=".14"
                          paintOrder="stroke"
                        >
                          {measure.width} × {measure.height}
                        </text>
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
      <PatternPreview pattern={shown} />
    </div>
  );
}

function PatternPreview({ pattern }: { pattern: Pattern }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const count = 14;
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const cellSize = 12;
    target.width = pattern.width * cellSize;
    target.height = pattern.height * cellSize;
    const ctx = target.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    const colors = new Map(threads.map((t) => [t.id, t.hex]));
    pattern.cells.forEach((color, i) => {
      if (!color) return;
      const x = (i % pattern.width) * cellSize;
      const y = Math.floor(i / pattern.width) * cellSize;
      ctx.strokeStyle = colors.get(color) || "#ffffff";
      const s = cellStyle(pattern, i);
      if (s === "frame") {
        ctx.strokeRect(x + 2, y + 2, 8, 8);
        return;
      }
      if (s) {
        // A half stitch: a single diagonal along the triangle's hypotenuse.
        ctx.beginPath();
        if (s === "tl" || s === "br") {
          ctx.moveTo(x + 10, y + 2);
          ctx.lineTo(x + 2, y + 10);
        } else {
          ctx.moveTo(x + 2, y + 2);
          ctx.lineTo(x + 10, y + 10);
        }
        ctx.stroke();
        return;
      }
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
    ctx.lineWidth = 2;
    (pattern.lines || []).forEach((raw, i) => {
      if (!raw) return;
      const at = cellLines(pattern, i)!;
      const color = colors.get(at.color);
      if (!color) return;
      const x = (i % pattern.width) * cellSize;
      const y = Math.floor(i / pattern.width) * cellSize;
      ctx.strokeStyle = color;
      const ends: Record<string, [number, number, number, number]> = {
        t: [x, y, x + cellSize, y],
        r: [x + cellSize, y, x + cellSize, y + cellSize],
        b: [x, y + cellSize, x + cellSize, y + cellSize],
        l: [x, y, x, y + cellSize],
        d: [x, y, x + cellSize, y + cellSize],
        u: [x + cellSize, y, x, y + cellSize],
      };
      for (const s of at.segments) {
        const [x1, y1, x2, y2] = ends[s];
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });
  }, [pattern]);
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
          {((pattern.width / count) * 2.54).toFixed(1)} ×{" "}
          {((pattern.height / count) * 2.54).toFixed(1)} cm{" "}
          <span>14ct目安</span>
        </p>
      </div>
    </details>
  );
}
