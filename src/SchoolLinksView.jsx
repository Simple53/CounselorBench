import React, { useMemo, useState } from "react";
import {
  schoolDirectory,
  linkCategories,
  bookmark,
  filterLinks,
} from "./school-links.mjs";
import { Button } from "./ui.jsx";

// 黄页式学校链接：按分类分栏，一行一条，可搜索，可手动添加/删除书签。
export function SchoolLinksView({ bookmarks = [], onBookmarks }) {
  const [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [adding, setAdding] = useState(false);
  const all = useMemo(
    () => filterLinks([...schoolDirectory, ...bookmarks], query),
    [bookmarks, query],
  );
  function submit(e) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      const b = bookmark(
        String(d.get("name")),
        String(d.get("url")),
        String(d.get("category")),
        String(d.get("note")),
      );
      onBookmarks([...bookmarks, b]);
      e.currentTarget.reset();
      setError("");
    } catch (err) {
      setError(err instanceof TypeError ? "网址格式不正确" : err.message);
    }
  }
  return (
    <section className="yellow-pages">
      <h1>学校链接</h1>
      <div className="toolbar">
        <input
          aria-label="搜索链接"
          placeholder="搜索名称、网址或备注"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="primary" onClick={() => setAdding((v) => !v)}>
          {adding ? "收起" : "添加书签"}
        </Button>
      </div>
      {adding && (
        <form className="yp-form" onSubmit={submit}>
          <input name="name" aria-label="链接名称" placeholder="名称" required />
          <input name="url" aria-label="网址" placeholder="https://" required />
          <select name="category" aria-label="分类" defaultValue="我的书签">
            {linkCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input name="note" aria-label="备注" placeholder="备注（可选）" maxLength={80} />
          <Button variant="primary" type="submit">
            保存
          </Button>
        </form>
      )}
      {error && (
        <p className="save-error" role="alert">
          {error}
        </p>
      )}
      {linkCategories.map((cat) => {
        const items = all.filter((l) => (l.category || "我的书签") === cat);
        if (!items.length) return null;
        return (
          <div className="yp-group" key={cat}>
            <h2>
              {cat} <span className="tabular">{items.length}</span>
            </h2>
            <ul>
              {items.map((l) => (
                <li key={l.id}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.name}
                  </a>
                  <span className="yp-note">{l.note}</span>
                  <span className="yp-url">{new URL(l.url).hostname}</span>
                  {l.custom ? (
                    <Button
                      size="sm"
                      variant="tertiary"
                      aria-label={`删除书签 ${l.name}`}
                      onClick={() =>
                        onBookmarks(bookmarks.filter((b) => b.id !== l.id))
                      }
                    >
                      删除
                    </Button>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {!all.length && <div className="empty">没有匹配的链接</div>}
    </section>
  );
}
