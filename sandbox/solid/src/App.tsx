import { Show } from "solid-js";
import { graphql } from "relay-runtime";
import { createLazyLoadQuery } from "solid-relay";
import type { AppQuery } from "./__generated__/AppQuery.graphql";

export default function App() {
  const data = createLazyLoadQuery<AppQuery>(
    graphql`
      query AppQuery {
        viewer {
          login
        }
      }
    `,
    {},
  );

  return <Show when={data()}>{(data) => data().viewer.login}</Show>;
}
