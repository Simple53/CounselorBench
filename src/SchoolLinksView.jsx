import React, { useState } from "react";
import { schoolLinks, schoolLink } from "./school-links.mjs";
import { Button, Card } from "./ui.jsx";

export function SchoolLinksView() {
  const [links, setLinks] = useState(schoolLinks),
    [error, setError] = useState("");
  return (
    <section>
      <h1>学校链接</h1>
      <Card>
        <form
          className="table-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const d = new FormData(e.currentTarget);
              setLinks((s) => [...s, schoolLink(d.get("name"), d.get("url"))]);
              e.currentTarget.reset();
              setError("");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <input
            name="name"
            aria-label="链接名称"
            placeholder="链接名称"
            required
          />
          <input
            name="url"
            aria-label="学校网址"
            placeholder="https://"
            required
          />
          <Button variant="primary" type="submit">添加链接</Button>
        </form>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <div className="advisor-student-list" style={{ marginTop: 12 }}>
          {links.map((l) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 12px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface-secondary)",
              }}
            >
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.name}
              </a>
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => setLinks((s) => s.filter((x) => x.id !== l.id))}
              >
                移除
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
