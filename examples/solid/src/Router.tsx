import { lazy } from "solid-js";
import { Route, Router } from "@solidjs/router";

const HandsOn1 = lazy(() => import("./HandsOn1"));
const HandsOn2 = lazy(() => import("./HandsOn2"));
const HandsOn3 = lazy(() => import("./HandsOn3"));
const HandsOn4 = lazy(() => import("./HandsOn4"));
const HandsOn5 = lazy(() => import("./HandsOn5"));
const HandsOn6 = lazy(() => import("./HandsOn6"));

export default function AppRouter() {
  return (
    <Router>
      <Route path="/handson-1" component={HandsOn1} />
      <Route path="/handson-2" component={HandsOn2} />
      <Route path="/handson-3" component={HandsOn3} />
      <Route path="/handson-4" component={HandsOn4} />
      <Route path="/handson-5" component={HandsOn5} />
      <Route path="/handson-6" component={HandsOn6} />
    </Router>
  );
}
