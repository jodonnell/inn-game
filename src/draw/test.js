import { createScene } from "@/src/draw/create-scene.js"
import { useKeyboardInput } from "@/src/input/keyboard.js"
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
import { createManagerEntity } from "@/src/game/entities/manager-entity.js"
import {
  loadManagerResources,
  preloadManagerAssets,
} from "@/src/game/resources/manager-resources.js"
import { managerSystems } from "@/src/game/systems/index.js"

export const test = async () => {
  const app = await createScene()
  await preloadManagerAssets()

  const { sprite, animations } = await loadManagerResources()
  app.stage.addChild(sprite)

  const registry = createRegistry()
  const systems = createSystemRunner(registry)
  for (const system of managerSystems) {
    systems.addSystem(system)
  }

  const keyboard = useKeyboardInput()

  const managerEntity = createManagerEntity(registry, {
    sprite,
    animations,
    keyboard,
  })

  const updateDebugState = () => {
    window.__innGame.debug = computeManagerDebug(registry, managerEntity)
  }

  const resetPosition = () => {
    resetManagerState(registry, managerEntity)
    updateDebugState()
  }

  const innGame = {
    app,
    ecs: {
      registry,
      systems,
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
    },
    keyboard,
    managerEntity,
    resetPosition,
    debug: {},
  }

  window.__innGame = innGame
  updateDebugState()

  app.ticker.add((ticker) => {
    systems.run(ticker.deltaTime)
    updateDebugState()
  })
}
