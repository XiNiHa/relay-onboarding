import { graphql, useLazyLoadQuery } from "react-relay";
import { AppQuery } from "./__generated__/AppQuery.graphql";

export default function App() {
  const data = useLazyLoadQuery<AppQuery>(
    graphql`
      query AppQuery {
        viewer {
          login
        }
      }
    `,
    {}
  );

  return <>{data.viewer.login}</>;
}
