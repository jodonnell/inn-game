import { createScene } from "@/src/draw/create-scene.js"
import { createTilemap } from "@/src/draw/map/create-tilemap.js"
import { createKeyboardInput } from "@/src/input/keyboard.js"
import { createRegistry, createSystemRunner } from "@/src/core/ecs/index.js"
import {
  AnimationSet,
  AnimationState,
  Bell,
  InputState,
  Interactable,
  MapLayer,
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
import { createInteractions } from "@/src/game/interactions/index.js"

const registerSystems = (systems) => {
  for (const system of managerSystems) {
    systems.addSystem(system)
  }
  return systems
}

const createInteractableEntities = (registry, interactables = []) => {
  const created = []
  for (const definition of interactables) {
    const entity = registry.createEntity()
    registry.addComponent(entity, Interactable, {
      tile: {
        x: definition.tile?.x ?? 0,
        y: definition.tile?.y ?? 0,
      },
      metadata: { ...(definition.metadata ?? {}) },
    })

    if (definition.type === "bell") {
      registry.addComponent(entity, Bell, {})
    }

    created.push(entity)
  }
  return created
}

export const test = async ({
  debugSink,
  keyboardTarget,
  keyboardFactory = createKeyboardInput,
  audio,
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
  const interactions = createInteractions(registry)

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
    interactables: map.interactables,
    dimensions: map.dimensions,
  })
  createInteractableEntities(registry, map.interactables)

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
      Interactable,
      Bell,
    },
    entities: {
      manager: managerEntity,
      map: mapEntity,
    },
    map: {
      container: map.container,
      collisions: map.collisions,
      layers: map.layers,
      interactables: map.interactables,
      dimensions: map.dimensions,
      entity: mapEntity,
    },
    computeDebug: () => computeManagerDebug(registry, managerEntity),
    resetEntityState: () => resetManagerState(registry, managerEntity),
    debugSink,
    interactions,
    audio,
  })

  if (!debugSink && typeof window !== "undefined") {
    attachRuntimeToWindow(runtime, window)
  }

  runtime.start()
  return runtime
}
