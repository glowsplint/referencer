// Application entry point. Mounts the React app into the DOM root element.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./i18n"
import "./index.css"
import "./print.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
