import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  startTransition,
  Suspense,
} from "solid-js";
import { graphql, readInlineData } from "relay-runtime";
import type { PreloadedQuery } from "solid-relay";
import {
  createFragment,
  createLazyLoadQuery,
  createMutation,
  createPaginationFragment,
  createPreloadedQuery,
  createQueryLoader,
} from "solid-relay";
import Loader from "./Loader";
import type { HandsOn5_RepoSearch_query$key } from "./__generated__/HandsOn5_RepoSearch_query.graphql";
import type { HandsOn5_RepoSearchRefetchQuery } from "./__generated__/HandsOn5_RepoSearchRefetchQuery.graphql";
import type { HandsOn5Query } from "./__generated__/HandsOn5Query.graphql";
import type { HandsOn5_RepoSummary_repository$key } from "./__generated__/HandsOn5_RepoSummary_repository.graphql";
import type { HandsOn5_FollowUserMutation } from "./__generated__/HandsOn5_FollowUserMutation.graphql";
import type { HandsOn5_UnfollowUserMutation } from "./__generated__/HandsOn5_UnfollowUserMutation.graphql";
import type { HandsOn5_RepoIssues_repository$key } from "./__generated__/HandsOn5_RepoIssues_repository.graphql";
import type { HandsOn5_RepoIssuesRefetchQuery } from "./__generated__/HandsOn5_RepoIssuesRefetchQuery.graphql";
import type { HandsOn5_RepoDetailsQuery } from "./__generated__/HandsOn5_RepoDetailsQuery.graphql";
import type { HandsOn5_RepoSummary_owner_user$key } from "./__generated__/HandsOn5_RepoSummary_owner_user.graphql";

export default function HandsOn5() {
  const [searchQuery, setSearchQuery] = createSignal("");

  const data = createLazyLoadQuery<HandsOn5Query>(
    graphql`
      query HandsOn5Query {
        ...HandsOn5_RepoSearch_query
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
  $query: HandsOn5_RepoSearch_query$key;
  searchQuery: string;
}) {
  const data = createPaginationFragment<
    HandsOn5_RepoSearchRefetchQuery,
    HandsOn5_RepoSearch_query$key
  >(
    graphql`
      fragment HandsOn5_RepoSearch_query on Query
      @argumentDefinitions(
        searchQuery: { type: "String", defaultValue: "" }
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 10 }
      )
      @refetchable(queryName: "HandsOn5_RepoSearchRefetchQuery") {
        search(
          query: $searchQuery
          type: REPOSITORY
          first: $count
          after: $cursor
        ) @connection(key: "HandsOn5_RepoSearch_query_search") {
          edges {
            node {
              ... on Repository {
                id
              }
              ...HandsOn5_RepoSummary_repository
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
  $repository: HandsOn5_RepoSummary_repository$key;
}) {
  const data = createFragment(
    graphql`
      fragment HandsOn5_RepoSummary_repository on Repository {
        id
        nameWithOwner
        stargazerCount
        owner {
          __typename
          ... on User {
            ...HandsOn5_RepoSummary_owner_user
          }
        }
      }
    `,
    () => props.$repository,
  );
  const repoOwner = createMemo(() => {
    const owner = data()?.owner;
    return owner?.__typename === "User"
      ? readInlineData<HandsOn5_RepoSummary_owner_user$key>(
          graphql`
            fragment HandsOn5_RepoSummary_owner_user on User @inline {
              id
              viewerCanFollow
              viewerIsFollowing
            }
          `,
          owner,
        )
      : null;
  });
  const [followUser, isFollowUserInFlight] =
    createMutation<HandsOn5_FollowUserMutation>(graphql`
      mutation HandsOn5_FollowUserMutation($id: ID!) @raw_response_type {
        followUser(input: { userId: $id }) {
          user {
            id
            viewerIsFollowing
          }
        }
      }
    `);
  const [unfollowUser, isUnfollowUserInFlight] =
    createMutation<HandsOn5_UnfollowUserMutation>(graphql`
      mutation HandsOn5_UnfollowUserMutation($id: ID!) @raw_response_type {
        unfollowUser(input: { userId: $id }) {
          user {
            id
            viewerIsFollowing
          }
        }
      }
    `);
  const [detailsQueryRef, loadDetailsQuery] =
    createQueryLoader<HandsOn5_RepoDetailsQuery>(RepoDetailsQuery);

  const [showDetails, setShowDetails] = createSignal(false);
  const isInFlight = () => isFollowUserInFlight() || isUnfollowUserInFlight();

  const followRepoOwner = () => {
    return followUser({
      variables: { id: repoOwner()!.id },
      optimisticResponse: {
        followUser: {
          user: {
            id: repoOwner()!.id,
            viewerIsFollowing: true,
          },
        },
      },
    });
  };
  const unfollowRepoOwner = () => {
    return unfollowUser({
      variables: { id: repoOwner()!.id },
      optimisticResponse: {
        unfollowUser: {
          user: {
            id: repoOwner()!.id,
            viewerIsFollowing: false,
          },
        },
      },
    });
  };

  return (
    <Show when={data()}>
      {(data) => (
        <div
          onMouseEnter={() =>
            detailsQueryRef() || loadDetailsQuery({ id: data().id })
          }
          onClick={() => setShowDetails((prev) => !prev)}
        >
          {data().nameWithOwner} {data().stargazerCount}
          <Show when={repoOwner()?.viewerCanFollow && repoOwner()}>
            {(repoOwner) => (
              <button
                disabled={isInFlight()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (repoOwner().viewerIsFollowing) {
                    unfollowRepoOwner();
                  } else {
                    followRepoOwner();
                  }
                }}
              >
                {repoOwner().viewerIsFollowing ? "Unfollow" : "Follow"}
                <Show when={isInFlight()}>
                  <Loader />
                </Show>
              </button>
            )}
          </Show>
          <Suspense fallback={<Loader />}>
            <Show when={showDetails() && detailsQueryRef()}>
              {(queryRef) => <RepoDetails $query={queryRef()} />}
            </Show>
          </Suspense>
        </div>
      )}
    </Show>
  );
}

const RepoDetailsQuery = graphql`
  query HandsOn5_RepoDetailsQuery($id: ID!) {
    node(id: $id) {
      ... on Repository {
        id
        ...HandsOn5_RepoIssues_repository
      }
    }
  }
`;

interface RepoDetailsProps {
  $query: PreloadedQuery<HandsOn5_RepoDetailsQuery>;
}

const RepoDetails = (props: RepoDetailsProps) => {
  const data = createPreloadedQuery(RepoDetailsQuery, () => props.$query);

  return (
    <Show when={data()?.node?.id ? data()?.node : null}>
      {(node) => <RepoIssues $repository={node()} />}
    </Show>
  );
};

interface RepoIssuesProps {
  $repository: HandsOn5_RepoIssues_repository$key;
}

const RepoIssues = (props: RepoIssuesProps) => {
  const data = createPaginationFragment<
    HandsOn5_RepoIssuesRefetchQuery,
    HandsOn5_RepoIssues_repository$key
  >(
    graphql`
      fragment HandsOn5_RepoIssues_repository on Repository
      @argumentDefinitions(
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 10 }
      )
      @refetchable(queryName: "HandsOn5_RepoIssuesRefetchQuery") {
        issues(first: $count, after: $cursor)
          @connection(key: "RepoIssues_repository_issues") {
          edges {
            node {
              id
              title
              author {
                login
              }
            }
          }
        }
      }
    `,
    () => props.$repository,
  );

  return (
    <ul>
      <For each={data()?.issues.edges}>
        {(edge) => (
          <Show when={edge?.node}>
            {(node) => (
              <li>
                {node().title} by {node().author?.login}
              </li>
            )}
          </Show>
        )}
      </For>
    </ul>
  );
};
