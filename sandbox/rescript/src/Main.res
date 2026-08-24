let rootEl =
  Webapi.Dom.window->Webapi.Dom.Window.document->Webapi.Dom.Document.getElementById(_, "root")

switch rootEl {
| Some(el) =>
  el
  ->ReactDOM.Client.createRoot
  ->ReactDOM.Client.Root.render(
    <React.StrictMode>
      <RescriptRelayReact.Context.Provider environment={RelayEnvironment.environment}>
        <React.Suspense>
          <App />
        </React.Suspense>
      </RescriptRelayReact.Context.Provider>
    </React.StrictMode>,
  )
| None => Console.log("No root element found")
}
