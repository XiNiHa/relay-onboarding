import { Suspense, startTransition, useEffect, useState } from "react";
import {
  graphql,
  readInlineData,
  useFragment,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
} from "react-relay";
import Loader from "./Loader";
import { HandsOn4_RepoSearch_query$key } from "./__generated__/HandsOn4_RepoSearch_query.graphql";
import { HandsOn4Query } from "./__generated__/HandsOn4Query.graphql";
import { HandsOn4_RepoSummary_repository$key } from "./__generated__/HandsOn4_RepoSummary_repository.graphql";
import { HandsOn4_FollowUserMutation } from "./__generated__/HandsOn4_FollowUserMutation.graphql";
import { HandsOn4_UnfollowUserMutation } from "./__generated__/HandsOn4_UnfollowUserMutation.graphql";
import { HandsOn4_RepoSummary_owner_user$key } from "./__generated__/HandsOn4_RepoSummary_owner_user.graphql";

export default function HandsOn2() {
  const [searchQuery, setSearchQuery] = useState("");

  const data = useLazyLoadQuery<HandsOn4Query>(
    graphql`
      query HandsOn4Query {
        ...HandsOn4_RepoSearch_query
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
  $query: HandsOn4_RepoSearch_query$key;
  searchQuery: string;
}) {
  const { data, loadNext, isLoadingNext, refetch } = usePaginationFragment(
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
  $repository: HandsOn4_RepoSummary_repository$key;
}) {
  const data = useFragment(
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
    $repository
  );
  const repoOwner =
    data.owner.__typename === "User"
      ? readInlineData<HandsOn4_RepoSummary_owner_user$key>(
          graphql`
            fragment HandsOn4_RepoSummary_owner_user on User @inline {
              id
              viewerCanFollow
              viewerIsFollowing
            }
          `,
          data.owner
        )
      : null;
  const [followUser, isFollowUserInFlight] =
    useMutation<HandsOn4_FollowUserMutation>(
      graphql`
        mutation HandsOn4_FollowUserMutation($id: ID!) {
          followUser(input: { userId: $id }) {
            user {
              ...HandsOn4_RepoSummary_owner_user
            }
          }
        }
      `
    );
  const [unfollowUser, isUnfollowUserInFlight] =
    useMutation<HandsOn4_UnfollowUserMutation>(
      graphql`
        mutation HandsOn4_UnfollowUserMutation($id: ID!) {
          unfollowUser(input: { userId: $id }) {
            user {
              ...HandsOn4_RepoSummary_owner_user
            }
          }
        }
      `
    );

  const isInFlight = isFollowUserInFlight || isUnfollowUserInFlight;

  const followRepoOwner = () => {
    return followUser({
      variables: { id: repoOwner!.id },
      optimisticResponse: {
        followUser: {
          user: {
            id: repoOwner!.id,
            viewerCanFollow: true,
            viewerIsFollowing: true,
          },
        },
      },
    });
  };
  const unfollowRepoOwner = () => {
    return unfollowUser({
      variables: { id: repoOwner!.id },
      optimisticResponse: {
        unfollowUser: {
          user: {
            id: repoOwner!.id,
            viewerCanFollow: true,
            viewerIsFollowing: false,
          },
        },
      },
    });
  };

  return (
    <div>
      {data.nameWithOwner} {data.stargazerCount}
      {repoOwner?.viewerCanFollow && (
        <button
          disabled={isInFlight}
          onClick={() => {
            if (repoOwner.viewerIsFollowing) {
              unfollowRepoOwner();
            } else {
              followRepoOwner();
            }
          }}
        >
          {repoOwner.viewerIsFollowing ? "Unfollow" : "Follow"}
          {isInFlight && <Loader />}
        </button>
      )}
    </div>
  );
}
