module CreateIssueModal = {
  module CreateIssue = %relay(`
    mutation HandsOn6_CreateIssueMutation(
      $input: CreateIssueInput!
      $connections: [ID!]!
    ) {
      createIssue(input: $input) {
        issue @prependNode(connections: $connections, edgeTypeName: "IssueEdge") {
          ...HandsOn6_RepoIssues_issue
        }
      }
    }
  `)

  @react.component
  let make = (~repositoryId, ~onClose) => {
    let (createIssue, isCreateIssueInFlight) = CreateIssue.use()

    let onSubmit = e => {
      open Webapi

      JsxEvent.Form.preventDefault(e)

      let formData: FormData.t = %raw(`(form) => new FormData(form)`)(JsxEvent.Form.target(e))
      let title = formData->FormData.get("title")->Option.getExn->FormData.EntryValue.classify
      let body = formData->FormData.get("body")->Option.getExn->FormData.EntryValue.classify

      switch (title, body) {
      | (#String(title), #String(body)) =>
        createIssue(
          ~variables=CreateIssue.makeVariables(
            ~input=CreateIssue.make_createIssueInput(~repositoryId, ~title, ~body, ()),
            ~connections=[
              repositoryId
              ->RescriptRelay.makeDataId
              ->RescriptRelay.ConnectionHandler.getConnectionID("RepoIssues_repository_issues", ()),
            ],
          ),
          ~onCompleted=(_, _) => onClose(),
          (),
        )->ignore
      | _ => ()
      }
    }

    ReactDOM.createPortal(
      <div
        style={{
          position: "fixed",
          top: "0",
          bottom: "0",
          left: "0",
          right: "0",
          background: "rgb(0, 0, 0, 0.3)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={_ => onClose()}>
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
          onClick={JsxEvent.Mouse.stopPropagation}>
          <div style={{width: "100%"}}>
            <label style={{display: "flex", gap: "10px"}}>
              {React.string("제목:")}
              <input name="title" style={{flexGrow: "1"}} />
            </label>
          </div>
          <div style={{width: "100%", flexGrow: "1"}}>
            <label>
              {React.string("내용: ")}
              <textarea name="body" style={{width: "100%", height: "80%"}} />
            </label>
          </div>
          <button disabled={isCreateIssueInFlight}> {React.string("확인")} </button>
        </form>
      </div>,
      document->Webapi.Dom.Document.querySelector("body")->Option.getExn,
    )
  }
}

module RepoIssues = {
  module Fragment = %relay(`
    fragment HandsOn6_RepoIssues_repository on Repository
    @argumentDefinitions(
      cursor: { type: "String" }
      count: { type: "Int", defaultValue: 10 }
    )
    @refetchable(queryName: "HandsOn6_RepoIssuesRefetchQuery") {
      id
      issues(first: $count, after: $cursor)
        @connection(key: "RepoIssues_repository_issues") {
        edges {
          node {
            ...HandsOn6_RepoIssues_issue
          }
        }
      }
    }
  `)

  module IssueFragment = %relay(`
    fragment HandsOn6_RepoIssues_issue on Issue @inline {
      id
      title
      author {
        login
      }
    }
  `)

  @react.component
  let make = (~repositoryRef) => {
    let {data} = Fragment.usePagination(repositoryRef)
    let (showModal, setShowModal) = React.useState(() => false)

    <>
      <ul>
        {switch data.issues.edges {
        | Some(edges) =>
          edges
          ->Array.map(edge =>
            switch edge {
            | Some({node: Some(node)}) => {
                let issue = IssueFragment.readInline(node.fragmentRefs)
                let author = issue.author->Option.mapWithDefault("unknown", author => author.login)

                <li key={issue.id}> {React.string(`${issue.title} by ${author}`)} </li>
              }
            | _ => React.null
            }
          )
          ->React.array
        | None => React.null
        }}
      </ul>
      <button
        onClick={e => {
          JsxEvent.Mouse.stopPropagation(e)
          setShowModal(_ => true)
        }}>
        {React.string("새로운 이슈")}
      </button>
      {showModal
        ? <CreateIssueModal repositoryId={data.id} onClose={() => setShowModal(_ => false)} />
        : React.null}
    </>
  }
}

module RepoDetails = {
  module Query = %relay(`
    query HandsOn6_RepoDetailsQuery($id: ID!) {
      node(id: $id) {
        ... on Repository {
          id
          ...HandsOn6_RepoIssues_repository
        }
      }
    }
  `)

  @react.component
  let make = (~queryRef) => {
    let data = Query.usePreloaded(~queryRef, ())

    switch data.node {
    | Some(node) => <RepoIssues repositoryRef={node.fragmentRefs} />
    | None => React.null
    }
  }
}

module RepoSummary = {
  module Fragment = %relay(`
    fragment HandsOn6_RepoSummary_repository on Repository {
      id
      nameWithOwner
      stargazerCount
      owner {
        ... on User {
          ...HandsOn6_RepoSummary_owner_user
        }
      }
    }
  `)

  module UserFragment = %relay(`
    fragment HandsOn6_RepoSummary_owner_user on User @inline {
      id
      viewerCanFollow
      viewerIsFollowing
    }
  `)

  module FollowUser = %relay(`
    mutation HandsOn6_FollowUserMutation($id: ID!) {
      followUser(input: { userId: $id }) {
        user {
          ...HandsOn6_RepoSummary_owner_user
        }
      }
    }
  `)

  module UnfollowUser = %relay(`
    mutation HandsOn6_UnfollowUserMutation($id: ID!) {
      unfollowUser(input: { userId: $id }) {
        user {
          ...HandsOn6_RepoSummary_owner_user
        }
      }
    }
  `)

  @react.component
  let make = (~repositoryRef) => {
    let repository = Fragment.use(repositoryRef)
    let repoOwner = switch repository.owner {
    | #User(user) => Some(UserFragment.readInline(user.fragmentRefs))
    | _ => None
    }

    let (followUser, isFollowUserInFlight) = FollowUser.use()
    let (unfollowUser, isUnfollowUserInFlight) = UnfollowUser.use()
    let (detailsQueryRef, loadDetailsQuery, _) = RepoDetails.Query.useLoader()

    let (showDetails, setShowDetails) = React.useState(() => false)
    let isInFlight = isFollowUserInFlight || isUnfollowUserInFlight

    let followRepoOwner = () => {
      switch repoOwner {
      | Some(owner) =>
        followUser(
          ~variables=FollowUser.makeVariables(~id=owner.id),
          ~optimisticResponse={
            followUser: Obj.magic({
              "user": {
                "id": owner.id,
                "viewerCanFollow": true,
                "viewerIsFollowing": true,
              },
            }),
          },
          (),
        )->ignore
      | None => ()
      }
    }

    let unfollowRepoOwner = () => {
      switch repoOwner {
      | Some(owner) =>
        unfollowUser(
          ~variables=UnfollowUser.makeVariables(~id=owner.id),
          ~optimisticResponse={
            unfollowUser: Obj.magic({
              "user": {
                "id": owner.id,
                "viewerCanFollow": true,
                "viewerIsFollowing": false,
              },
            }),
          },
          (),
        )->ignore
      | None => ()
      }
    }

    <div
      onMouseEnter={_ =>
        switch detailsQueryRef {
        | None =>
          loadDetailsQuery(~variables=RepoDetails.Query.makeVariables(~id=repository.id), ())
        | _ => ()
        }}
      onClick={_ => setShowDetails(prev => !prev)}>
      {React.string(`${repository.nameWithOwner} `)}
      {React.int(repository.stargazerCount)}
      {switch repoOwner {
      | Some({viewerCanFollow: true} as owner) =>
        <button
          disabled={isInFlight}
          onClick={e => {
            JsxEvent.Mouse.stopPropagation(e)
            if owner.viewerIsFollowing {
              unfollowRepoOwner()
            } else {
              followRepoOwner()
            }
          }}>
          {React.string(owner.viewerIsFollowing ? "Unfollow" : "Follow")}
          {isInFlight ? <Loader /> : React.null}
        </button>
      | _ => React.null
      }}
      <React.Suspense fallback={<Loader />}>
        {switch (showDetails, detailsQueryRef) {
        | (true, Some(detailsQueryRef)) => <RepoDetails queryRef={detailsQueryRef} />
        | _ => React.null
        }}
      </React.Suspense>
    </div>
  }
}

module RepoSearch = {
  module Fragment = %relay(`
    fragment HandsOn6_RepoSearch_query on Query
    @argumentDefinitions(
      searchQuery: { type: "String", defaultValue: "" }
      cursor: { type: "String" }
      count: { type: "Int", defaultValue: 10 }
    )
    @refetchable(queryName: "HandsOn6_RepoSearchRefetchQuery") {
      search(query: $searchQuery, type: REPOSITORY, first: $count, after: $cursor)
        @connection(key: "HandsOn6_RepoSearch_query_search") {
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
  `)

  @react.component
  let make = (~queryRef, ~searchQuery) => {
    let {data, loadNext, isLoadingNext, refetch} = Fragment.usePagination(queryRef)
    let (_, startTransition) = React.useTransition()

    React.useEffect1(() => {
      let timeout = setTimeout(
        () =>
          refetch(
            ~variables=Fragment.makeRefetchVariables(~searchQuery=Some(searchQuery), ()),
            (),
          )->ignore,
        500,
      )
      Some(() => clearTimeout(timeout))
    }, [searchQuery])

    <>
      {switch data.search.edges {
      | Some(edges) =>
        edges
        ->Array.filterMap(edge =>
          switch edge {
          | Some({node: Some({id: Some(id), fragmentRefs})}) =>
            Some(<RepoSummary key={id} repositoryRef={fragmentRefs} />)
          | _ => None
          }
        )
        ->React.array
      | None => React.null
      }}
      <button
        disabled={isLoadingNext}
        onClick={_ =>
          startTransition(.() => {
            loadNext(~count=10, ())->ignore
          })}>
        {React.string(isLoadingNext ? "불러오는 중..." : "더 불러오기")}
      </button>
    </>
  }
}

module Query = %relay(`
  query HandsOn6Query {
    ...HandsOn6_RepoSearch_query
  }
`)

@react.component
let make = () => {
  let (searchQuery, setSearchQuery) = React.useState(_ => "")
  let data = Query.use(~variables=(), ())

  <>
    <input onChange={e => setSearchQuery(_ => ReactEvent.Form.target(e)["value"])} />
    <React.Suspense fallback={<div> {React.string("Searching...")} </div>}>
      <RepoSearch queryRef={data.fragmentRefs} searchQuery />
    </React.Suspense>
  </>
}

let default = make
