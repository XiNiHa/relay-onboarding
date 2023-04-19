import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RelayEnvironmentProvider } from "react-relay";
import { environment } from "./RelayEnvironment";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RelayEnvironmentProvider environment={environment}>
      <Suspense>
        <App />
      </Suspense>
    </RelayEnvironmentProvider>
  </React.StrictMode>
);
