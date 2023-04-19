let debounce1 = (fn, delay) => {
  let timeout = ref(None);

  (arg) => {
    switch timeout.contents {
    | Some(timeout) => clearTimeout(timeout)
    | None => ()
    }
    timeout := Some(setTimeout(() => fn(arg), delay))
  };
};
