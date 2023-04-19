import { createBrowserRouter } from "react-router-dom";
import HandsOn1 from "./HandsOn1.bs.js"

export const router = createBrowserRouter([
  {
    path: "/handson-1",
    element: <HandsOn1 />
  }
])
