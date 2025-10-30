import { describe, expect, it, jest } from "@jest/globals"
import {
  Bell,
  InputState,
  Interactable,
  Movement,
  SpriteRef,
  Transform,
} from "../../../../src/game/components.js"
import { computeSpriteMetrics } from "../../../../src/game/systems/utils/sprite-metrics.js"

const loadSystem = async () => {
  const module = await import(
    "../../../../src/game/systems/interaction-system.js"
  )
  return module.interactionSystem
}

const tileDimensions = { tilewidth: 32, tileheight: 32 }

describe("interactionSystem", () => {
  it("triggers the interactable in front of the actor when KeyA is freshly pressed", async () => {
    const interactionSystem = await loadSystem()
    const managerEntity = 1
    const interactableEntity = 42
    const input = InputState.create({
      pressed: new Set(["ArrowRight"]),
      justPressed: ["KeyB", "KeyA"],
    })
    const movement = Movement.create({ direction: "right" })
    const transform = Transform.create({ x: 0, y: 0 })
    const sprite = { width: 32, height: 48 }

    const interactions = {
      findByTile: jest.fn(() => interactableEntity),
      trigger: jest.fn(),
    }

    const audio = {
      playBell: jest.fn(),
    }

    const interactable = Interactable.create({
      tile: { x: 3, y: 3 },
      metadata: { interaction: "bell" },
    })

    const registry = {
      getComponent: jest.fn((entity, component) => {
        if (entity === interactableEntity && component === Interactable) {
          return interactable
        }
        if (entity === managerEntity && component === SpriteRef) {
          return { sprite }
        }
        return undefined
      }),
      hasComponent: jest.fn(
        (entity, component) =>
          entity === interactableEntity &&
          (component === Interactable || component === Bell),
      ),
    }

    const context = {
      map: {
        dimensions: tileDimensions,
        container: { x: 16, y: 8 },
      },
      interactions,
    }

    const metrics = computeSpriteMetrics(sprite, context.map)
    const placeOnTile = ({ x, y }) => {
      const { tilewidth, tileheight } = tileDimensions
      const offsetX = context.map.container.x ?? 0
      const offsetY = context.map.container.y ?? 0
      const centerX = offsetX + x * tilewidth + tilewidth / 2
      const footY = offsetY + (y + 1) * tileheight - 1
      transform.x = centerX - (metrics.offsetX + metrics.width / 2)
      transform.y = footY - metrics.offsetY - metrics.height
    }

    placeOnTile({ x: 2, y: 3 })

    interactionSystem.update({
      entity: managerEntity,
      components: { InputState: input, Movement: movement, Transform: transform },
      registry,
      context: { ...context, audio },
    })

    expect(interactions.findByTile).toHaveBeenCalledWith({ x: 3, y: 3 })
    expect(registry.getComponent).toHaveBeenCalledWith(
      interactableEntity,
      Interactable,
    )
    expect(registry.getComponent).toHaveBeenCalledWith(managerEntity, SpriteRef)
    expect(interactions.trigger).toHaveBeenCalledWith({
      actor: managerEntity,
      target: interactableEntity,
      data: interactable,
    })
    expect(audio.playBell).toHaveBeenCalledWith(interactable.metadata)
    expect(input.justPressed).toEqual(["KeyB"])

    interactions.findByTile.mockClear()
    interactions.trigger.mockClear()

    interactionSystem.update({
      entity: managerEntity,
      components: { InputState: input, Movement: movement, Transform: transform },
      registry,
      context: { ...context, audio },
    })

    expect(interactions.findByTile).not.toHaveBeenCalled()
    expect(interactions.trigger).not.toHaveBeenCalled()
    expect(audio.playBell).toHaveBeenCalledTimes(1)
  })

  it("falls back to adjacent tiles when facing direction is stale", async () => {
    const interactionSystem = await loadSystem()
    const managerEntity = 5
    const interactableEntity = 15
    const input = InputState.create({
      pressed: new Set(),
      justPressed: ["KeyA"],
    })
    const movement = Movement.create({ direction: "down" })
    const transform = Transform.create({ x: 0, y: 0 })
    const sprite = { width: 32, height: 48 }

    const interactable = Interactable.create({
      tile: { x: 3, y: 3 },
      metadata: { interaction: "bell" },
    })

    const interactions = {
      findByTile: jest.fn((tile) =>
        tile.x === 3 && tile.y === 3 ? interactableEntity : null,
      ),
      trigger: jest.fn(),
    }

    const registry = {
      getComponent: jest.fn((entity, component) => {
        if (entity === interactableEntity && component === Interactable) {
          return interactable
        }
        if (entity === managerEntity && component === SpriteRef) {
          return { sprite }
        }
        return undefined
      }),
      hasComponent: jest.fn(() => true),
    }

    const map = {
      dimensions: tileDimensions,
      container: { x: 0, y: 0 },
    }

    const metrics = computeSpriteMetrics(sprite, map)
    const placeOnTile = ({ x, y }) => {
      const { tilewidth, tileheight } = tileDimensions
      const centerX = x * tilewidth + tilewidth / 2
      const footY = (y + 1) * tileheight - 1
      transform.x = centerX - (metrics.offsetX + metrics.width / 2)
      transform.y = footY - metrics.offsetY - metrics.height
    }

    placeOnTile({ x: 2, y: 3 })

    interactionSystem.update({
      entity: managerEntity,
      components: { InputState: input, Movement: movement, Transform: transform },
      registry,
      context: {
        map,
        interactions,
        audio: { playBell: jest.fn() },
      },
    })

    expect(interactions.findByTile).toHaveBeenCalledWith({ x: 3, y: 3 })
    expect(interactions.trigger).toHaveBeenCalledTimes(1)
  })

  it("checks the adjacent tile based on facing direction regardless of approach side", async () => {
    const interactionSystem = await loadSystem()
    const managerEntity = 7
    const interactableEntity = 77
    const sprite = { width: 32, height: 48 }
    const movement = Movement.create({ direction: "down" })
    const transform = Transform.create({ x: 0, y: 0 })
    const input = InputState.create({ pressed: new Set(), justPressed: ["KeyA"] })

    const interactable = Interactable.create({
      tile: { x: 5, y: 5 },
      metadata: { interaction: "bell" },
    })

    const interactions = {
      findByTile: jest.fn(() => interactableEntity),
      trigger: jest.fn(),
    }

    const registry = {
      getComponent: jest.fn((entity, component) => {
        if (entity === managerEntity && component === SpriteRef) {
          return { sprite }
        }
        if (entity === interactableEntity && component === Interactable) {
          return interactable
        }
        return undefined
      }),
      hasComponent: jest.fn(() => true),
    }

    const mapContext = {
      dimensions: tileDimensions,
      container: { x: 8, y: 12 },
    }
    const metrics = computeSpriteMetrics(sprite, mapContext)

    const placeOnTile = ({ x, y }) => {
      const { tilewidth, tileheight } = tileDimensions
      const offsetX = mapContext.container.x ?? 0
      const offsetY = mapContext.container.y ?? 0
      const centerX = offsetX + x * tilewidth + tilewidth / 2
      const footY = offsetY + (y + 1) * tileheight - 1
      transform.x = centerX - (metrics.offsetX + metrics.width / 2)
      transform.y = footY - metrics.offsetY - metrics.height
    }

    const cases = [
      { tile: { x: 5, y: 4 }, direction: "down" },
      { tile: { x: 5, y: 6 }, direction: "up" },
      { tile: { x: 4, y: 5 }, direction: "right" },
      { tile: { x: 6, y: 5 }, direction: "left" },
    ]

    for (const scenario of cases) {
      placeOnTile(scenario.tile)
      movement.direction = scenario.direction
      input.justPressed = ["KeyA"]
      interactions.findByTile.mockClear()
      interactions.trigger.mockClear()

      interactionSystem.update({
        entity: managerEntity,
        components: { InputState: input, Movement: movement, Transform: transform },
        registry,
        context: { map: mapContext, interactions, audio: { playBell: jest.fn() } },
      })

      expect(interactions.findByTile).toHaveBeenCalledWith({
        x: interactable.tile.x,
        y: interactable.tile.y,
      })
    }
  })

  it("ignores input when KeyA is not freshly pressed", async () => {
    const interactionSystem = await loadSystem()
    const input = InputState.create({
      pressed: new Set(["ArrowDown"]),
      justPressed: ["KeyB"],
    })
    const movement = Movement.create({ direction: "down" })
    const transform = Transform.create({ x: 64, y: 96 })

    const interactions = {
      findByTile: jest.fn(),
      trigger: jest.fn(),
    }

    const registry = {
      getComponent: jest.fn(),
      hasComponent: jest.fn(),
    }

    const context = {
      map: { dimensions: tileDimensions, container: { x: 0, y: 0 } },
      interactions,
    }

    interactionSystem.update({
      entity: 7,
      components: { InputState: input, Movement: movement, Transform: transform },
      registry,
      context,
    })

    expect(interactions.findByTile).not.toHaveBeenCalled()
    expect(interactions.trigger).not.toHaveBeenCalled()
    expect(input.justPressed).toEqual(["KeyB"])
  })
})
