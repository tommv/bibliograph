export async function wait(delay: number = 0) {
  return new Promise((resolve) => (delay ? setTimeout(resolve, delay) : requestIdleCallback(resolve)));
}
