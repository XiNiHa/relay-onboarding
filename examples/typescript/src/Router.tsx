import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const HandsOn1 = lazy(() => import("./HandsOn1"));
const HandsOn2 = lazy(() => import("./HandsOn2"));
const HandsOn3 = lazy(() => import("./HandsOn3"));
const HandsOn4 = lazy(() => import("./HandsOn4"));
const HandsOn5 = lazy(() => import("./HandsOn5"));
const HandsOn6 = lazy(() => import("./HandsOn6"));

const router = createBrowserRouter([
  { path: "/handson-1", element: <HandsOn1 /> },
  { path: "/handson-2", element: <HandsOn2 /> },
  { path: "/handson-3", element: <HandsOn3 /> },
  { path: "/handson-4", element: <HandsOn4 /> },
  { path: "/handson-5", element: <HandsOn5 /> },
  { path: "/handson-6", element: <HandsOn6 /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
