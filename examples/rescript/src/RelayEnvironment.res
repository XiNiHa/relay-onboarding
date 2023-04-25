@module("../../../githubCredentials.local.ts")
external githubAccessToken: string = "githubAccessToken"

let environment = {
  let network = RescriptRelay.Network.makePromiseBased(
    ~fetchFunction=(operation, variables, _cacheConfig, _uploadables) => {
      open Webapi.Fetch

      (
        async () => {
          let res = await fetchWithInit(
            "https://api.github.com/graphql",
            RequestInit.make(
              ~method_=Post,
              ~headers=HeadersInit.makeWithArray([
                ("Content-Type", "application/json"),
                ("X-Github-Next-Global-ID", "1"),
                ("Authorization", `Bearer ${githubAccessToken}`),
              ]),
              ~body=BodyInit.make(
                Js.Json.stringifyAny({
                  "query": operation.text,
                  "variables": variables,
                })->Option.getExn,
              ),
              (),
            ),
          )

          await Response.json(res)
        }
      )()
    },
    (),
  )
  let store = RescriptRelay.Store.make(~source=RescriptRelay.RecordSource.make(), ())

  RescriptRelay.Environment.make(~network, ~store, ())
}
