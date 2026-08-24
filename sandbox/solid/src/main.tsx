import { Suspense } from "solid-js";
import { render } from "solid-js/web";
import App from "./App";
import { RelayEnvironmentProvider } from "solid-relay";
import { environment } from "./RelayEnvironment";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

render(
  () => (
    <RelayEnvironmentProvider environment={environment}>
      <Suspense fallback={<div>Loading…</div>}>
        <App />
      </Suspense>
    </RelayEnvironmentProvider>
  ),
  rootElement,
);
