type router

@module("./router.jsx") external router: router = "router"

module RouterProvider = {
  type props = {router: router}

  @module("react-router-dom") external make: React.component<props> = "RouterProvider"
}

let rootEl =
  Webapi.Dom.window->Webapi.Dom.Window.document->Webapi.Dom.Document.getElementById(_, "root")

switch rootEl {
| Some(el) =>
  el
  ->ReactDOM.Client.createRoot
  ->ReactDOM.Client.Root.render(
    <React.StrictMode>
      <RescriptRelay.Context.Provider environment={RelayEnvironment.environment}>
        <React.Suspense>
          <RouterProvider router />
        </React.Suspense>
      </RescriptRelay.Context.Provider>
    </React.StrictMode>,
  )
| None => Console.log("No root element found")
}
