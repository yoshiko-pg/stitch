'use client';
// Font loading and rasterization synchronize the preview with browser resources.
/* oxlint-disable react/react-compiler */
// The preview is a dynamically generated SVG, not an external image.
/* oxlint-disable jsx-a11y/prefer-tag-over-role */
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { threads, type Pattern } from '@/lib/stitch';
import { placeDotText, rasterizeDotText, type DotText } from '@/lib/dot-text';

const fonts = [
  {
    label: 'ＫＦひま字ドット',
    family: 'ItoKFhimaji',
    local: 'KFhimajiDOT',
    size: 16,
  },
  {
    label: 'ノスタルドット M+H 10',
    family: 'ItoNosutaru',
    local: 'Nosutaru-dotMPlusH-10-Regular',
    size: 10,
  },
];

export function DotTextTool({
  pattern,
  onPlace,
}: {
  pattern: Pattern;
  onPlace: (pattern: Pattern) => void;
}) {
  const [fontIndex, setFontIndex] = useState(0);
  const [text, setText] = useState('');
  const [size, setSize] = useState('16');
  const [scale, setScale] = useState('1');
  const [x, setX] = useState('1');
  const [y, setY] = useState('1');
  const [color, setColor] = useState('310');
  const [revision, setRevision] = useState(0);
  const [preview, setPreview] = useState<DotText | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const faces = useRef(new Map<string, FontFace>());
  const uploadId = useRef(0);
  const selected = fonts[fontIndex];
  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    setError('');
    setLoading(false);
    if (!text.trim()) return;
    if (
      !Number.isInteger(Number(size)) ||
      Number(size) < 8 ||
      Number(size) > 48
    ) {
      setError('文字サイズは8〜48で指定してください。');
      return;
    }
    setLoading(true);
    async function render() {
      try {
        let face = faces.current.get(selected.family);
        if (!face) {
          face = new FontFace(selected.family, `local("${selected.local}")`);
          await face.load();
          if (cancelled) return;
          document.fonts.add(face);
          faces.current.set(selected.family, face);
        }
        const result = rasterizeDotText(
          text,
          selected.family,
          Number(size),
          Number(scale),
        );
        if (!cancelled) setPreview(result);
      } catch {
        if (!cancelled)
          setError(
            '文字を表示できません。フォントファイルを読み込むか、文字数・サイズを減らしてください。',
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [text, selected, size, scale, revision]);
  useEffect(() => {
    const loaded = faces.current;
    return () => {
      loaded.forEach((face) => document.fonts.delete(face));
    };
  }, []);
  const fits =
    preview &&
    Number.isInteger(Number(x)) &&
    Number.isInteger(Number(y)) &&
    Number(x) >= 1 &&
    Number(y) >= 1 &&
    Number(x) - 1 + preview.width <= pattern.width &&
    Number(y) - 1 + preview.height <= pattern.height;
  return (
    <section className="dot-text-tool" aria-labelledby="dot-text-title">
      <h3 id="dot-text-title">ドット文字を入れる</h3>
      <label htmlFor="dot-font">フォント</label>
      <NativeSelect
        id="dot-font"
        value={fontIndex}
        onChange={(e) => {
          const index = Number(e.target.value);
          setPreview(null);
          setFontIndex(index);
          setSize(String(fonts[index].size));
        }}
      >
        {fonts.map((font, i) => (
          <NativeSelectOption key={font.family} value={i}>
            {font.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <label htmlFor="dot-font-file">
        フォントファイルを読み込む（.otf / .ttf）
      </label>
      <Input
        id="dot-font-file"
        type="file"
        accept=".otf,.ttf"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            setError('10MB以下のフォントを選んでください。');
            return;
          }
          const id = ++uploadId.current;
          setPreview(null);
          setLoading(true);
          try {
            const face = new FontFace(
              selected.family,
              await file.arrayBuffer(),
            );
            await face.load();
            if (id !== uploadId.current) return;
            const old = faces.current.get(selected.family);
            if (old) document.fonts.delete(old);
            document.fonts.add(face);
            faces.current.set(selected.family, face);
            setRevision((r) => r + 1);
            setError('');
          } catch {
            setError(
              'フォントを読み込めませんでした。.otf / .ttfファイルを選んでください。',
            );
          } finally {
            if (id === uploadId.current) setLoading(false);
          }
        }}
      />
      <p>
        インストール済みのフォントを使います。読み込んだファイルは端末内で処理します。
      </p>
      <label htmlFor="dot-text">文字（改行できます）</label>
      <Textarea
        id="dot-text"
        maxLength={240}
        value={text}
        placeholder="こんにちは"
        onChange={(e) => {
          setPreview(null);
          setText(e.target.value);
        }}
      />
      <div className="canvas-size-fields">
        <label htmlFor="dot-size">
          文字サイズ
          <Input
            id="dot-size"
            type="number"
            min={8}
            max={48}
            value={size}
            onChange={(e) => {
              setPreview(null);
              setSize(e.target.value);
            }}
          />
        </label>
        <label htmlFor="dot-scale">
          ドットの倍率
          <NativeSelect
            id="dot-scale"
            value={scale}
            onChange={(e) => {
              setPreview(null);
              setScale(e.target.value);
            }}
          >
            {[1, 2, 3, 4].map((n) => (
              <NativeSelectOption key={n} value={n}>
                {n}倍
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>
      <label htmlFor="dot-color">糸色</label>
      <NativeSelect
        id="dot-color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      >
        {threads.map((t) => (
          <NativeSelectOption key={t.id} value={t.id}>
            DMC {t.id} · {t.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <div className="canvas-size-fields">
        <label htmlFor="dot-x">
          左から何列目
          <Input
            id="dot-x"
            type="number"
            min={1}
            max={pattern.width}
            value={x}
            onChange={(e) => setX(e.target.value)}
          />
        </label>
        <label htmlFor="dot-y">
          上から何行目
          <Input
            id="dot-y"
            type="number"
            min={1}
            max={pattern.height}
            value={y}
            onChange={(e) => setY(e.target.value)}
          />
        </label>
      </div>
      {preview && (
        <>
          <div className="dot-text-preview">
            <svg
              role="img"
              aria-label="ドット文字のプレビュー"
              viewBox={`0 0 ${preview.width} ${preview.height}`}
              width={preview.width * 5}
              height={preview.height * 5}
              shapeRendering="crispEdges"
            >
              {preview.dots.map((dot, i) =>
                dot ? (
                  <rect
                    key={i}
                    x={i % preview.width}
                    y={Math.floor(i / preview.width)}
                    width={1}
                    height={1}
                    fill={threads.find((t) => t.id === color)?.hex}
                  />
                ) : null,
              )}
            </svg>
          </div>
          <p>
            {preview.width}×{preview.height}目
            {!fits &&
              ' · キャンバスに収まるようサイズや位置を調整してください。'}
          </p>
        </>
      )}
      <output>{loading ? '文字を準備しています…' : error}</output>
      <button
        className="primary full"
        disabled={!fits || loading}
        onClick={() => {
          if (!preview || !fits) return;
          onPlace(
            placeDotText(pattern, preview, Number(x) - 1, Number(y) - 1, color),
          );
        }}
      >
        キャンバスに文字を入れる
      </button>
      <p>文字の部分を上書きします。「一つ戻す」で取り消せます。</p>
    </section>
  );
}
