import { describe, expect, it, jest } from "@jest/globals"

const createMocks = () => {
  const registry = {
    query: jest.fn(() => []),
    getComponent: jest.fn(() => ({})),
  }

  const systems = {
    run: jest.fn(),
  }

  const ticker = {
    add: jest.fn(),
    remove: jest.fn(),
  }

  const app = {
    ticker,
  }

  const computeDebug = jest.fn(() => ({ sample: true }))
  const resetEntityState = jest.fn()

  const scene = {
    dispose: jest.fn(),
    world: { children: [] },
    metrics: {},
  }

  const components = {
    SpriteRef: { key: Symbol("SpriteRef"), name: "SpriteRef" },
  }

  const entities = {
    manager: 1,
    map: 2,
  }

  return {
    registry,
    systems,
    ticker,
    app,
    computeDebug,
    resetEntityState,
    scene,
    components,
    entities,
  }
}

describe("createGameRuntime", () => {
  it("surfaces map metadata on the snapshot", async () => {
    const mocks = createMocks()
    const { createGameRuntime } = await import(
      "../../../../src/game/runtime/create-runtime.js"
    )

    const map = {
      container: { label: "map" },
      collisions: [{ id: 1 }],
      layers: [{ name: "ground" }],
      dimensions: { tilewidth: 32, tileheight: 32, width: 30, height: 20 },
      entity: 2,
    }

    const runtime = createGameRuntime({
      app: mocks.app,
      scene: mocks.scene,
      registry: mocks.registry,
      systems: mocks.systems,
      components: mocks.components,
      entities: mocks.entities,
      keyboard: {},
      map,
      computeDebug: mocks.computeDebug,
      resetEntityState: mocks.resetEntityState,
      debugSink: jest.fn(),
    })

    runtime.start()
    const startCallback = mocks.ticker.add.mock.calls.at(-1)[0]
    startCallback({ deltaTime: 16 })

    const snapshot = runtime.snapshot()
    expect(snapshot.map).toBe(map)
    expect(snapshot.map).toMatchObject({
      collisions: [{ id: 1 }],
      dimensions: expect.objectContaining({ tilewidth: 32 }),
    })
  })

  it("passes map context into system runner", async () => {
    const mocks = createMocks()
    const { createGameRuntime } = await import(
      "../../../../src/game/runtime/create-runtime.js"
    )

    const map = { id: "map-context" }

    const runtime = createGameRuntime({
      app: mocks.app,
      scene: mocks.scene,
      registry: mocks.registry,
      systems: mocks.systems,
      components: {},
      entities: mocks.entities,
      keyboard: {},
      map,
      computeDebug: mocks.computeDebug,
      resetEntityState: mocks.resetEntityState,
      debugSink: jest.fn(),
    })

    runtime.start()
    const updateCallback = mocks.ticker.add.mock.calls.at(-1)[0]
    updateCallback({ deltaTime: 16 })

    expect(mocks.systems.run).toHaveBeenCalledWith(16, { map })
  })

  it("flushes keyboard one-shot intents after each system tick", async () => {
    const mocks = createMocks()
    const flush = jest.fn()
    const keyboard = { flush }
    const { createGameRuntime } = await import(
      "../../../../src/game/runtime/create-runtime.js"
    )

    const runtime = createGameRuntime({
      app: mocks.app,
      scene: mocks.scene,
      registry: mocks.registry,
      systems: mocks.systems,
      components: {},
      entities: mocks.entities,
      keyboard,
      map: null,
      computeDebug: mocks.computeDebug,
      resetEntityState: mocks.resetEntityState,
      debugSink: jest.fn(),
    })

    runtime.start()
    const updateCallback = mocks.ticker.add.mock.calls.at(-1)[0]

    updateCallback({ deltaTime: 10 })
    updateCallback({ deltaTime: 5 })

    expect(flush).toHaveBeenCalledTimes(2)
    expect(mocks.systems.run).toHaveBeenCalledTimes(2)
    const firstRunOrder = mocks.systems.run.mock.invocationCallOrder?.[0] ?? 0
    const firstFlushOrder = flush.mock.invocationCallOrder?.[0] ?? 0
    expect(firstFlushOrder).toBeGreaterThan(firstRunOrder)
  })
})
