import { createBellAudio } from "@/src/audio/bell.js"
import { createInteractions } from "@/src/game/interactions/index.js"

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
  interactions: providedInteractions,
  audio: providedAudio,
}) => {
  let sink = debugSink ?? noop
  const interactions = providedInteractions ?? createInteractions(registry)
  const bellAudio = createBellAudio()
  const audio =
    providedAudio ??
    {
      playBell: (metadata) => bellAudio.playBell(metadata),
      loadBell: () => bellAudio.load(),
    }
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
    interactions,
    audio,
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
    systems.run(ticker.deltaTime, { map, interactions, audio })
    keyboard?.flush?.()
    publishDebug()
  }

  runtime.start = () => {
    if (running) return
    running = true
    audio.loadBell?.()
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
    interactions: runtime.interactions,
    audio: runtime.audio,
  })

  return runtime
}
