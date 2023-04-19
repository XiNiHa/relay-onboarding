@module("../../../githubCredentials.local.ts")
external githubAccessToken: string = "githubAccessToken"

let environment = {
  let network = RescriptRelay.Network.makePromiseBased(
    ~fetchFunction=(operation, variables, _cacheConfig, _uploadables) => {
      open Webapi.Fetch

      fetchWithInit(
        "https://api.github.com/graphql",
        RequestInit.make(
          ~method_=Post,
          ~headers=HeadersInit.makeWithArray([
            ("Content-Type", "application/json"),
            ("Authorization", `Bearer ${githubAccessToken}`),
          ]),
          ~body=BodyInit.make(
            Js.Json.stringifyAny({"query": operation.text, "variables": variables})->Option.getExn,
          ),
          (),
        ),
      )->Promise.then(res => res->Response.json)
    },
    (),
  )
  let store = RescriptRelay.Store.make(~source=RescriptRelay.RecordSource.make(), ())

  RescriptRelay.Environment.make(~network, ~store, ())
}
