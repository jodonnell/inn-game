import { beforeEach, describe, expect, it, jest } from "@jest/globals"

const mockAssetsLoad = jest.fn(() => Promise.resolve())
const textureSource = { width: 2048, height: 6336 }
const mockTextureFrom = jest.fn(() => ({
  source: textureSource,
  width: textureSource.width,
  height: textureSource.height,
}))

await jest.unstable_mockModule("pixi.js", () => ({
  Assets: {
    load: mockAssetsLoad,
  },
  Texture: {
    from: mockTextureFrom,
  },
}))

const {
  preloadMapAssets,
  loadMapResources,
} = await import("../../../../src/game/resources/map-resources.js")

describe("map-resources", () => {
  beforeEach(() => {
    mockAssetsLoad.mockClear()
    mockTextureFrom.mockClear()
  })

  it("preloads the shared tile-sheet texture", async () => {
    await preloadMapAssets()

    expect(mockAssetsLoad).toHaveBeenCalledTimes(1)
    expect(mockAssetsLoad.mock.calls[0][0]).toContain("tile-sheet.png")
  })

  it("supplies map metadata with parsed tileset attributes", async () => {
    const resources = await loadMapResources()

    expect(resources.map).toBeDefined()
    expect(resources.tileset).toMatchObject({
      tilewidth: 32,
      tileheight: 32,
      columns: 64,
      firstgid: 1,
    })
    expect(mockTextureFrom).toHaveBeenCalledWith(expect.stringContaining("tile-sheet.png"))
  })

  it("creates a defensive copy of the map payload", async () => {
    const resources = await loadMapResources()
    resources.map.layers[0].name = "mutated"

    const nextResources = await loadMapResources()

    expect(nextResources.map.layers[0].name).not.toBe("mutated")
  })
})
