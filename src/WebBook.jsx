import React, { useMemo, useState } from "react";
import { Button, Chip } from "./ui.jsx";
import { downloadBlob } from "./files.js";
import {
  parseBlocks,
  toggleCheck,
  newChapter,
  chaptersToMarkdown,
  searchChapters,
} from "./webbook.mjs";

function Blocks({ body, onToggle }) {
  return parseBlocks(body).map((b, i) => {
    if (b.type === "h") {
      const H = `h${Math.min(b.level + 1, 4)}`;
      return <H key={i}>{b.text}</H>;
    }
    if (b.type === "p") return <p key={i}>{b.text}</p>;
    if (b.type === "check")
      return (
        <ul key={i} className="wb-check">
          {b.items.map((it) => (
            <li key={it.line}>
              <label>
                <input type="checkbox" checked={it.done} onChange={() => onToggle(it.line)} />
                <span className={it.done ? "done" : ""}>{it.text}</span>
              </label>
            </li>
          ))}
        </ul>
      );
    const L = b.type === "ol" ? "ol" : "ul";
    return (
      <L key={i}>
        {b.items.map((it) => (
          <li key={it.line}>{it.text}</li>
        ))}
      </L>
    );
  });
}

// 个人 WebBook：左侧目录，右侧阅读/编辑；清单可直接勾选，可导出 Markdown。
export function WebBook({ section, chapters, onChange, children }) {
  const [activeId, setActive] = useState(chapters[0]?.id),
    [editing, setEditing] = useState(false),
    [query, setQuery] = useState(""),
    [title, setTitle] = useState("");
  const shown = useMemo(() => searchChapters(chapters, query), [chapters, query]);
  const idx = chapters.findIndex((c) => c.id === activeId);
  const cur = chapters[idx] || chapters[0];
  const patch = (id, p) =>
    onChange(chapters.map((c) => (c.id === id ? { ...c, ...p, updatedAt: new Date().toISOString() } : c)));
  const move = (n) => {
    const j = idx + n;
    if (idx < 0 || j < 0 || j >= chapters.length) return;
    const next = [...chapters];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };
  return (
    <div className="webbook">
      <header className="wb-head">
        <h1>{section}</h1>
        <div className="wb-tools">
          <input
            aria-label="搜索章节"
            placeholder="搜索章节内容或标签"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            onClick={() =>
              downloadBlob(
                new Blob([chaptersToMarkdown(section, chapters)], { type: "text/markdown;charset=utf-8" }),
                `${section}.md`,
              )
            }
          >
            导出 Markdown
          </Button>
        </div>
      </header>
      <div className="wb-layout">
        <nav className="wb-toc" aria-label="章节目录">
          <ol>
            {shown.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={c.id === cur?.id ? "active" : ""}
                  onClick={() => (setActive(c.id), setEditing(false))}
                >
                  {c.title}
                </button>
              </li>
            ))}
          </ol>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const c = newChapter(title);
                onChange([...chapters, c]);
                setActive(c.id);
                setEditing(true);
                setTitle("");
              } catch {}
            }}
          >
            <input
              aria-label="新章节标题"
              placeholder="新章节标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button type="submit" size="sm">
              新增章节
            </Button>
          </form>
        </nav>
        <article className="wb-page">
          {cur ? (
            <>
              <div className="wb-bar">
                <div>
                  {(cur.tags || []).map((t) => (
                    <Chip key={t} color="accent" variant="soft">
                      {t}
                    </Chip>
                  ))}
                  {cur.updatedAt && (
                    <small className="tabular"> 更新于 {cur.updatedAt.slice(0, 10)}</small>
                  )}
                </div>
                <div className="wb-actions">
                  <Button size="sm" onClick={() => move(-1)} disabled={idx <= 0}>
                    上移
                  </Button>
                  <Button size="sm" onClick={() => move(1)} disabled={idx < 0 || idx >= chapters.length - 1}>
                    下移
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => setEditing((v) => !v)}>
                    {editing ? "完成" : "编辑"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (!confirm(`删除章节「${cur.title}」？`)) return;
                      const rest = chapters.filter((c) => c.id !== cur.id);
                      onChange(rest);
                      setActive(rest[0]?.id);
                    }}
                  >
                    删除
                  </Button>
                </div>
              </div>
              {editing ? (
                <div className="wb-edit">
                  <input
                    aria-label="章节标题"
                    value={cur.title}
                    onChange={(e) => patch(cur.id, { title: e.target.value })}
                  />
                  <input
                    aria-label="标签（逗号分隔）"
                    placeholder="标签，用逗号分隔"
                    value={(cur.tags || []).join("，")}
                    onChange={(e) =>
                      patch(cur.id, {
                        tags: e.target.value.split(/[,，、\s]+/).filter(Boolean),
                      })
                    }
                  />
                  <textarea
                    aria-label="章节正文"
                    rows={18}
                    value={cur.body}
                    onChange={(e) => patch(cur.id, { body: e.target.value })}
                  />
                  <p className="wb-help">
                    支持：# 标题、- 列表、1. 编号、- [ ] 待办清单。
                  </p>
                </div>
              ) : (
                <>
                  <h1>{cur.title}</h1>
                  <Blocks body={cur.body} onToggle={(line) => patch(cur.id, { body: toggleCheck(cur.body, line) })} />
                </>
              )}
              <footer className="wb-pager">
                <Button size="sm" disabled={idx <= 0} onClick={() => setActive(chapters[idx - 1].id)}>
                  上一章
                </Button>
                <Button
                  size="sm"
                  disabled={idx < 0 || idx >= chapters.length - 1}
                  onClick={() => setActive(chapters[idx + 1].id)}
                >
                  下一章
                </Button>
              </footer>
            </>
          ) : (
            <div className="empty">还没有章节，请在左侧新增。</div>
          )}
        </article>
      </div>
      {children}
    </div>
  );
}
