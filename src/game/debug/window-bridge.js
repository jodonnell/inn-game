export const attachRuntimeToWindow = (runtime, target = window) => {
  if (typeof target === "undefined") return
  target.__innGame = runtime
  runtime.setDebugSink(() => {
    target.__innGame = runtime
  })
}
