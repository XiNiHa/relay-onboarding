import { Suspense, useEffect, useState } from "react";
import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useRefetchableFragment,
} from "react-relay";
import { HandsOn2Query } from "./__generated__/HandsOn2Query.graphql";
import { HandsOn2_RepoSummary_repository$key } from "./__generated__/HandsOn2_RepoSummary_repository.graphql";
import { HandsOn2_RepoSearch_query$key } from "./__generated__/HandsOn2_RepoSearch_query.graphql";

export default function HandsOn2() {
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");

  const data = useLazyLoadQuery<HandsOn2Query>(
    graphql`
      query HandsOn2Query {
        ...HandsOn2_RepoSearch_query
      }
    `,
    {}
  );

  return (
    <div>
      <input type="text" onChange={(e) => setOwner(e.target.value)} />
      <input type="text" onChange={(e) => setName(e.target.value)} />
      <Suspense fallback={<div>Searching...</div>}>
        <RepoSearch $query={data} owner={owner} name={name} />
      </Suspense>
    </div>
  );
}

function RepoSearch({
  $query,
  owner,
  name,
}: {
  $query: HandsOn2_RepoSearch_query$key;
  owner: string;
  name: string;
}) {
  const [query, refetch] = useRefetchableFragment(
    graphql`
      fragment HandsOn2_RepoSearch_query on Query
      @argumentDefinitions(
        owner: { type: "String", defaultValue: "" }
        name: { type: "String", defaultValue: "" }
      )
      @refetchable(queryName: "RepoSearchRefetchQuery") {
        repository(owner: $owner, name: $name) {
          ...HandsOn2_RepoSummary_repository
        }
      }
    `,
    $query
  );

  useEffect(() => {
    const timeout = setTimeout(() => refetch({ owner, name }), 500);
    return () => clearTimeout(timeout);
  }, [owner, name]);

  return query.repository ? (
    <RepoSummary $repository={query.repository} />
  ) : (
    <div>Not found</div>
  );
}

function RepoSummary({
  $repository,
}: {
  $repository: HandsOn2_RepoSummary_repository$key;
}) {
  const data = useFragment(
    graphql`
      fragment HandsOn2_RepoSummary_repository on Repository {
        nameWithOwner
        stargazerCount
      }
    `,
    $repository
  );

  return (
    <div>
      {data.nameWithOwner} {data.stargazerCount}
    </div>
  );
}
