import { test, expect } from "@playwright/test"
import {
  positionManager,
  readyGame,
  withBellMonitor,
} from "./utils/game-helpers.js"

const computeFootPlacement = async (page, tileOffset) => {
  return page.evaluate(({ tileOffset }) => {
    const runtime = window.__innGame
    if (!runtime) throw new Error("Runtime not available")

    const bell = runtime.map?.interactables?.find(
      (entry) => entry?.type === "bell",
    )
    if (!bell) throw new Error("Bell interactable not found")

    const tileWidth = runtime.map?.dimensions?.tilewidth ?? 32
    const tileHeight = runtime.map?.dimensions?.tileheight ?? 32
    const offsetX = runtime.map?.container?.x ?? 0
    const offsetY = runtime.map?.container?.y ?? 0

    const targetTileX = bell.tile?.x + tileOffset.x
    const targetTileY = bell.tile?.y + tileOffset.y
    if (targetTileX == null || targetTileY == null) {
      throw new Error("Bell tile coordinates missing")
    }

    const { registry, components, entities } = runtime.ecs ?? {}
    const manager = entities?.manager
    const spriteRef = registry?.getComponent?.(manager, components.SpriteRef)
    const sprite = spriteRef?.sprite

    const width =
      sprite?.width ??
      sprite?.texture?.frame?.width ??
      sprite?.texture?.width ??
      tileWidth
    const fullHeight =
      sprite?.height ??
      sprite?.texture?.frame?.height ??
      sprite?.texture?.height ??
      tileHeight
    const footprintHeight = fullHeight > 0 ? fullHeight / 2 : 0

    const offsetFootY = fullHeight - footprintHeight
    const centerX = offsetX + targetTileX * tileWidth + tileWidth / 2
    const footY = offsetY + (targetTileY + 1) * tileHeight - 1

    return {
      x: centerX - width / 2,
      y: footY - offsetFootY - footprintHeight,
    }
  }, { tileOffset })
}

const placeManagerBesideBell = async (page) => {
  const target = await computeFootPlacement(page, { x: -1, y: 0 })
  await positionManager(page, { ...target, direction: "right" })
}

const placeManagerBelowBell = async (page) => {
  const target = await computeFootPlacement(page, { x: 0, y: 1 })
  await positionManager(page, { ...target, direction: "up" })
}

const placeManagerAboveBell = async (page) => {
  const target = await computeFootPlacement(page, { x: 0, y: -1 })
  await positionManager(page, { ...target, direction: "down" })
}

const placeManagerRightOfBell = async (page) => {
  const target = await computeFootPlacement(page, { x: 1, y: 0 })
  await positionManager(page, { ...target, direction: "left" })
}

test.describe("Bell interaction", () => {
  test("rings the bell exactly once per press", async ({ page }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerBesideBell(page)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await page.waitForFunction(() => window.__bellCallCount === 1)
      await page.waitForTimeout(100)

      const { count, metadata } = await page.evaluate(() => ({
        count: window.__bellCallCount ?? 0,
        metadata: window.__bellLastMetadata,
      }))

      expect(count).toBe(1)
      expect(metadata?.interaction).toBe("bell")
    })
  })

  test("rings when the manager stands to the left of the bell and presses A", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerBesideBell(page)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      const count = await page.evaluate(() => window.__bellCallCount ?? 0)
      expect(count).toBeGreaterThanOrEqual(1)
    })
  })

  test("rings when approaching from each adjacent side", async ({ page }) => {
    await readyGame(page, { waitForDebug: true })

    const placements = [
      placeManagerBesideBell,
      placeManagerRightOfBell,
      placeManagerAboveBell,
      placeManagerBelowBell,
    ]

    for (const place of placements) {
      await place(page)
      await withBellMonitor(page, async () => {
        await page.keyboard.press("KeyA")
        await page.waitForFunction(() => (window.__bellCallCount ?? 0) >= 1)
      })
    }
  })
})
