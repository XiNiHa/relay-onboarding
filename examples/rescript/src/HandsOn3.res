module RepoSummary = {
  module Fragment = %relay(`
    fragment HandsOn3_RepoSummary_repository on Repository {
      nameWithOwner
      stargazerCount
    }
  `)

  @react.component
  let make = (~repositoryRef) => {
    let repository = Fragment.use(repositoryRef)

    <div>
      {React.string(`${repository.nameWithOwner} `)}
      {React.int(repository.stargazerCount)}
    </div>
  }
}

module RepoSearch = {
  module Fragment = %relay(`
    fragment HandsOn3_RepoSearch_query on Query
    @argumentDefinitions(
      searchQuery: { type: "String", defaultValue: "" }
      cursor: { type: "String" }
      count: { type: "Int", defaultValue: 10 }
    )
    @refetchable(queryName: "HandsOn3_RepoSearchRefetchQuery") {
      search(query: $searchQuery, type: REPOSITORY, first: $count, after: $cursor)
        @connection(key: "HandsOn3_RepoSearch_query_search") {
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
  query HandsOn3Query {
    ...HandsOn3_RepoSearch_query
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
