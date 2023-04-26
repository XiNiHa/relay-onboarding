import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RelayEnvironmentProvider } from "react-relay";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { environment } from "./RelayEnvironment";
import HandsOn1 from "./HandsOn1";
import HandsOn2 from "./HandsOn2";
import HandsOn3 from "./HandsOn3";
import HandsOn4 from "./HandsOn4";
import HandsOn5 from "./HandsOn5";

const router = createBrowserRouter([
  {
    path: "/handson-1",
    element: <HandsOn1 />,
  },
  {
    path: "/handson-2",
    element: <HandsOn2 />,
  },
  {
    path: "/handson-3",
    element: <HandsOn3 />,
  },
  {
    path: "/handson-4",
    element: <HandsOn4 />,
  },
  {
    path: "/handson-5",
    element: <HandsOn5 />,
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
