import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
  startTransition,
  Suspense,
} from "solid-js";
import type { JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { ConnectionHandler, graphql, readInlineData } from "relay-runtime";
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
import type { HandsOn6_RepoSearch_query$key } from "./__generated__/HandsOn6_RepoSearch_query.graphql";
import type { HandsOn6_RepoSearchRefetchQuery } from "./__generated__/HandsOn6_RepoSearchRefetchQuery.graphql";
import type { HandsOn6Query } from "./__generated__/HandsOn6Query.graphql";
import type { HandsOn6_RepoSummary_repository$key } from "./__generated__/HandsOn6_RepoSummary_repository.graphql";
import type { HandsOn6_FollowUserMutation } from "./__generated__/HandsOn6_FollowUserMutation.graphql";
import type { HandsOn6_UnfollowUserMutation } from "./__generated__/HandsOn6_UnfollowUserMutation.graphql";
import type { HandsOn6_RepoIssues_repository$key } from "./__generated__/HandsOn6_RepoIssues_repository.graphql";
import type { HandsOn6_RepoIssuesRefetchQuery } from "./__generated__/HandsOn6_RepoIssuesRefetchQuery.graphql";
import type { HandsOn6_RepoDetailsQuery } from "./__generated__/HandsOn6_RepoDetailsQuery.graphql";
import type { HandsOn6_RepoIssues_issue$key } from "./__generated__/HandsOn6_RepoIssues_issue.graphql";
import type { HandsOn6_CreateIssueMutation } from "./__generated__/HandsOn6_CreateIssueMutation.graphql";

export default function HandsOn6() {
  const [searchQuery, setSearchQuery] = createSignal("");

  const data = createLazyLoadQuery<HandsOn6Query>(
    graphql`
      query HandsOn6Query {
        ...HandsOn6_RepoSearch_query
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
  $query: HandsOn6_RepoSearch_query$key;
  searchQuery: string;
}) {
  const data = createPaginationFragment<
    HandsOn6_RepoSearchRefetchQuery,
    HandsOn6_RepoSearch_query$key
  >(
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
  $repository: HandsOn6_RepoSummary_repository$key;
}) {
  const data = createFragment(
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
    () => props.$repository,
  );
  const [followUser, isFollowUserInFlight] =
    createMutation<HandsOn6_FollowUserMutation>(graphql`
      mutation HandsOn6_FollowUserMutation($id: ID!) @raw_response_type {
        followUser(input: { userId: $id }) {
          user {
            id
            viewerIsFollowing
          }
        }
      }
    `);
  const [unfollowUser, isUnfollowUserInFlight] =
    createMutation<HandsOn6_UnfollowUserMutation>(graphql`
      mutation HandsOn6_UnfollowUserMutation($id: ID!) @raw_response_type {
        unfollowUser(input: { userId: $id }) {
          user {
            id
            viewerIsFollowing
          }
        }
      }
    `);
  const [detailsQueryRef, loadDetailsQuery] =
    createQueryLoader<HandsOn6_RepoDetailsQuery>(RepoDetailsQuery);

  const [showDetails, setShowDetails] = createSignal(false);
  const isInFlight = () => isFollowUserInFlight() || isUnfollowUserInFlight();

  const followRepoOwner = () => {
    return followUser({
      variables: { id: data()!.owner.id! },
      optimisticResponse: {
        followUser: {
          user: {
            id: data()!.owner.id!,
            viewerIsFollowing: true,
          },
        },
      },
    });
  };
  const unfollowRepoOwner = () => {
    return unfollowUser({
      variables: { id: data()!.owner.id! },
      optimisticResponse: {
        unfollowUser: {
          user: {
            id: data()!.owner.id!,
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
          <Show when={data().owner.viewerCanFollow}>
            <button
              disabled={isInFlight()}
              onClick={(e) => {
                e.stopPropagation();
                if (data().owner.viewerIsFollowing) {
                  unfollowRepoOwner();
                } else {
                  followRepoOwner();
                }
              }}
            >
              {data().owner.viewerIsFollowing ? "Unfollow" : "Follow"}
              <Show when={isInFlight()}>
                <Loader />
              </Show>
            </button>
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

const RepoDetails = (props: RepoDetailsProps) => {
  const data = createPreloadedQuery(RepoDetailsQuery, () => props.$query);

  return (
    <Show when={data()?.node?.id ? data()?.node : null}>
      {(node) => <RepoIssues $repository={node()} />}
    </Show>
  );
};

interface RepoIssuesProps {
  $repository: HandsOn6_RepoIssues_repository$key;
}

const RepoIssues = (props: RepoIssuesProps) => {
  const data = createPaginationFragment<
    HandsOn6_RepoIssuesRefetchQuery,
    HandsOn6_RepoIssues_repository$key
  >(
    graphql`
      fragment HandsOn6_RepoIssues_repository on Repository
      @argumentDefinitions(
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 10 }
      )
      @refetchable(queryName: "HandsOn6_RepoIssuesRefetchQuery") {
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
    () => props.$repository,
  );

  const [showModal, setShowModal] = createSignal(false);

  return (
    <>
      <ul>
        <For each={data()?.issues.edges}>
          {(edge) => {
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
              edge.node,
            );

            return (
              <li>
                {issue.title} by {issue.author?.login}
              </li>
            );
          }}
        </For>
      </ul>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
      >
        새로운 이슈
      </button>
      <Show when={showModal() && data()}>
        {(data) => (
          <CreateIssueModal
            repositoryId={data().id}
            onClose={() => setShowModal(false)}
          />
        )}
      </Show>
    </>
  );
};

interface CreateIssueModalProps {
  repositoryId: string;
  onClose: () => void;
}

const CreateIssueModal = (props: CreateIssueModalProps) => {
  const [createIssue, isCreateIssueInFlight] =
    createMutation<HandsOn6_CreateIssueMutation>(graphql`
      mutation HandsOn6_CreateIssueMutation(
        $input: CreateIssueInput!
        $connections: [ID!]!
      ) {
        createIssue(input: $input) {
          issue
            @prependNode(connections: $connections, edgeTypeName: "IssueEdge") {
            ...HandsOn6_RepoIssues_issue
          }
        }
      }
    `);

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;

    createIssue({
      variables: {
        input: { repositoryId: props.repositoryId, title, body },
        connections: [
          ConnectionHandler.getConnectionID(
            props.repositoryId,
            "RepoIssues_repository_issues",
          ),
        ],
      },
      onCompleted() {
        props.onClose();
      },
    });
  };

  return (
    <Portal mount={document.body}>
      <div
        style={{
          position: "fixed",
          inset: "0",
          background: "rgb(0, 0, 0, 0.3)",
          display: "flex",
          "justify-content": "center",
          "align-items": "center",
        }}
        onClick={() => props.onClose()}
      >
        <form
          style={{
            width: "400px",
            height: "400px",
            "border-radius": "20px",
            background: "white",
            "box-shadow": "0 0 10px rgba(0, 0, 0, 0.3)",
            padding: "20px",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "10px",
          }}
          onSubmit={onSubmit}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ width: "100%" }}>
            <label style={{ display: "flex", gap: "10px" }}>
              제목: <input name="title" style={{ "flex-grow": "1" }} />
            </label>
          </div>
          <div style={{ width: "100%", "flex-grow": "1" }}>
            <label>
              내용:{" "}
              <textarea name="body" style={{ width: "100%", height: "80%" }} />
            </label>
          </div>
          <button disabled={isCreateIssueInFlight()}>확인</button>
        </form>
      </div>
    </Portal>
  );
};
