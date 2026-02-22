// Application entry point. Mounts the React app into the DOM root element.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./i18n";
import "./index.css";
import "./print.css";
import { AppRouter } from "./AppRouter";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
