import { describe, expect, it, jest } from "@jest/globals"

const mapInteractables = [
  {
    id: 101,
    tile: { x: 12, y: 5 },
    type: "bell",
    metadata: { interaction: "bell", sound: "bright" },
  },
]

const createMocks = () => {
  let nextEntityId = 1
  const registry = {
    createEntity: jest.fn(() => nextEntityId++),
    addComponent: jest.fn(),
    query: jest.fn(() => []),
    getComponent: jest.fn(),
  }

  const systems = {
    addSystem: jest.fn(),
    run: jest.fn(),
  }

  const interactions = {
    findByTile: jest.fn(),
    trigger: jest.fn(),
    subscribe: jest.fn(),
    clear: jest.fn(),
  }

  const world = {
    addChild: jest.fn(),
  }

  const app = {
    ticker: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  }

  return {
    registry,
    systems,
    interactions,
    world,
    app,
    keyboard: { pressed: new Set(), flush: jest.fn(), dispose: jest.fn() },
  }
}

describe("test bootstrap", () => {
  it("creates bell interactable entities from map definitions", async () => {
    const mocks = createMocks()

    await jest.unstable_mockModule("@/src/draw/create-scene.js", () => ({
      createScene: jest.fn(() =>
        Promise.resolve({
          app: mocks.app,
          world: mocks.world,
        }),
      ),
    }))

    await jest.unstable_mockModule("@/src/draw/map/create-tilemap.js", () => ({
      createTilemap: jest.fn(() => ({
        container: { label: "tilemap", addChild: jest.fn() },
        collisions: [],
        layers: [],
        interactables: mapInteractables,
        dimensions: { tilewidth: 32, tileheight: 32, width: 30, height: 20 },
      })),
    }))

    await jest.unstable_mockModule("@/src/input/keyboard.js", () => ({
      createKeyboardInput: jest.fn(() => mocks.keyboard),
    }))

    await jest.unstable_mockModule("@/src/core/ecs/index.js", () => ({
      createRegistry: () => mocks.registry,
      createSystemRunner: jest.fn(() => mocks.systems),
    }))

    const component = (name) => ({
      name,
      key: Symbol(name),
      create: jest.fn((initial = {}) => initial),
    })
    await jest.unstable_mockModule("@/src/game/components.js", () => ({
      AnimationSet: component("AnimationSet"),
      AnimationState: component("AnimationState"),
      Bell: component("Bell"),
      InputState: component("InputState"),
      Interactable: component("Interactable"),
      MapLayer: component("MapLayer"),
      Movement: component("Movement"),
      SpriteRef: component("SpriteRef"),
      Transform: component("Transform"),
    }))

    await jest.unstable_mockModule("@/src/game/entities/manager-entity.js", () => ({
      createManagerEntity: jest.fn(() => 100),
    }))

    await jest.unstable_mockModule("@/src/game/entities/map-entity.js", () => ({
      createMapEntity: jest.fn(() => 200),
    }))

    await jest.unstable_mockModule("@/src/game/resources/manager-resources.js", () => ({
      loadManagerResources: jest.fn(() =>
        Promise.resolve({
          sprite: { addChild: jest.fn() },
          animations: {},
        }),
      ),
      preloadManagerAssets: jest.fn(() => Promise.resolve()),
    }))

    await jest.unstable_mockModule("@/src/game/resources/map-resources.js", () => ({
      loadMapResources: jest.fn(() =>
        Promise.resolve({
          map: { layers: [], tilewidth: 32, tileheight: 32, width: 30, height: 20 },
          tileset: {},
          texture: {},
          interactables: mapInteractables,
        }),
      ),
      preloadMapAssets: jest.fn(() => Promise.resolve()),
    }))

    await jest.unstable_mockModule("@/src/game/systems/index.js", () => ({
      managerSystems: [],
    }))

    await jest.unstable_mockModule("@/src/game/interactions/index.js", () => ({
      createInteractions: () => mocks.interactions,
    }))

    const runtime = { start: jest.fn() }
    await jest.unstable_mockModule("@/src/game/runtime/create-runtime.js", () => ({
      createGameRuntime: jest.fn(() => runtime),
    }))

    const { test } = await import("@/src/draw/test.js")
    const { Interactable, Bell } = await import("@/src/game/components.js")

    await test({ keyboardTarget: {} })

    const interactableCalls = mocks.registry.addComponent.mock.calls.filter(
      ([, component]) => component === Interactable,
    )
    expect(interactableCalls).toHaveLength(1)
    expect(interactableCalls[0][2]).toMatchObject({
      tile: { x: 12, y: 5 },
      metadata: mapInteractables[0].metadata,
    })

    const bellCalls = mocks.registry.addComponent.mock.calls.filter(
      ([, component]) => component === Bell,
    )
    expect(bellCalls).toHaveLength(1)
  })
})
