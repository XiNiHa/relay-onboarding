import {
  createEffect,
  createSignal,
  onCleanup,
  Show,
  Suspense,
} from "solid-js";
import { graphql } from "relay-runtime";
import {
  createFragment,
  createLazyLoadQuery,
  createRefetchableFragment,
} from "solid-relay";
import type { HandsOn2Query } from "./__generated__/HandsOn2Query.graphql";
import type { HandsOn2_RepoSummary_repository$key } from "./__generated__/HandsOn2_RepoSummary_repository.graphql";
import type { HandsOn2_RepoSearch_query$key } from "./__generated__/HandsOn2_RepoSearch_query.graphql";
import type { HandsOn2_RepoSearchRefetchQuery } from "./__generated__/HandsOn2_RepoSearchRefetchQuery.graphql";

export default function HandsOn2() {
  const [owner, setOwner] = createSignal("");
  const [name, setName] = createSignal("");

  const data = createLazyLoadQuery<HandsOn2Query>(
    graphql`
      query HandsOn2Query {
        ...HandsOn2_RepoSearch_query
      }
    `,
    {},
  );

  return (
    <div>
      <input type="text" onInput={(e) => setOwner(e.currentTarget.value)} />
      <input type="text" onInput={(e) => setName(e.currentTarget.value)} />
      <Suspense fallback={<div>Searching...</div>}>
        <Show when={data()}>
          {(query) => (
            <RepoSearch $query={query()} owner={owner()} name={name()} />
          )}
        </Show>
      </Suspense>
    </div>
  );
}

function RepoSearch(props: {
  $query: HandsOn2_RepoSearch_query$key;
  owner: string;
  name: string;
}) {
  const [query, refetch] = createRefetchableFragment<
    HandsOn2_RepoSearchRefetchQuery,
    HandsOn2_RepoSearch_query$key
  >(
    graphql`
      fragment HandsOn2_RepoSearch_query on Query
      @argumentDefinitions(
        owner: { type: "String", defaultValue: "" }
        name: { type: "String", defaultValue: "" }
      )
      @refetchable(queryName: "HandsOn2_RepoSearchRefetchQuery") {
        repository(owner: $owner, name: $name) {
          ...HandsOn2_RepoSummary_repository
        }
      }
    `,
    () => props.$query,
  );

  createEffect(() => {
    const owner = props.owner;
    const name = props.name;
    const timeout = setTimeout(() => refetch({ owner, name }), 500);
    onCleanup(() => clearTimeout(timeout));
  });

  return (
    <Show when={query()?.repository} fallback={<div>Not found</div>}>
      {(repository) => <RepoSummary $repository={repository()} />}
    </Show>
  );
}

function RepoSummary(props: {
  $repository: HandsOn2_RepoSummary_repository$key;
}) {
  const data = createFragment(
    graphql`
      fragment HandsOn2_RepoSummary_repository on Repository {
        nameWithOwner
        stargazerCount
      }
    `,
    () => props.$repository,
  );

  return (
    <Show when={data()}>
      {(data) => (
        <div>
          {data().nameWithOwner} {data().stargazerCount}
        </div>
      )}
    </Show>
  );
}
