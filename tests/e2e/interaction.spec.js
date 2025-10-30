import { test, expect } from "@playwright/test"
import {
  positionManager,
  readyGame,
  withBellMonitor,
} from "./utils/game-helpers.js"

const placeManagerBesideBell = async (page) => {
  await page.evaluate(() => {
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

    const targetTileX = bell.tile?.x - 1
    const targetTileY = bell.tile?.y

    if (targetTileX == null || targetTileY == null) {
      throw new Error("Bell tile coordinates missing")
    }

    window.__targetPosition = {
      x: offsetX + targetTileX * tileWidth,
      y: offsetY + targetTileY * tileHeight,
    }
  })

  const target = await page.evaluate(() => window.__targetPosition)
  if (!target) throw new Error("Unable to compute bell-adjacent position")

  await positionManager(page, { ...target, direction: "right" })
  await page.evaluate(() => {
    delete window.__targetPosition
  })
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
})
