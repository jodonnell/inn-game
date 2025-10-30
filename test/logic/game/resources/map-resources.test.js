import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import tileSheetUrl from "@/assets/spritesheets/tile-sheet.png?url"

const createMockLoad = () => Promise.resolve()
const mockAssetsLoad = jest.fn(createMockLoad)
const textureSource = { width: 2048, height: 6336 }
const buildTexture = () => ({
  source: textureSource,
  width: textureSource.width,
  height: textureSource.height,
})
const mockTextureFrom = jest.fn(buildTexture)

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
    mockAssetsLoad.mockImplementation(createMockLoad)
    mockAssetsLoad.mockClear()
    mockTextureFrom.mockImplementation(buildTexture)
    mockTextureFrom.mockClear()
  })

  it("preloads the shared tile-sheet texture", async () => {
    await preloadMapAssets()

    expect(mockAssetsLoad).toHaveBeenCalledTimes(1)
    expect(mockAssetsLoad.mock.calls[0][0]).toBe(tileSheetUrl)
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
    expect(mockTextureFrom).toHaveBeenCalledWith(tileSheetUrl)
  })

  it("creates a defensive copy of the map payload", async () => {
    const resources = await loadMapResources()
    resources.map.layers[0].name = "mutated"

    const nextResources = await loadMapResources()

    expect(nextResources.map.layers[0].name).not.toBe("mutated")
  })
})
