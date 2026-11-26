import { useMemo, useState } from "react";
import {
  schoolDirectory,
  linkCategories,
  bookmark,
  filterLinks,
} from "../../src/school-links.mjs";
import { KeyboardInput, useKeyboard } from "./mobile";
import type { Row } from "./domain";

export function SchoolLinks({
  bookmarks = [],
  onBookmarks,
}: {
  bookmarks?: Row[];
  onBookmarks?: (next: Row[]) => void;
}) {
  const [localBookmarks, setLocalBookmarks] = useState<Row[]>([]);
  const listBookmarks = onBookmarks ? bookmarks : localBookmarks;
  const saveBookmarks = onBookmarks || setLocalBookmarks;

  const [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [adding, setAdding] = useState(false);
  const keyboard = useKeyboard();

  const items = useMemo(
    () => filterLinks([...schoolDirectory, ...listBookmarks], query),
    [listBookmarks, query],
  );

  return (
    <section className="sc-yellow-pages">
      <div className="sc-toolbar">
        <KeyboardInput
          aria-label="搜索学校黄页"
          placeholder="搜索名称、备注或网址"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => keyboard.hide()}
        />
        <button type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? "收起" : "加书签"}
        </button>
      </div>

      {adding && (
        <form
          className="sc-form"
          onSubmit={(e) => {
            e.preventDefault();
            keyboard.hide();
            try {
              const d = new FormData(e.currentTarget);
              const b = bookmark(
                String(d.get("name")),
                String(d.get("url")),
                String(d.get("category")),
                String(d.get("note")),
              );
              saveBookmarks([...listBookmarks, b]);
              e.currentTarget.reset();
              setError("");
              setAdding(false);
            } catch (err) {
              setError(err instanceof TypeError ? "网址格式不正确" : (err as Error).message);
            }
          }}
        >
          <label>
            链接名称
            <KeyboardInput name="name" aria-label="链接名称" required onBlur={() => keyboard.hide()} />
          </label>
          <label>
            学校网址
            <KeyboardInput
              name="url"
              aria-label="学校网址"
              placeholder="https://"
              required
              onBlur={() => keyboard.hide()}
            />
          </label>
          <label>
            分类
            <select name="category" aria-label="书签分类" defaultValue="我的书签">
              {linkCategories.map((c: string) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            备注（可选）
            <KeyboardInput name="note" aria-label="书签备注" maxLength={80} onBlur={() => keyboard.hide()} />
          </label>
          <button className="sc-primary" type="submit">保存书签</button>
          {error && <p className="sc-error" role="alert">{error}</p>}
        </form>
      )}

      {linkCategories.map((cat: string) => {
        const group = items.filter((l: Row) => (l.category || "我的书签") === cat);
        if (!group.length) return null;
        return (
          <div className="sc-yp-group" key={cat}>
            <h2 className="sc-section-title">
              {cat}（{group.length}）
            </h2>
            <div className="sc-list">
              {group.map((l: Row) => (
                <div className="sc-yp-row" key={l.id}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    <strong>{l.name}</strong>
                    <small>
                      {l.note ? `${l.note} · ` : ""}
                      {new URL(l.url).hostname}
                    </small>
                  </a>
                  {l.custom && (
                    <button
                      type="button"
                      onClick={() =>
                        saveBookmarks(listBookmarks.filter((x) => x.id !== l.id))
                      }
                    >
                      移除
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {!items.length && <p className="sc-empty">未找到匹配的链接</p>}
    </section>
  );
}
