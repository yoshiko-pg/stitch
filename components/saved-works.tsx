'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Save, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { threads, type Pattern } from '@/lib/stitch';

type SavedWork = {
  id: string;
  name: string;
  savedAt: number;
  pattern: Pattern;
};
const storageKey = 'ito-saved-works-v1';

function validWorks(raw: unknown, valid: (p: Pattern) => boolean) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (w): w is SavedWork =>
      w &&
      typeof w.id === 'string' &&
      typeof w.name === 'string' &&
      typeof w.savedAt === 'number' &&
      valid(w.pattern),
  );
}

function readWorks(valid: (p: Pattern) => boolean): SavedWork[] {
  try {
    return validWorks(
      JSON.parse(localStorage.getItem(storageKey) || '[]'),
      valid,
    );
  } catch {
    return [];
  }
}

const fileStamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

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
  // The work last opened or saved, offered for a one-click overwrite.
  const [currentId, setCurrentId] = useState<string>();

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
  const current = works.find((w) => w.id === currentId);

  return (
    <section className="saved-works" aria-label="保存した作業">
      <h3>保存した作業</h3>
      {current && (
        <button
          type="button"
          className="outline saved-works-overwrite"
          onClick={() => {
            const work = { ...current, savedAt: Date.now(), pattern };
            if (store([work, ...works.filter((w) => w !== current)]))
              onMessage(`「${current.name}」を上書き保存しました。`);
          }}
        >
          <Save size={14} />
          <span>「{current.name}」に上書き保存</span>
        </button>
      )}
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
            setCurrentId(work.id);
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
          // Keep password managers from offering to fill this field.
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
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
            <li
              key={w.id}
              className={w.id === currentId ? 'current' : undefined}
            >
              <button
                type="button"
                className="saved-work-open"
                title={`「${w.name}」を開く`}
                onClick={() => {
                  onLoad(w.pattern, w.name);
                  setCurrentId(w.id);
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
      <div className="saved-works-transfer">
        <button
          type="button"
          className="outline"
          disabled={works.length === 0}
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify({ savedWorks: works })], {
                type: 'application/json',
              }),
            );
            const a = document.createElement('a');
            a.href = url;
            a.download = `ito-saved-works-${fileStamp()}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            onMessage(`${works.length}件の作業を書き出しました。`);
          }}
        >
          <Download size={14} />
          すべて書き出す
        </button>
        <label className="outline import-label">
          <Upload size={14} />
          ファイルから読み込む
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const input = e.currentTarget;
              const f = input.files?.[0];
              input.value = '';
              if (!f) return;
              try {
                if (f.size > 50e6) throw Error();
                const raw = JSON.parse(await f.text());
                const imported = validWorks(raw?.savedWorks, valid);
                if (imported.length === 0) throw Error();
                // Imported works replace saved ones with the same name.
                const names = new Set(imported.map((w) => w.name));
                const merged = [
                  ...imported,
                  ...works.filter((w) => !names.has(w.name)),
                ];
                // Keep ids unique even if the file came from another device.
                const ids = new Set<string>();
                for (const w of merged) {
                  if (ids.has(w.id))
                    w.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                  ids.add(w.id);
                }
                merged.sort((a, b) => b.savedAt - a.savedAt);
                if (store(merged))
                  onMessage(`${imported.length}件の作業を読み込みました。`);
              } catch {
                onMessage('このファイルは読み込めません。');
              }
            }}
          />
        </label>
      </div>
    </section>
  );
}
