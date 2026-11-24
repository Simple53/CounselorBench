import React, { useEffect, useRef } from "react";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX.mjs";

export const Button = ({
  children,
  primary,
  variant,
  size = "md",
  className = "",
  ...props
}) => {
  const resolved = variant || (primary ? "primary" : "secondary");
  return (
    <button
      className={`button button--${resolved} ${size === "sm" ? "button--sm" : ""} ${primary || resolved === "primary" ? "primary " : ""}${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export function Card({ children, className = "", ...props }) {
  return (
    <section className={`card ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}
Card.Header = ({ children, className = "", ...props }) => (
  <header className={`card__header ${className}`.trim()} {...props}>
    {children}
  </header>
);
Card.Title = ({ children, className = "", ...props }) => (
  <h2 className={`card__title ${className}`.trim()} {...props}>
    {children}
  </h2>
);
Card.Description = ({ children, className = "", ...props }) => (
  <p className={`card__description ${className}`.trim()} {...props}>
    {children}
  </p>
);
Card.Content = ({ children, className = "", ...props }) => (
  <div className={`card__content ${className}`.trim()} {...props}>
    {children}
  </div>
);
Card.Footer = ({ children, className = "", ...props }) => (
  <footer className={`card__footer ${className}`.trim()} {...props}>
    {children}
  </footer>
);

export function Chip({
  children,
  color = "default",
  variant = "dot",
  className = "",
  ...props
}) {
  return (
    <span
      className={`chip chip--${color} chip--${variant} ${className}`.trim()}
      {...props}
    >
      {variant === "dot" && <span className="chip__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

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
          <Button variant="tertiary" aria-label="关闭" onClick={onClose}>
            <IconX size={18} />
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
