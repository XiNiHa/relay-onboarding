import { Suspense, startTransition, useEffect, useState } from "react";
import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  usePaginationFragment,
} from "react-relay";
import { HandsOn3_RepoSearch_query$key } from "./__generated__/HandsOn3_RepoSearch_query.graphql";
import { HandsOn3Query } from "./__generated__/HandsOn3Query.graphql";
import { HandsOn3_RepoSummary_repository$key } from "./__generated__/HandsOn3_RepoSummary_repository.graphql";

export default function HandsOn2() {
  const [searchQuery, setSearchQuery] = useState("");

  const data = useLazyLoadQuery<HandsOn3Query>(
    graphql`
      query HandsOn3Query {
        ...HandsOn3_RepoSearch_query
      }
    `,
    {}
  );

  return (
    <div>
      <input type="text" onChange={(e) => setSearchQuery(e.target.value)} />
      <Suspense fallback={<div>Searching...</div>}>
        <RepoSearch $query={data} searchQuery={searchQuery} />
      </Suspense>
    </div>
  );
}

function RepoSearch({
  $query,
  searchQuery,
}: {
  $query: HandsOn3_RepoSearch_query$key;
  searchQuery: string;
}) {
  const { data, loadNext, isLoadingNext, refetch } = usePaginationFragment(
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
    $query
  );

  useEffect(() => {
    const timeout = setTimeout(() => refetch({ searchQuery }), 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  return (
    <>
      {data.search.edges?.map(
        (edge) =>
          edge?.node?.id && (
            <RepoSummary key={edge?.node?.id} $repository={edge?.node} />
          )
      )}
      <button
        disabled={isLoadingNext}
        onClick={() =>
          startTransition(() => {
            loadNext(10);
          })
        }
      >
        {isLoadingNext ? "불러오는 중..." : "더 불러오기"}
      </button>
    </>
  );
}

function RepoSummary({
  $repository,
}: {
  $repository: HandsOn3_RepoSummary_repository$key;
}) {
  const data = useFragment(
    graphql`
      fragment HandsOn3_RepoSummary_repository on Repository {
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
