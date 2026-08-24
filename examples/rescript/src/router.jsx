import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

const HandsOn1 = lazy(() => import("./HandsOn1.res.js"));
const HandsOn2 = lazy(() => import("./HandsOn2.res.js"));
const HandsOn3 = lazy(() => import("./HandsOn3.res.js"));
const HandsOn4 = lazy(() => import("./HandsOn4.res.js"));
const HandsOn5 = lazy(() => import("./HandsOn5.res.js"));
const HandsOn6 = lazy(() => import("./HandsOn6.res.js"));

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
