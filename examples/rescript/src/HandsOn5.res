module RepoIssues = {
  module Fragment = %relay(`
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
  `)

  @react.component
  let make = (~repositoryRef) => {
    let {data} = Fragment.usePagination(repositoryRef)

    <ul>
      {switch data.issues.edges {
      | Some(edges) =>
        edges
        ->Array.map(edge =>
          switch edge {
          | Some({node: Some(node)}) => {
              let author = node.author->Option.mapWithDefault("unknown", author => author.login)

              <li key={node.id}> {React.string(`${node.title} by ${author}`)} </li>
            }
          | _ => React.null
          }
        )
        ->React.array
      | None => React.null
      }}
    </ul>
  }
}

module RepoDetails = {
  module Query = %relay(`
    query HandsOn5_RepoDetailsQuery($id: ID!) {
      node(id: $id) {
        ... on Repository {
          id
          ...HandsOn5_RepoIssues_repository
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
    fragment HandsOn5_RepoSummary_repository on Repository {
      id
      nameWithOwner
      stargazerCount
      owner {
        ... on User {
          ...HandsOn5_RepoSummary_owner_user
        }
      }
    }
  `)

  module UserFragment = %relay(`
    fragment HandsOn5_RepoSummary_owner_user on User @inline {
      id
      viewerCanFollow
      viewerIsFollowing
    }
  `)

  module FollowUser = %relay(`
    mutation HandsOn5_FollowUserMutation($id: ID!) {
      followUser(input: { userId: $id }) {
        user {
          ...HandsOn5_RepoSummary_owner_user
        }
      }
    }
  `)

  module UnfollowUser = %relay(`
    mutation HandsOn5_UnfollowUserMutation($id: ID!) {
      unfollowUser(input: { userId: $id }) {
        user {
          ...HandsOn5_RepoSummary_owner_user
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
    fragment HandsOn5_RepoSearch_query on Query
    @argumentDefinitions(
      searchQuery: { type: "String", defaultValue: "" }
      cursor: { type: "String" }
      count: { type: "Int", defaultValue: 10 }
    )
    @refetchable(queryName: "HandsOn5_RepoSearchRefetchQuery") {
      search(query: $searchQuery, type: REPOSITORY, first: $count, after: $cursor)
        @connection(key: "HandsOn5_RepoSearch_query_search") {
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
  query HandsOn5Query {
    ...HandsOn5_RepoSearch_query
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
