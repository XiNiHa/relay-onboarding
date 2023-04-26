module RepoSummary = {
  module Fragment = %relay(`
    fragment HandsOn4_RepoSummary_repository on Repository {
      nameWithOwner
      stargazerCount
      owner {
        ... on User {
          ...HandsOn4_RepoSummary_owner_user
        }
      }
    }
  `)

  module UserFragment = %relay(`
    fragment HandsOn4_RepoSummary_owner_user on User @inline {
      id
      viewerCanFollow
      viewerIsFollowing
    }
  `)

  module FollowUser = %relay(`
    mutation HandsOn4_FollowUserMutation($id: ID!) {
      followUser(input: { userId: $id }) {
        user {
          ...HandsOn4_RepoSummary_owner_user
        }
      }
    }
  `)

  module UnfollowUser = %relay(`
    mutation HandsOn4_UnfollowUserMutation($id: ID!) {
      unfollowUser(input: { userId: $id }) {
        user {
          ...HandsOn4_RepoSummary_owner_user
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

    <div>
      {React.string(`${repository.nameWithOwner} `)}
      {React.int(repository.stargazerCount)}
      {switch repoOwner {
      | Some({viewerCanFollow: true} as owner) =>
        <button
          disabled={isInFlight}
          onClick={_ => {
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
    </div>
  }
}

module RepoSearch = {
  module Fragment = %relay(`
    fragment HandsOn4_RepoSearch_query on Query
    @argumentDefinitions(
      searchQuery: { type: "String", defaultValue: "" }
      cursor: { type: "String" }
      count: { type: "Int", defaultValue: 10 }
    )
    @refetchable(queryName: "HandsOn4_RepoSearchRefetchQuery") {
      search(query: $searchQuery, type: REPOSITORY, first: $count, after: $cursor)
        @connection(key: "HandsOn4_RepoSearch_query_search") {
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
  query HandsOn4Query {
    ...HandsOn4_RepoSearch_query
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
