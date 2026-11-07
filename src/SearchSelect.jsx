import React, { useState, useEffect, useRef, useId } from "react";
import { Button } from "./ui.jsx";
export function SearchSelect({
  label,
  name,
  options,
  defaultValue = "",
  value,
  onChange,
  onCreate,
  required = false,
  studentCreate = false,
}) {
  const [local, setLocal] = useState(defaultValue),
    [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0),
    [number, setNumber] = useState(""),
    [error, setError] = useState("");
  const selected = value ?? local,
    root = useRef(null),
    input = useRef(null),
    id = useId();
  const normalized = options.map((o) =>
      typeof o === "string" ? { value: o, label: o } : o,
    ),
    chosen = normalized.find((o) => o.value === selected);
  const matches = normalized.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    if (selected) setQuery(chosen?.label || "");
  }, [selected, chosen?.label]);
  useEffect(() => {
    input.current?.setCustomValidity(
      required && !selected ? "请选择搜索结果或新增一项" : "",
    );
  }, [selected, required]);
  useEffect(() => {
    const close = (e) => {
      if (!root.current?.contains(e.target)) {
        setOpen(false);
        setQuery(chosen?.label || "");
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [chosen?.label]);
  function choose(o) {
    setLocal(o.value);
    onChange?.(o.value);
    setQuery(o.label);
    setOpen(false);
    setError("");
  }
  function create() {
    try {
      const q = query.trim();
      if (!q) return;
      const item = onCreate(q, { number: number.trim() });
      if (item)
        choose(typeof item === "string" ? { value: item, label: item } : item);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="search-select" ref={root}>
      <label htmlFor={id}>{label}</label>
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        value={query}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActive(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setLocal("");
          onChange?.("");
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, matches.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
          }
          if (e.key === "Enter" && open) {
            e.preventDefault();
            if (matches[active]) choose(matches[active]);
            else if (onCreate && !studentCreate) create();
          }
          if (e.key === "Escape") {
            e.stopPropagation();
            setOpen(false);
            setQuery(chosen?.label || "");
          }
        }}
      />
      <input type="hidden" name={name} value={selected} />
      {open && (
        <div className="search-options" id={`${id}-list`} role="listbox">
          {matches.map((o, i) => (
            <button
              type="button"
              role="option"
              aria-selected={o.value === selected}
              className={active === i ? "selected" : ""}
              key={o.value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
            >
              {o.label}
            </button>
          ))}
          {!matches.length && <p>未找到匹配项</p>}
          {onCreate &&
            query.trim() &&
            !normalized.some((o) => o.label === query.trim()) && (
              <div className="create-option">
                {studentCreate && (
                  <input
                    aria-label="新学生学号"
                    placeholder="新增学生的学号"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                  />
                )}
                <Button type="button" onClick={create}>
                  新增“{query.trim()}”
                </Button>
                {error && <p role="alert">{error}</p>}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
