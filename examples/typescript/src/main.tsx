import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RelayEnvironmentProvider } from "react-relay";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { environment } from "./RelayEnvironment";
import HandsOn1 from "./HandsOn1";
import HandsOn2 from "./HandsOn2";

const router = createBrowserRouter([
  {
    path: "/handson-1",
    element: <HandsOn1 />,
  },
  {
    path: "/handson-2",
    element: <HandsOn2 />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RelayEnvironmentProvider environment={environment}>
      <Suspense>
        <RouterProvider router={router} />
      </Suspense>
    </RelayEnvironmentProvider>
  </React.StrictMode>
);
