import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RelayEnvironmentProvider } from "react-relay";
import { environment } from "./RelayEnvironment";

const AppRouter = lazy(() => import("./Router"));

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <RelayEnvironmentProvider environment={environment}>
      <Suspense fallback={<div>Loading…</div>}>
        <AppRouter />
      </Suspense>
    </RelayEnvironmentProvider>
  </StrictMode>,
);
