import "@ajusa/lit/src/lit.css";
import React from "react";
import { createRoot } from "react-dom/client";

import App from "./Components/App";
import "./base.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
