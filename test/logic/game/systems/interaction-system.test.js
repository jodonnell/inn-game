import { describe, expect, it, jest } from "@jest/globals"
import {
  Bell,
  InputState,
  Interactable,
  Movement,
  Transform,
} from "../../../../src/game/components.js"

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
    const transform = Transform.create({
      x: 16 + tileDimensions.tilewidth * 2,
      y: 8 + tileDimensions.tileheight * 3,
    })

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
