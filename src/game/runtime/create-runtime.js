const noop = () => {}

export const createGameRuntime = ({
  app,
  scene,
  registry,
  systems,
  components,
  entities,
  keyboard,
  map = null,
  computeDebug,
  resetEntityState,
  debugSink,
}) => {
  let sink = debugSink ?? noop
  const runtime = {
    app,
    scene: {
      world: scene?.world,
      metrics: scene?.metrics,
    },
    ecs: {
      registry,
      systems,
      components,
      entities,
    },
    keyboard,
    managerEntity: entities.manager,
    map,
    debug: {},
  }

  const publishDebug = () => {
    const state = computeDebug()
    runtime.debug = state
    sink(state, runtime)
  }

  runtime.resetPosition = () => {
    resetEntityState()
    publishDebug()
  }

  runtime.setDebugSink = (next) => {
    sink = next ?? noop
    publishDebug()
  }

  let running = false
  const handleTick = (ticker) => {
    systems.run(ticker.deltaTime, { map })
    publishDebug()
  }

  runtime.start = () => {
    if (running) return
    running = true
    app.ticker.add(handleTick)
    publishDebug()
  }

  runtime.stop = () => {
    if (!running) return
    running = false
    app.ticker.remove(handleTick)
  }

  runtime.dispose = () => {
    runtime.stop()
    keyboard?.dispose?.()
    scene?.dispose?.()
  }

  runtime.snapshot = () => ({
    app: runtime.app,
    scene: runtime.scene,
    ecs: runtime.ecs,
    keyboard: runtime.keyboard,
    managerEntity: runtime.managerEntity,
    map: runtime.map,
    debug: runtime.debug,
  })

  return runtime
}
