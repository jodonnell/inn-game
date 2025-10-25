import { createScene } from "@/src/draw/create-scene.js"
import { createKeyboardInput } from "@/src/input/keyboard.js"
import { createRegistry, createSystemRunner } from "@/src/core/ecs/index.js"
import {
  AnimationSet,
  AnimationState,
  InputState,
  Movement,
  SpriteRef,
  Transform,
} from "@/src/game/components.js"
import {
  computeManagerDebug,
  resetManagerState,
} from "@/src/game/debug/manager-debug.js"
import { attachRuntimeToWindow } from "@/src/game/debug/window-bridge.js"
import { createManagerEntity } from "@/src/game/entities/manager-entity.js"
import {
  loadManagerResources,
  preloadManagerAssets,
} from "@/src/game/resources/manager-resources.js"
import { createGameRuntime } from "@/src/game/runtime/create-runtime.js"
import { managerSystems } from "@/src/game/systems/index.js"

const registerSystems = (systems) => {
  for (const system of managerSystems) {
    systems.addSystem(system)
  }
  return systems
}

export const test = async ({
  debugSink,
  keyboardTarget,
  keyboardFactory = createKeyboardInput,
} = {}) => {
  const app = await createScene()
  await preloadManagerAssets()

  const { sprite, animations } = await loadManagerResources()
  app.stage.addChild(sprite)

  const registry = createRegistry()
  const systems = registerSystems(createSystemRunner(registry))

  const createInput = keyboardFactory ?? createKeyboardInput
  const keyboard = createInput(keyboardTarget) ?? createKeyboardInput(keyboardTarget)

  const managerEntity = createManagerEntity(registry, {
    sprite,
    animations,
    keyboard,
  })

  const runtime = createGameRuntime({
    app,
    registry,
    systems,
    keyboard,
    components: {
      Transform,
      Movement,
      SpriteRef,
      AnimationSet,
      AnimationState,
      InputState,
    },
    entities: {
      manager: managerEntity,
    },
    computeDebug: () => computeManagerDebug(registry, managerEntity),
    resetEntityState: () => resetManagerState(registry, managerEntity),
    debugSink,
  })

  if (!debugSink && typeof window !== "undefined") {
    attachRuntimeToWindow(runtime, window)
  }

  runtime.start()
  return runtime
}
