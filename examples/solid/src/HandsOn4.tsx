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
import {
  createFragment,
  createLazyLoadQuery,
  createMutation,
  createPaginationFragment,
} from "solid-relay";
import Loader from "./Loader";
import type { HandsOn4_RepoSearch_query$key } from "./__generated__/HandsOn4_RepoSearch_query.graphql";
import type { HandsOn4_RepoSearchRefetchQuery } from "./__generated__/HandsOn4_RepoSearchRefetchQuery.graphql";
import type { HandsOn4Query } from "./__generated__/HandsOn4Query.graphql";
import type { HandsOn4_RepoSummary_repository$key } from "./__generated__/HandsOn4_RepoSummary_repository.graphql";
import type { HandsOn4_FollowUserMutation } from "./__generated__/HandsOn4_FollowUserMutation.graphql";
import type { HandsOn4_UnfollowUserMutation } from "./__generated__/HandsOn4_UnfollowUserMutation.graphql";
import type { HandsOn4_RepoSummary_owner_user$key } from "./__generated__/HandsOn4_RepoSummary_owner_user.graphql";

export default function HandsOn4() {
  const [searchQuery, setSearchQuery] = createSignal("");

  const data = createLazyLoadQuery<HandsOn4Query>(
    graphql`
      query HandsOn4Query {
        ...HandsOn4_RepoSearch_query
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
  $query: HandsOn4_RepoSearch_query$key;
  searchQuery: string;
}) {
  const data = createPaginationFragment<
    HandsOn4_RepoSearchRefetchQuery,
    HandsOn4_RepoSearch_query$key
  >(
    graphql`
      fragment HandsOn4_RepoSearch_query on Query
      @argumentDefinitions(
        searchQuery: { type: "String", defaultValue: "" }
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 10 }
      )
      @refetchable(queryName: "HandsOn4_RepoSearchRefetchQuery") {
        search(
          query: $searchQuery
          type: REPOSITORY
          first: $count
          after: $cursor
        ) @connection(key: "HandsOn4_RepoSearch_query_search") {
          edges {
            node {
              ... on Repository {
                id
              }
              ...HandsOn4_RepoSummary_repository
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
  $repository: HandsOn4_RepoSummary_repository$key;
}) {
  const data = createFragment(
    graphql`
      fragment HandsOn4_RepoSummary_repository on Repository {
        id
        nameWithOwner
        stargazerCount
        owner {
          __typename
          ... on User {
            ...HandsOn4_RepoSummary_owner_user
          }
        }
      }
    `,
    () => props.$repository,
  );
  const repoOwner = createMemo(() => {
    const owner = data()?.owner;
    return owner?.__typename === "User"
      ? readInlineData<HandsOn4_RepoSummary_owner_user$key>(
          graphql`
            fragment HandsOn4_RepoSummary_owner_user on User @inline {
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
    createMutation<HandsOn4_FollowUserMutation>(graphql`
      mutation HandsOn4_FollowUserMutation($id: ID!) @raw_response_type {
        followUser(input: { userId: $id }) {
          user {
            ...HandsOn4_RepoSummary_owner_user
          }
        }
      }
    `);
  const [unfollowUser, isUnfollowUserInFlight] =
    createMutation<HandsOn4_UnfollowUserMutation>(graphql`
      mutation HandsOn4_UnfollowUserMutation($id: ID!) @raw_response_type {
        unfollowUser(input: { userId: $id }) {
          user {
            ...HandsOn4_RepoSummary_owner_user
          }
        }
      }
    `);

  const isInFlight = () => isFollowUserInFlight() || isUnfollowUserInFlight();

  const followRepoOwner = () => {
    return followUser({
      variables: { id: repoOwner()!.id },
      optimisticResponse: {
        followUser: {
          user: {
            id: repoOwner()!.id,
            viewerCanFollow: true,
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
            viewerCanFollow: true,
            viewerIsFollowing: false,
          },
        },
      },
    });
  };

  return (
    <Show when={data()}>
      {(data) => (
        <div>
          {data().nameWithOwner} {data().stargazerCount}
          <Show when={repoOwner()?.viewerCanFollow && repoOwner()}>
            {(repoOwner) => (
              <button
                disabled={isInFlight()}
                onClick={() => {
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
        </div>
      )}
    </Show>
  );
}
