module Query = %relay(`
  query AppQuery {
    viewer {
      login
    }
  }
`)

@react.component
let make = () => {
  let data = Query.use(~variables=())

  <> {React.string(data.viewer.login)} </>
}
