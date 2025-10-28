import { describe, expect, it, jest } from "@jest/globals"
import { readFileSync } from "node:fs"
import { join } from "node:path"

class MockMatrix {
  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.tx = tx
    this.ty = ty
  }

  append(matrix) {
    const a1 = this.a
    const b1 = this.b
    const c1 = this.c
    const d1 = this.d
    const tx1 = this.tx
    const ty1 = this.ty
    const { a, b, c, d, tx, ty } = matrix

    this.a = a1 * a + b1 * c
    this.b = a1 * b + b1 * d
    this.c = c1 * a + d1 * c
    this.d = c1 * b + d1 * d
    this.tx = tx1 * a + ty1 * c + tx
    this.ty = tx1 * b + ty1 * d + ty
    return this
  }

  translate(x, y) {
    return this.append(new MockMatrix(1, 0, 0, 1, x, y))
  }
}

class MockContainer {
  constructor() {
    this.children = []
    this.label = ""
  }

  addChild(child) {
    this.children.push(child)
    return child
  }
}

class MockRectangle {
  constructor(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
}

class MockTexture {
  constructor({ source = { width: 0, height: 0 }, frame = null } = {}) {
    this.source = source
    this.frame = frame
    this.width = frame?.width ?? source.width
    this.height = frame?.height ?? source.height
  }

  static from() {
    return new MockTexture({
      source: { width: 2048, height: 6336 },
    })
  }
}

class MockSprite extends MockContainer {
  constructor(texture) {
    super()
    this.texture = texture
    this.appliedMatrix = null
  }

  setFromMatrix(matrix) {
    this.appliedMatrix = { ...matrix }
    this.position = { x: matrix.tx, y: matrix.ty }
  }
}

await jest.unstable_mockModule("pixi.js", () => ({
  Container: MockContainer,
  Matrix: MockMatrix,
  Rectangle: MockRectangle,
  Sprite: MockSprite,
  Texture: MockTexture,
}))

const { createTilemap } = await import("../../../src/draw/map/create-tilemap.js")

const loadFixtureMap = () => {
  const mapPath = join(process.cwd(), "assets", "maps", "inn.json")
  const raw = readFileSync(mapPath, "utf8")
  return JSON.parse(raw)
}

describe("createTilemap", () => {
  it("renders tile layer sprites and surfaces collision bounds", () => {
    const map = loadFixtureMap()

    const result = createTilemap({
      map,
      tileset: {
        firstgid: 1,
        columns: 64,
        image: { width: 2048, height: 6336 },
      },
      texture: MockTexture.from(),
    })

    expect(result.container.zIndex).toBe(0)
    expect(result.container.label).toBe("tilemap")

    const [tileLayer] = result.container.children
    expect(tileLayer.children.length).toBeGreaterThan(0)

    const flippedSprite = tileLayer.children[31]
    expect(flippedSprite.appliedMatrix).toMatchObject({
      a: 0,
      b: 1,
      c: -1,
      d: 0,
      tx: map.tilewidth * 2,
      ty: map.tileheight,
    })

    expect(result.collisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 64, height: 640 }),
        expect.objectContaining({ width: 896, height: 64 }),
      ]),
    )

    expect(result.dimensions).toEqual({
      tilewidth: map.tilewidth,
      tileheight: map.tileheight,
      width: map.width,
      height: map.height,
    })
  })
})
