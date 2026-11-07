import React from "react";
import { createRoot } from "react-dom/client";
import { LocalWorkspace } from "./LocalWorkspace.jsx";
import "./styles.css";
import "./density.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LocalWorkspace />
  </React.StrictMode>,
);
