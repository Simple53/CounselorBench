import { useState } from "react";
import { schoolLinks, schoolLink } from "../../src/school-links.mjs";
import { KeyboardInput, useKeyboard } from "./mobile";
import type { Row } from "./domain";
export function SchoolLinks() {
  const [links, setLinks] = useState<Row[]>(schoolLinks),
    [error, setError] = useState("");
  const keyboard = useKeyboard();
  return (
    <>
      <div className="sc-list">
        {links.map((l) => (
          <div className="sc-menu-row" key={l.id}>
            <a href={l.url} target="_blank" rel="noopener noreferrer">
              {l.name} ↗
            </a>
            <button
              onClick={() => setLinks((s) => s.filter((x) => x.id !== l.id))}
            >
              移除
            </button>
          </div>
        ))}
      </div>
      <form
        className="sc-form"
        onSubmit={(e) => {
          e.preventDefault();
          keyboard.hide();
          try {
            const d = new FormData(e.currentTarget);
            setLinks((s) => [...s, schoolLink(d.get("name"), d.get("url"))]);
            e.currentTarget.reset();
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label>
          链接名称
          <KeyboardInput
            name="name"
            aria-label="链接名称"
            required
            onBlur={() => keyboard.hide()}
          />
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
        <button className="sc-primary">添加链接</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </>
  );
}
