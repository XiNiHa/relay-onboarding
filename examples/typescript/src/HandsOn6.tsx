import { Suspense, startTransition, useEffect, useState } from "react";
import {
  ConnectionHandler,
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
import { HandsOn6_RepoSearch_query$key } from "./__generated__/HandsOn6_RepoSearch_query.graphql";
import { HandsOn6Query } from "./__generated__/HandsOn6Query.graphql";
import { HandsOn6_RepoSummary_repository$key } from "./__generated__/HandsOn6_RepoSummary_repository.graphql";
import { HandsOn6_FollowUserMutation } from "./__generated__/HandsOn6_FollowUserMutation.graphql";
import { HandsOn6_UnfollowUserMutation } from "./__generated__/HandsOn6_UnfollowUserMutation.graphql";
import { HandsOn6_RepoIssues_repository$key } from "./__generated__/HandsOn6_RepoIssues_repository.graphql";
import { HandsOn6_RepoDetailsQuery } from "./__generated__/HandsOn6_RepoDetailsQuery.graphql";
import { createPortal } from "react-dom";
import { HandsOn6_RepoIssues_issue$key } from "./__generated__/HandsOn6_RepoIssues_issue.graphql";
import { HandsOn6_CreateIssueMutation } from "./__generated__/HandsOn6_CreateIssueMutation.graphql";

export default function HandsOn2() {
  const [searchQuery, setSearchQuery] = useState("");

  const data = useLazyLoadQuery<HandsOn6Query>(
    graphql`
      query HandsOn6Query {
        ...HandsOn6_RepoSearch_query
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
  $query: HandsOn6_RepoSearch_query$key;
  searchQuery: string;
}) {
  const { data, loadNext, isLoadingNext, refetch } = usePaginationFragment(
    graphql`
      fragment HandsOn6_RepoSearch_query on Query
      @argumentDefinitions(
        searchQuery: { type: "String", defaultValue: "" }
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 10 }
      )
      @refetchable(queryName: "HandsOn6_RepoSearchRefetchQuery") {
        search(
          query: $searchQuery
          type: REPOSITORY
          first: $count
          after: $cursor
        ) @connection(key: "HandsOn6_RepoSearch_query_search") {
          edges {
            node {
              ... on Repository {
                id
              }
              ...HandsOn6_RepoSummary_repository
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
  $repository: HandsOn6_RepoSummary_repository$key;
}) {
  const data = useFragment(
    graphql`
      fragment HandsOn6_RepoSummary_repository on Repository {
        id
        nameWithOwner
        stargazerCount
        owner {
          ... on User {
            id
            viewerCanFollow
            viewerIsFollowing
          }
        }
      }
    `,
    $repository
  );
  const [followUser, isFollowUserInFlight] =
    useMutation<HandsOn6_FollowUserMutation>(
      graphql`
        mutation HandsOn6_FollowUserMutation($id: ID!) {
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
    useMutation<HandsOn6_UnfollowUserMutation>(
      graphql`
        mutation HandsOn6_UnfollowUserMutation($id: ID!) {
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
    useQueryLoader<HandsOn6_RepoDetailsQuery>(RepoDetailsQuery);

  const [showDetails, setShowDetails] = useState(false);
  const isInFlight = isFollowUserInFlight || isUnfollowUserInFlight;

  const followRepoOwner = () => {
    return followUser({
      variables: { id: data.owner.id! },
      optimisticResponse: {
        followUser: {
          user: {
            id: data.owner.id,
            viewerIsFollowing: true,
          },
        },
      },
    });
  };
  const unfollowRepoOwner = () => {
    return unfollowUser({
      variables: { id: data.owner.id! },
      optimisticResponse: {
        unfollowUser: {
          user: {
            id: data.owner.id,
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
      {data.owner.viewerCanFollow && (
        <button
          disabled={isInFlight}
          onClick={(e) => {
            e.stopPropagation();
            if (data.owner.viewerIsFollowing) {
              unfollowRepoOwner();
            } else {
              followRepoOwner();
            }
          }}
        >
          {data.owner.viewerIsFollowing ? "Unfollow" : "Follow"}
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
  query HandsOn6_RepoDetailsQuery($id: ID!) {
    node(id: $id) {
      ... on Repository {
        id
        ...HandsOn6_RepoIssues_repository
      }
    }
  }
`;

interface RepoDetailsProps {
  $query: PreloadedQuery<HandsOn6_RepoDetailsQuery>;
}

const RepoDetails = ({ $query }: RepoDetailsProps) => {
  const data = usePreloadedQuery(RepoDetailsQuery, $query);

  return <>{data.node?.id && <RepoIssues $repository={data.node} />}</>;
};

interface RepoIssuesProps {
  $repository: HandsOn6_RepoIssues_repository$key;
}

const RepoIssues = ({ $repository }: RepoIssuesProps) => {
  const { data } = usePaginationFragment(
    graphql`
      fragment HandsOn6_RepoIssues_repository on Repository
      @argumentDefinitions(
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 10 }
      )
      @refetchable(queryName: "RepoIssuesRefetchQuery") {
        issues(first: $count, after: $cursor)
          @connection(key: "RepoIssues_repository_issues") {
          edges {
            node {
              ...HandsOn6_RepoIssues_issue
            }
          }
        }
      }
    `,
    $repository
  );

  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <ul>
        {data.issues.edges?.map((edge) => {
          if (!edge?.node) return null;

          const issue = readInlineData<HandsOn6_RepoIssues_issue$key>(
            graphql`
              fragment HandsOn6_RepoIssues_issue on Issue @inline {
                id
                title
                author {
                  login
                }
              }
            `,
            edge.node
          );

          return (
            <li key={issue.id}>
              {issue.title} by {issue.author?.login}
            </li>
          );
        })}
      </ul>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
      >
        새로운 이슈
      </button>
      {showModal && (
        <CreateIssueModal
          repositoryId={data.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

interface CreateIssueModalProps {
  repositoryId: string;
  onClose: () => void;
}

const CreateIssueModal = ({ repositoryId, onClose }: CreateIssueModalProps) => {
  const [createIssue, isCreateIssueInFlight] =
    useMutation<HandsOn6_CreateIssueMutation>(
      graphql`
        mutation HandsOn6_CreateIssueMutation(
          $input: CreateIssueInput!
          $connections: [ID!]!
        ) {
          createIssue(input: $input) {
            issue
              @prependNode(
                connections: $connections
                edgeTypeName: "IssueEdge"
              ) {
              ...HandsOn6_RepoIssues_issue
            }
          }
        }
      `
    );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;

    createIssue({
      variables: {
        input: { repositoryId, title, body },
        connections: [
          ConnectionHandler.getConnectionID(
            repositoryId,
            "RepoIssues_repository_issues"
          ),
        ],
      },
      onCompleted() {
        onClose();
      },
    });
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: "0",
        background: "rgb(0, 0, 0, 0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={onClose}
    >
      <form
        style={{
          width: "400px",
          height: "400px",
          borderRadius: "20px",
          background: "white",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: "100%" }}>
          <label style={{ display: "flex", gap: "10px" }}>
            제목: <input name="title" style={{ flexGrow: "1" }} />
          </label>
        </div>
        <div style={{ width: "100%", flexGrow: "1" }}>
          <label>
            내용:{" "}
            <textarea name="body" style={{ width: "100%", height: "80%" }} />
          </label>
        </div>
        <button disabled={isCreateIssueInFlight}>확인</button>
      </form>
    </div>,
    document.body
  );
};
