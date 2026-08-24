import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
  startTransition,
  Suspense,
} from "solid-js";
import { graphql } from "relay-runtime";
import {
  createFragment,
  createLazyLoadQuery,
  createPaginationFragment,
} from "solid-relay";
import type { HandsOn3_RepoSearch_query$key } from "./__generated__/HandsOn3_RepoSearch_query.graphql";
import type { HandsOn3_RepoSearchRefetchQuery } from "./__generated__/HandsOn3_RepoSearchRefetchQuery.graphql";
import type { HandsOn3Query } from "./__generated__/HandsOn3Query.graphql";
import type { HandsOn3_RepoSummary_repository$key } from "./__generated__/HandsOn3_RepoSummary_repository.graphql";

export default function HandsOn3() {
  const [searchQuery, setSearchQuery] = createSignal("");

  const data = createLazyLoadQuery<HandsOn3Query>(
    graphql`
      query HandsOn3Query {
        ...HandsOn3_RepoSearch_query
      }
    `,
    {},
  );

  return (
    <div>
      <input
        type="text"
        onInput={(e) => setSearchQuery(e.currentTarget.value)}
      />
      <Suspense fallback={<div>Searching...</div>}>
        <Show when={data()}>
          {(query) => (
            <RepoSearch $query={query()} searchQuery={searchQuery()} />
          )}
        </Show>
      </Suspense>
    </div>
  );
}

function RepoSearch(props: {
  $query: HandsOn3_RepoSearch_query$key;
  searchQuery: string;
}) {
  const data = createPaginationFragment<
    HandsOn3_RepoSearchRefetchQuery,
    HandsOn3_RepoSearch_query$key
  >(
    graphql`
      fragment HandsOn3_RepoSearch_query on Query
      @argumentDefinitions(
        searchQuery: { type: "String", defaultValue: "" }
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 10 }
      )
      @refetchable(queryName: "HandsOn3_RepoSearchRefetchQuery") {
        search(
          query: $searchQuery
          type: REPOSITORY
          first: $count
          after: $cursor
        ) @connection(key: "HandsOn3_RepoSearch_query_search") {
          edges {
            node {
              ... on Repository {
                id
              }
              ...HandsOn3_RepoSummary_repository
            }
          }
        }
      }
    `,
    () => props.$query,
  );

  createEffect(() => {
    const searchQuery = props.searchQuery;
    const timeout = setTimeout(() => data.refetch({ searchQuery }), 500);
    onCleanup(() => clearTimeout(timeout));
  });

  return (
    <>
      <For each={data()?.search.edges}>
        {(edge) => (
          <Show when={edge?.node?.id ? edge.node : null}>
            {(node) => <RepoSummary $repository={node()} />}
          </Show>
        )}
      </For>
      <button
        disabled={data.isLoadingNext}
        onClick={() =>
          startTransition(() => {
            data.loadNext(10);
          })
        }
      >
        {data.isLoadingNext ? "불러오는 중..." : "더 불러오기"}
      </button>
    </>
  );
}

function RepoSummary(props: {
  $repository: HandsOn3_RepoSummary_repository$key;
}) {
  const data = createFragment(
    graphql`
      fragment HandsOn3_RepoSummary_repository on Repository {
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
