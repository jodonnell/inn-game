import { describe, expect, it, jest } from "@jest/globals"

const emptyTexture = Symbol("empty-texture")

jest.unstable_mockModule("pixi.js", () => ({
  Texture: { EMPTY: emptyTexture },
}))

const { Texture } = await import("pixi.js")
const {
  buildAnimations,
  pickInitialFrame,
  setWalkAnimation,
  setIdleAnimation,
} = await import(
  "../../../../src/game/animations/manager-animations.js"
)
const { DEFAULT_DIRECTION } = await import(
  "../../../../src/game/constants.js"
)

describe("buildAnimations", () => {
  it("collects textures per direction and applies fallbacks", () => {
    const spritesheet = {
      textures: {
        frontwalk0: "front-walk-0",
        frontwalk1: "front-walk-1",
        frontidle0: "front-idle",
        backwalk1: "back-walk-1",
        rightidle0: "right-idle",
      },
    }

    const animations = buildAnimations(spritesheet)

    expect(animations.down.walk).toEqual(["front-walk-0", "front-walk-1"])
    expect(animations.down.idle).toBe("front-idle")

    expect(animations.up.walk).toEqual(["back-walk-1"])
    expect(animations.up.idle).toBe("back-walk-1")

    expect(animations.right.walk).toEqual(["right-idle"])
    expect(animations.right.idle).toBe("right-idle")

    expect(animations.left.walk).toEqual([Texture.EMPTY])
    expect(animations.left.idle).toBe(Texture.EMPTY)
  })
})

describe("pickInitialFrame", () => {
  it("prefers the idle frame for the default direction", () => {
    const animations = {
      [DEFAULT_DIRECTION]: { idle: "idle-default", walk: ["walk-default"] },
    }

    expect(pickInitialFrame(animations)).toBe("idle-default")
  })

  it("falls back to other directions when default is missing", () => {
    const animations = {
      up: { walk: ["walk-up-0"], idle: undefined },
    }

    expect(pickInitialFrame(animations)).toBe("walk-up-0")
  })

  it("returns Texture.EMPTY when no frames exist", () => {
    expect(pickInitialFrame({})).toBe(Texture.EMPTY)
  })
})

describe("animation helpers", () => {
  it("applies walk animation variants", () => {
    const sprite = {
      textures: [],
      loop: false,
      gotoAndPlay: jest.fn(),
    }
    const variant = { walk: ["walk-0", "walk-1"] }

    setWalkAnimation(sprite, variant)

    expect(sprite.textures).toBe(variant.walk)
    expect(sprite.loop).toBe(true)
    expect(sprite.gotoAndPlay).toHaveBeenCalledWith(0)
  })

  it("applies idle variants and falls back to walk frames", () => {
    const sprite = {
      textures: [],
      loop: true,
      gotoAndStop: jest.fn(),
    }
    const variant = { walk: ["walk-0", "walk-1"], idle: undefined }

    setIdleAnimation(sprite, variant)

    expect(sprite.textures).toEqual(["walk-0"])
    expect(sprite.loop).toBe(false)
    expect(sprite.gotoAndStop).toHaveBeenCalledWith(0)
  })

  it("applies idle variants when provided", () => {
    const sprite = {
      textures: [],
      loop: true,
      gotoAndStop: jest.fn(),
    }
    const variant = { walk: ["walk-0"], idle: "idle-0" }

    setIdleAnimation(sprite, variant)

    expect(sprite.textures).toEqual(["idle-0"])
    expect(sprite.loop).toBe(false)
    expect(sprite.gotoAndStop).toHaveBeenCalledWith(0)
  })
})
