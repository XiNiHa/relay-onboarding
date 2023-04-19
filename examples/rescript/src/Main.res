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
          <App />
        </React.Suspense>
      </RescriptRelay.Context.Provider>
    </React.StrictMode>,
  )
| None => Console.log("No root element found")
}
