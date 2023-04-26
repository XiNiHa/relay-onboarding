import { startTransition, useState } from "react";
import { graphql, useFragment, useLazyLoadQuery } from "react-relay";
import { debounce } from "./utils/debounce";
import { HandsOn1Query } from "./__generated__/HandsOn1Query.graphql";
import { HandsOn1_RepoSummary_repository$key } from "./__generated__/HandsOn1_RepoSummary_repository.graphql";

export default function HandsOn1() {
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");

  const setOwnerDebounced = debounce(
    (v: string) => startTransition(() => setOwner(v)),
    500
  );
  const setNameDebounced = debounce(
    (v: string) => startTransition(() => setName(v)),
    500
  );

  const data = useLazyLoadQuery<HandsOn1Query>(
    graphql`
      query HandsOn1Query($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          ...HandsOn1_RepoSummary_repository
        }
      }
    `,
    { owner, name }
  );

  return (
    <div>
      <input type="text" onChange={(e) => setOwnerDebounced(e.target.value)} />
      <input type="text" onChange={(e) => setNameDebounced(e.target.value)} />
      {data.repository && <RepoSummary $repository={data.repository} />}
    </div>
  );
}

function RepoSummary({
  $repository,
}: {
  $repository: HandsOn1_RepoSummary_repository$key;
}) {
  const data = useFragment(
    graphql`
      fragment HandsOn1_RepoSummary_repository on Repository {
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
