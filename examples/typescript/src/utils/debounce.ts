export const debounce = <Arguments extends unknown[]>(
  fn: (...args: Arguments) => void,
  delay: number,
) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Arguments) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};
