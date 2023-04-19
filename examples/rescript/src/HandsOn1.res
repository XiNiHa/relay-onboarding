module RepoSummary = {
  module Fragment = %relay(`
    fragment HandsOn1_RepoSummary_repository on Repository {
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

module Query = %relay(`
  query HandsOn1Query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      ...HandsOn1_RepoSummary_repository
    }
  }
`)

@react.component
let make = () => {
  let (_, startTransition) = React.useTransition()

  let (owner, setOwner) = React.useState(_ => "")
  let (name, setName) = React.useState(_ => "")
  let data = Query.use(~variables=Query.makeVariables(~owner, ~name), ())

  let setOwnerDebounced = Utils.debounce1(v => startTransition(.() => setOwner(v)), 500)
  let setNameDebounced = Utils.debounce1(v => startTransition(.() => setName(v)), 500)

  <>
    <input
      onChange={e => {
        let value = ReactEvent.Form.target(e)["value"]
        setOwnerDebounced(_ => value)
      }}
    />
    <input
      onChange={e => {
        let value = ReactEvent.Form.target(e)["value"]
        setNameDebounced(_ => value)
      }}
    />
    {switch data.repository {
    | Some(repo) => <RepoSummary repositoryRef={repo.fragmentRefs} />
    | None => React.null
    }}
  </>
}

let default = make
