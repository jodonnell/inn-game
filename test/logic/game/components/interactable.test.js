import { describe, expect, it } from "@jest/globals"

describe("Interactable component", () => {
  it("provides default tile coordinates and empty metadata", async () => {
    const { Interactable } = await import(
      "../../../../src/game/components.js"
    )

    const data = Interactable.create()

    expect(data.tile).toEqual({ x: 0, y: 0 })
    expect(data.metadata).toEqual({})
    const next = Interactable.create()
    expect(next.tile).not.toBe(data.tile)
    expect(next.metadata).not.toBe(data.metadata)
  })

  it("accepts overrides while preserving missing defaults", async () => {
    const { Interactable } = await import(
      "../../../../src/game/components.js"
    )

    const data = Interactable.create({
      tile: { x: 7, y: 4 },
      metadata: { interaction: "bell" },
    })

    expect(data.tile).toEqual({ x: 7, y: 4 })
    expect(data.metadata).toEqual({ interaction: "bell" })
    const withDefaultMetadata = Interactable.create({
      tile: { x: 2, y: 3 },
    })
    expect(withDefaultMetadata.metadata).toEqual({})
  })
})
