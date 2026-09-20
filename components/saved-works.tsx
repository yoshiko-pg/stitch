'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { threads, type Pattern } from '@/lib/stitch';

type SavedWork = {
  id: string;
  name: string;
  savedAt: number;
  pattern: Pattern;
};
const storageKey = 'ito-saved-works-v1';

function readWorks(valid: (p: Pattern) => boolean): SavedWork[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (w) =>
        w &&
        typeof w.id === 'string' &&
        typeof w.name === 'string' &&
        typeof w.savedAt === 'number' &&
        valid(w.pattern),
    );
  } catch {
    return [];
  }
}

const stamp = (t: number) =>
  new Date(t).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const hexById = new Map(threads.map((t) => [t.id, t.hex]));
/** One pixel per stitch, scaled up by CSS; half stitches show as full squares. */
function Thumbnail({ pattern }: { pattern: Pattern }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, pattern.width, pattern.height);
    pattern.cells.forEach((c, i) => {
      if (!c) return;
      ctx.fillStyle = hexById.get(c) || '#000';
      ctx.fillRect(i % pattern.width, Math.floor(i / pattern.width), 1, 1);
    });
  }, [pattern]);
  return (
    <canvas
      ref={ref}
      className="saved-work-thumb"
      width={pattern.width}
      height={pattern.height}
      aria-hidden="true"
    />
  );
}

/** Named snapshots of the pattern kept in localStorage, listed newest first. */
export function SavedWorks({
  pattern,
  valid,
  onLoad,
  onMessage,
}: {
  pattern: Pattern;
  valid: (p: Pattern) => boolean;
  onLoad: (p: Pattern, name: string) => void;
  onMessage: (message: string) => void;
}) {
  const [works, setWorks] = useState(() => readWorks(valid));
  const [name, setName] = useState('');

  function store(next: SavedWork[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setWorks(next);
      return true;
    } catch {
      onMessage('保存できませんでした。端末の空き容量を確認してください。');
      return false;
    }
  }
  const trimmed = name.trim();
  const existing = works.find((w) => w.name === trimmed);

  return (
    <section className="saved-works" aria-label="保存した作業">
      <h3>保存した作業</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!trimmed) return;
          // Saving under an existing name replaces that entry.
          const work = {
            id:
              existing?.id ||
              `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: trimmed,
            savedAt: Date.now(),
            pattern,
          };
          if (store([work, ...works.filter((w) => w !== existing)])) {
            setName('');
            onMessage(
              existing
                ? `「${trimmed}」を上書き保存しました。`
                : `「${trimmed}」を保存しました。`,
            );
          }
        }}
      >
        <Input
          aria-label="保存する名前"
          placeholder="名前を付けて保存"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="outline" type="submit" disabled={!trimmed}>
          {existing ? '上書き' : '保存'}
        </button>
      </form>
      {works.length === 0 ? (
        <p>まだ保存した作業はありません。</p>
      ) : (
        <ul>
          {works.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                className="saved-work-open"
                title={`「${w.name}」を開く`}
                onClick={() => {
                  onLoad(w.pattern, w.name);
                  setName(w.name);
                }}
              >
                <Thumbnail pattern={w.pattern} />
                <span>{w.name}</span>
                <small>
                  {w.pattern.width}×{w.pattern.height}目 · {stamp(w.savedAt)}
                </small>
              </button>
              <button
                type="button"
                className="saved-work-delete"
                aria-label={`「${w.name}」を削除`}
                title="削除"
                onClick={() => {
                  if (!confirm(`「${w.name}」を削除しますか？`)) return;
                  if (store(works.filter((x) => x !== w)))
                    onMessage(`「${w.name}」を削除しました。`);
                }}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
