import { lazy, Suspense } from "solid-js";
import { render } from "solid-js/web";
import { RelayEnvironmentProvider } from "solid-relay";
import { environment } from "./RelayEnvironment";

const AppRouter = lazy(() => import("./Router"));

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

render(
  () => (
    <RelayEnvironmentProvider environment={environment}>
      <Suspense fallback={<div>Loading…</div>}>
        <AppRouter />
      </Suspense>
    </RelayEnvironmentProvider>
  ),
  rootElement,
);
