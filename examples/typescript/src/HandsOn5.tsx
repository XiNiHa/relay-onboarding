import { Suspense, startTransition, useEffect, useState } from "react";
import {
  PreloadedQuery,
  graphql,
  readInlineData,
  useFragment,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
  usePreloadedQuery,
  useQueryLoader,
} from "react-relay";
import Loader from "./Loader";
import { HandsOn5_RepoSearch_query$key } from "./__generated__/HandsOn5_RepoSearch_query.graphql";
import { HandsOn5Query } from "./__generated__/HandsOn5Query.graphql";
import { HandsOn5_RepoSummary_repository$key } from "./__generated__/HandsOn5_RepoSummary_repository.graphql";
import { HandsOn5_FollowUserMutation } from "./__generated__/HandsOn5_FollowUserMutation.graphql";
import { HandsOn5_UnfollowUserMutation } from "./__generated__/HandsOn5_UnfollowUserMutation.graphql";
import { HandsOn5_RepoIssues_repository$key } from "./__generated__/HandsOn5_RepoIssues_repository.graphql";
import { HandsOn5_RepoDetailsQuery } from "./__generated__/HandsOn5_RepoDetailsQuery.graphql";
import { HandsOn5_RepoSummary_owner_user$key } from "./__generated__/HandsOn5_RepoSummary_owner_user.graphql";

export default function HandsOn2() {
  const [searchQuery, setSearchQuery] = useState("");

  const data = useLazyLoadQuery<HandsOn5Query>(
    graphql`
      query HandsOn5Query {
        ...HandsOn5_RepoSearch_query
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
  $query: HandsOn5_RepoSearch_query$key;
  searchQuery: string;
}) {
  const { data, loadNext, isLoadingNext, refetch } = usePaginationFragment(
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
  $repository: HandsOn5_RepoSummary_repository$key;
}) {
  const data = useFragment(
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
    $repository
  );
  const repoOwner =
    data.owner.__typename === "User"
      ? readInlineData<HandsOn5_RepoSummary_owner_user$key>(
          graphql`
            fragment HandsOn5_RepoSummary_owner_user on User @inline {
              id
              viewerCanFollow
              viewerIsFollowing
            }
          `,
          data.owner
        )
      : null;
  const [followUser, isFollowUserInFlight] =
    useMutation<HandsOn5_FollowUserMutation>(
      graphql`
        mutation HandsOn5_FollowUserMutation($id: ID!) {
          followUser(input: { userId: $id }) {
            user {
              id
              viewerIsFollowing
            }
          }
        }
      `
    );
  const [unfollowUser, isUnfollowUserInFlight] =
    useMutation<HandsOn5_UnfollowUserMutation>(
      graphql`
        mutation HandsOn5_UnfollowUserMutation($id: ID!) {
          unfollowUser(input: { userId: $id }) {
            user {
              id
              viewerIsFollowing
            }
          }
        }
      `
    );
  const [detailsQueryRef, loadDetailsQuery] =
    useQueryLoader<HandsOn5_RepoDetailsQuery>(RepoDetailsQuery);

  const [showDetails, setShowDetails] = useState(false);
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
    <div
      onMouseEnter={() => detailsQueryRef || loadDetailsQuery({ id: data.id })}
      onClick={() => setShowDetails((prev) => !prev)}
    >
      {data.nameWithOwner} {data.stargazerCount}
      {repoOwner?.viewerCanFollow && (
        <button
          disabled={isInFlight}
          onClick={e => {
            e.stopPropagation()
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
      <Suspense fallback={<Loader />}>
        {showDetails && detailsQueryRef && (
          <RepoDetails $query={detailsQueryRef} />
        )}
      </Suspense>
    </div>
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

const RepoDetails = ({ $query }: RepoDetailsProps) => {
  const data = usePreloadedQuery(RepoDetailsQuery, $query);

  return <>{data.node?.id && <RepoIssues $repository={data.node} />}</>;
};

interface RepoIssuesProps {
  $repository: HandsOn5_RepoIssues_repository$key;
}

const RepoIssues = ({ $repository }: RepoIssuesProps) => {
  const { data } = usePaginationFragment(
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
    $repository
  );

  return (
    <ul>
      {data.issues.edges?.map(
        (edge) =>
          edge?.node && (
            <li key={edge.node.id}>
              {edge.node.title} by {edge.node.author?.login}
            </li>
          )
      )}
    </ul>
  );
};
