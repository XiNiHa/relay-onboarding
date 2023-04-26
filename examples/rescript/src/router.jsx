import { createBrowserRouter } from "react-router-dom";
import HandsOn1 from "./HandsOn1.bs.js";
import HandsOn2 from "./HandsOn2.bs.js";
import HandsOn3 from "./HandsOn3.bs.js";
import HandsOn4 from "./HandsOn4.bs.js";
import HandsOn5 from "./HandsOn5.bs.js";
import HandsOn6 from "./HandsOn6.bs.js";

export const router = createBrowserRouter([
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
  {
    path: "/handson-6",
    element: <HandsOn6 />,
  },
]);
