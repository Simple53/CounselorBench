import { useMemo, useState } from "react";
import {
  parseBlocks,
  toggleCheck,
  newChapter,
  chaptersToMarkdown,
  searchChapters,
} from "../../src/webbook.mjs";
import { KeyboardInput, KeyboardTextarea, useKeyboard } from "./mobile";

export function MobileWebBook({
  section,
  chapters,
  onChange,
}: {
  section: string;
  chapters: any[];
  onChange: (next: any[]) => void;
}) {
  const [activeId, setActiveId] = useState(chapters[0]?.id || "");
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const keyboard = useKeyboard();

  const shown = useMemo(
    () => searchChapters(chapters, query),
    [chapters, query],
  );
  const idx = chapters.findIndex((c) => c.id === activeId);
  const cur = chapters[idx] || chapters[0];

  const patch = (id: string, p: Record<string, any>) =>
    onChange(
      chapters.map((c) =>
        c.id === id ? { ...c, ...p, updatedAt: new Date().toISOString() } : c,
      ),
    );

  function exportMd() {
    const blob = new Blob([chaptersToMarkdown(section, chapters)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${section}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="sc-webbook">
      <div className="sc-toolbar">
        <KeyboardInput
          aria-label="搜索章节"
          placeholder="搜索章节或标签"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => keyboard.hide()}
        />
        <button type="button" onClick={exportMd}>
          导出MD
        </button>
      </div>

      <div className="sc-wb-toc" aria-label="章节目录">
        {shown.map((c: any) => (
          <button
            type="button"
            key={c.id}
            className={c.id === cur?.id ? "active" : ""}
            onClick={() => {
              setActiveId(c.id);
              setEditing(false);
            }}
          >
            {c.title}
          </button>
        ))}
      </div>

      <form
        className="sc-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          keyboard.hide();
          try {
            const c = newChapter(newTitle);
            onChange([...chapters, c]);
            setActiveId(c.id);
            setEditing(true);
            setNewTitle("");
          } catch {}
        }}
      >
        <KeyboardInput
          aria-label="新章节标题"
          placeholder="新章节标题"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onBlur={() => keyboard.hide()}
        />
        <button type="submit">新增</button>
      </form>

      {cur ? (
        <article className="sc-wb-article">
          <div className="sc-toolbar">
            <h3>{cur.title}</h3>
            <div>
              <button type="button" onClick={() => setEditing((v) => !v)}>
                {editing ? "完成" : "编辑"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const rest = chapters.filter((c) => c.id !== cur.id);
                  onChange(rest);
                  setActiveId(rest[0]?.id || "");
                }}
              >
                删除
              </button>
            </div>
          </div>
          {editing ? (
            <div className="sc-form">
              <label>
                章节标题
                <KeyboardInput
                  value={cur.title}
                  onChange={(e) => patch(cur.id, { title: e.target.value })}
                  onBlur={() => keyboard.hide()}
                />
              </label>
              <label>
                正文（支持 # 标题、- 列表、- [ ] 清单）
                <KeyboardTextarea
                  rows={8}
                  value={cur.body}
                  onChange={(e) => patch(cur.id, { body: e.target.value })}
                  onBlur={() => keyboard.hide()}
                />
              </label>
            </div>
          ) : (
            parseBlocks(cur.body).map((b: any, i: number) => {
              if (b.type === "h") return <h4 key={i}>{b.text}</h4>;
              if (b.type === "p") return <p key={i}>{b.text}</p>;
              if (b.type === "check") {
                return (
                  <ul key={i} className="sc-wb-check">
                    {b.items.map((it: any) => (
                      <li key={it.line}>
                        <label>
                          <input
                            type="checkbox"
                            checked={it.done}
                            onChange={() =>
                              patch(cur.id, {
                                body: toggleCheck(cur.body, it.line),
                              })
                            }
                          />
                          <span className={it.done ? "done" : ""}>
                            {it.text}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <ul key={i}>
                  {b.items.map((it: any) => (
                    <li key={it.line}>{it.text}</li>
                  ))}
                </ul>
              );
            })
          )}
        </article>
      ) : (
        <p className="sc-empty">暂无章节，请在上方新增</p>
      )}
    </section>
  );
}
