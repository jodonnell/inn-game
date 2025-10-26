import { describe, expect, it, jest } from "@jest/globals"
import {
  AnimationSet,
  AnimationState,
  InputState,
  Movement,
  SpriteRef,
  Transform,
} from "../../../../src/game/components.js"
import { DEFAULT_DIRECTION } from "../../../../src/game/constants.js"
import { animationSystem } from "../../../../src/game/systems/animation-system.js"
import { inputSystem } from "../../../../src/game/systems/input-system.js"
import { movementSystem } from "../../../../src/game/systems/movement-system.js"
import { renderSystem } from "../../../../src/game/systems/render-system.js"

describe("inputSystem", () => {
  it("maps pressed arrow keys to movement vectors", () => {
    const pressed = new Set(["ArrowLeft", "ArrowUp"])
    const input = InputState.create({ pressed })
    const movement = Movement.create({})

    inputSystem.update({
      components: { InputState: input, Movement: movement },
    })

    expect(movement.dx).toBe(-1)
    expect(movement.dy).toBe(-1)
    expect(movement.moving).toBe(true)
  })

  it("keeps movement idle when no directional keys are pressed", () => {
    const input = InputState.create({ pressed: new Set() })
    const movement = Movement.create({ moving: true, dx: 5, dy: 5 })

    inputSystem.update({
      components: { InputState: input, Movement: movement },
    })

    expect(movement.dx).toBe(0)
    expect(movement.dy).toBe(0)
    expect(movement.moving).toBe(false)
  })
})

describe("movementSystem", () => {
  it("moves the transform using normalized deltas", () => {
    const movement = Movement.create({})
    movement.dx = 1
    movement.dy = 0
    movement.moving = true
    movement.direction = DEFAULT_DIRECTION
    const transform = Transform.create({ x: 10, y: 5 })

    movementSystem.update({
      components: { Movement: movement, Transform: transform },
      delta: 2,
    })

    expect(transform.x).toBe(10 + movement.speed * 2)
    expect(transform.y).toBe(5)
    expect(movement.direction).toBe("right")
  })

  it("prioritizes vertical direction when both axes are active", () => {
    const movement = Movement.create({})
    movement.dx = 1
    movement.dy = -1
    movement.moving = true
    const transform = Transform.create({ x: 0, y: 0 })

    movementSystem.update({
      components: { Movement: movement, Transform: transform },
      delta: 1,
    })

    expect(movement.direction).toBe("up")
  })
})

describe("animationSystem", () => {
  it("switches to walk animations when movement is active", () => {
    const textures = ["walk-1", "walk-2"]
    const sprite = {
      textures: [],
      loop: false,
      gotoAndPlay: jest.fn(),
      gotoAndStop: jest.fn(),
    }

    const components = {
      SpriteRef: SpriteRef.create({ sprite }),
      AnimationSet: AnimationSet.create({
        animations: {
          down: { walk: textures, idle: "idle" },
        },
      }),
      AnimationState: AnimationState.create({ currentKey: "" }),
      Movement: Movement.create({
        direction: "down",
        moving: true,
      }),
    }

    animationSystem.update({ components })

    expect(sprite.textures).toBe(textures)
    expect(sprite.loop).toBe(true)
    expect(sprite.gotoAndPlay).toHaveBeenCalledWith(0)
    expect(components.AnimationState.currentKey).toBe("walk-down")
  })

  it("leaves the animation untouched when no sprite is present", () => {
    const components = {
      SpriteRef: SpriteRef.create({ sprite: null }),
      AnimationSet: AnimationSet.create({ animations: {} }),
      AnimationState: AnimationState.create({ currentKey: "idle-down" }),
      Movement: Movement.create({ moving: false }),
    }

    expect(() => animationSystem.update({ components })).not.toThrow()
  })
})

describe("renderSystem", () => {
  it("syncs sprite coordinates from the transform", () => {
    const sprite = { x: 0, y: 0 }
    const components = {
      SpriteRef: SpriteRef.create({ sprite }),
      Transform: Transform.create({ x: 15, y: 9 }),
    }

    renderSystem.update({ components })

    expect(sprite.x).toBe(15)
    expect(sprite.y).toBe(9)
  })
})
