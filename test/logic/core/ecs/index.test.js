import { describe, expect, it, jest } from "@jest/globals"
import {
  createRegistry,
  createSystemRunner,
  defineComponent,
} from "../../../../src/core/ecs/index.js"

const Position = defineComponent("Position", () => ({ x: 0, y: 0 }))
const Velocity = defineComponent("Velocity", () => ({ dx: 0, dy: 0 }))
const Flag = defineComponent("Flag", { value: false })
const Label = defineComponent("Label", { text: "default" })

describe("createRegistry", () => {
  it("stores and retrieves component data per entity", () => {
    const registry = createRegistry()
    const entity = registry.createEntity()

    registry.addComponent(entity, Position, { x: 12, y: 4 })
    registry.addComponent(entity, Velocity, { dx: 1 })

    expect(registry.getComponent(entity, Position)).toEqual({ x: 12, y: 4 })
    expect(registry.getComponent(entity, Velocity)).toEqual({ dx: 1, dy: 0 })
  })

  it("drops components and excludes entities from queries", () => {
    const registry = createRegistry()
    const include = registry.createEntity()
    const exclude = registry.createEntity()

    registry.addComponent(include, Position)
    registry.addComponent(include, Velocity)
    registry.addComponent(exclude, Position)

    expect(registry.query(Position, Velocity)).toEqual([include])

    registry.removeComponent(include, Velocity)
    expect(registry.query(Position, Velocity)).toEqual([])
  })

  it("tracks component membership through hasComponent", () => {
    const registry = createRegistry()
    const entity = registry.createEntity()

    registry.addComponent(entity, Position)
    expect(registry.hasComponent(entity, Position)).toBe(true)
    expect(registry.hasComponent(entity, Velocity)).toBe(false)

    registry.removeComponent(entity, Position)
    expect(registry.hasComponent(entity, Position)).toBe(false)
  })

  it("creates components from object defaults without sharing instances", () => {
    const registry = createRegistry()
    const first = registry.createEntity()
    const second = registry.createEntity()

    const firstLabel = registry.addComponent(first, Label)
    const secondLabel = registry.addComponent(second, Label, { text: "custom" })

    expect(firstLabel).toEqual({ text: "default" })
    expect(secondLabel).toEqual({ text: "custom" })

    secondLabel.text = "mutated"
    expect(firstLabel.text).toBe("default")
  })
})

describe("createSystemRunner", () => {
  it("invokes systems with component maps and delta", () => {
    const registry = createRegistry()
    const systems = createSystemRunner(registry)
    const entity = registry.createEntity()

    registry.addComponent(entity, Position, { x: 10 })
    registry.addComponent(entity, Velocity, { dx: 2 })

    const updates = []
    systems.addSystem({
      name: "movement",
      components: [Position, Velocity],
      update: ({ components, delta, entity: current }) => {
        updates.push({
          entity: current,
          x: components.Position.x,
          dx: components.Velocity.dx,
          delta,
        })
      },
    })

    systems.run(3)
    expect(updates).toEqual([{ entity, x: 10, dx: 2, delta: 3 }])
  })

  it("skips systems without matching entities", () => {
    const registry = createRegistry()
    const systems = createSystemRunner(registry)
    const entity = registry.createEntity()

    registry.addComponent(entity, Position)

    const updateSpy = jest.fn()
    systems.addSystem({
      name: "flag",
      components: [Flag],
      update: updateSpy,
    })

    systems.run(1)
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it("removes systems when the disposer is invoked", () => {
    const registry = createRegistry()
    const systems = createSystemRunner(registry)
    const entity = registry.createEntity()

    registry.addComponent(entity, Position)

    const updateSpy = jest.fn()
    const dispose = systems.addSystem({
      name: "position-reader",
      components: [Position],
      update: updateSpy,
    })

    dispose()
    systems.run(1)
    expect(updateSpy).not.toHaveBeenCalled()
  })
})
