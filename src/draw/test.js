import { createScene } from "@/src/draw/create-scene.js"
import { createTilemap } from "@/src/draw/map/create-tilemap.js"
import { createKeyboardInput } from "@/src/input/keyboard.js"
import { createRegistry, createSystemRunner } from "@/src/core/ecs/index.js"
import {
  AnimationSet,
  AnimationState,
  InputState,
  Movement,
  SpriteRef,
  Transform,
  MapLayer,
} from "@/src/game/components.js"
import {
  computeManagerDebug,
  resetManagerState,
} from "@/src/game/debug/manager-debug.js"
import { attachRuntimeToWindow } from "@/src/game/debug/window-bridge.js"
import { createManagerEntity } from "@/src/game/entities/manager-entity.js"
import { createMapEntity } from "@/src/game/entities/map-entity.js"
import {
  loadManagerResources,
  preloadManagerAssets,
} from "@/src/game/resources/manager-resources.js"
import {
  loadMapResources,
  preloadMapAssets,
} from "@/src/game/resources/map-resources.js"
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
  const scene = await createScene()
  const { app, world } = scene
  await Promise.all([preloadMapAssets(), preloadManagerAssets()])

  const mapResources = await loadMapResources()
  const map = createTilemap(mapResources)
  world.addChild(map.container)

  const { sprite, animations } = await loadManagerResources()
  world.addChild(sprite)

  const registry = createRegistry()
  const systems = registerSystems(createSystemRunner(registry))

  const createInput = keyboardFactory ?? createKeyboardInput
  const keyboard =
    createInput(keyboardTarget) ?? createKeyboardInput(keyboardTarget)

  const managerEntity = createManagerEntity(registry, {
    sprite,
    animations,
    keyboard,
  })
  const mapEntity = createMapEntity(registry, {
    container: map.container,
    collisions: map.collisions,
    layers: map.layers,
    dimensions: map.dimensions,
  })

  const runtime = createGameRuntime({
    app,
    scene,
    registry,
    systems,
    keyboard,
    components: {
      MapLayer,
      Transform,
      Movement,
      SpriteRef,
      AnimationSet,
      AnimationState,
      InputState,
    },
    entities: {
      manager: managerEntity,
      map: mapEntity,
    },
    map: {
      container: map.container,
      collisions: map.collisions,
      layers: map.layers,
      dimensions: map.dimensions,
      entity: mapEntity,
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
