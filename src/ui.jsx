import React, { useEffect, useRef } from "react";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX.mjs";
export const Button = ({ children, primary, className = "", ...props }) => (
  <button className={`${primary ? "primary " : ""}${className}`} {...props}>
    {children}
  </button>
);
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector("button,input,select,textarea")?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  function trap(e) {
    if (e.key !== "Tab") return;
    const list = [
      ...ref.current.querySelectorAll(
        "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
      ),
    ];
    if (e.shiftKey && document.activeElement === list[0]) {
      e.preventDefault();
      list.at(-1)?.focus();
    } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
      e.preventDefault();
      list[0]?.focus();
    }
  }
  return (
    <div
      className="scrim"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        onKeyDown={trap}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <Button aria-label="关闭" onClick={onClose}>
            <IconX />
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
