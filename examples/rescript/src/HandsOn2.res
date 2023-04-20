module RepoSummary = {
  module Fragment = %relay(`
    fragment HandsOn2_RepoSummary_repository on Repository {
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
    fragment HandsOn2_RepoSearch_query on Query
    @argumentDefinitions(
      owner: { type: "String", defaultValue: "" }
      name: { type: "String", defaultValue: "" }
    )
    @refetchable(queryName: "RepoSearchRefetchQuery") {
      repository(owner: $owner, name: $name) {
        ...HandsOn2_RepoSummary_repository
      }
    }
  `)

  @react.component
  let make = (~queryRef, ~owner, ~name) => {
    let (query, refetch) = Fragment.useRefetchable(queryRef)

    React.useEffect2(() => {
      let timeout = setTimeout(
        () =>
          refetch(
            ~variables=Fragment.makeRefetchVariables(~owner=Some(owner), ~name=Some(name), ()),
            (),
          )->ignore,
        500,
      )
      Some(() => clearTimeout(timeout))
    }, (owner, name))

    switch query.repository {
    | Some(repo) => <RepoSummary repositoryRef={repo.fragmentRefs} />
    | None => <div> {React.string("Not found")} </div>
    }
  }
}

module Query = %relay(`
  query HandsOn2Query {
    ...HandsOn2_RepoSearch_query
  }
`)

@react.component
let make = () => {
  let (owner, setOwner) = React.useState(_ => "")
  let (name, setName) = React.useState(_ => "")
  let data = Query.use(~variables=(), ())

  <>
    <input onChange={e => setOwner(_ => ReactEvent.Form.target(e)["value"])} />
    <input onChange={e => setName(_ => ReactEvent.Form.target(e)["value"])} />
    <React.Suspense fallback={<div> {React.string("Searching...")} </div>}>
      <RepoSearch queryRef={data.fragmentRefs} owner name />
    </React.Suspense>
  </>
}

let default = make
