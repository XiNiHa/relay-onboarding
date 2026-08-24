@val @scope(("import", "meta", "env"))
external githubAccessToken: option<string> = "VITE_GITHUB_ACCESS_TOKEN"

let environment = {
  let network = RescriptRelay.Network.makePromiseBased(~fetchFunction=(
    operation,
    variables,
    _cacheConfig,
    _uploadables,
  ) => {
    open Webapi.Fetch

    (
      async () => {
        let githubAccessToken = switch githubAccessToken {
        | Some(token) => token
        | None =>
          Error.panic(
            "VITE_GITHUB_ACCESS_TOKEN is missing. Copy .env.example to .env and add a GitHub access token.",
          )
        }

        let res = await fetchWithInit(
          "https://api.github.com/graphql",
          RequestInit.make(
            ~method_=Post,
            ~headers=HeadersInit.makeWithArray([
              ("Content-Type", "application/json"),
              ("Authorization", `Bearer ${githubAccessToken}`),
            ]),
            ~body=BodyInit.make(
              JSON.stringifyAny({
                "query": operation.text->Nullable.getExn,
                "variables": variables,
              })->Option.getExn,
            ),
            (),
          ),
        )

        if !Response.ok(res) {
          Error.panic(`GitHub GraphQL request failed (${Response.status(res)->Int.toString}).`)
        }

        await Response.json(res)
      }
    )()
  })
  let store = RescriptRelay.Store.make(~source=RescriptRelay.RecordSource.make())

  RescriptRelay.Environment.make(~network, ~store)
}
