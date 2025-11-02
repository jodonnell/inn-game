import { test, expect } from "@playwright/test"
import {
  positionManager,
  readyGame,
  withBellMonitor,
  bellPlacements,
  placeManagerNextToSprite,
  waitForManagerDebugState,
  collectInteractableSnapshot,
} from "./utils/game-helpers.js"

const placeManagerBesideBell = (page, options) =>
  placeManagerNextToSprite(page, bellPlacements.left, options)

const placeManagerBelowBell = (page, options) =>
  placeManagerNextToSprite(page, bellPlacements.below, options)

const placeManagerAboveBell = (page, options) =>
  placeManagerNextToSprite(page, bellPlacements.above, options)

const placeManagerRightOfBell = (page, options) =>
  placeManagerNextToSprite(page, bellPlacements.right, options)

const waitForBellCount = async (
  page,
  expected,
  { comparator = "gte", description = `bell count ${comparator} ${expected}` } = {},
) => {
  try {
    await page.waitForFunction(
      ({ expectedCount, comparator: compare }) => {
        const count = typeof window.__bellCallCount === "number" ? window.__bellCallCount : 0
        if (compare === "eq") return count === expectedCount
        if (compare === "gt") return count > expectedCount
        if (compare === "lte") return count <= expectedCount
        if (compare === "lt") return count < expectedCount
        return count >= expectedCount
      },
      { expectedCount: expected, comparator },
      { timeout: 200 },
    )
  } catch (error) {
    const snapshot = await collectInteractableSnapshot(page, {
      interactable: { type: "bell", index: 0 },
      includeBellMonitor: true,
    })
    throw new Error(
      `${description} within 200ms not satisfied: ${JSON.stringify(snapshot)}`,
    )
  }
}

test.describe.configure({ mode: "serial" })

test.describe("Bell interaction", () => {
  test("rings the bell exactly once per press", async ({ page }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerBesideBell(page)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, { comparator: "eq", description: "bell count === 1" })
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
      await waitForBellCount(page, 1, {
        comparator: "gte",
        description: "bell count >= 1 (left-of-bell)",
      })
    })
  })

  test("rings when the manager stands at the predefined debug location", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerNextToSprite(page, bellPlacements.debug, { verifyDebug: true })

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, { comparator: "gte", description: "bell count >= 1" })
      const metadata = await page.evaluate(() => window.__bellLastMetadata)
      expect(metadata?.interaction).toBe("bell")
    })
  })

  test("rings when the manager stands at the predefined left-of-bell location", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerNextToSprite(page, bellPlacements.left, { verifyDebug: true })

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, { comparator: "gte", description: "bell count >= 1" })
      const metadata = await page.evaluate(() => window.__bellLastMetadata)
      expect(metadata?.interaction).toBe("bell")
    })
  })

  test("rings when the manager stands at the predefined right-of-bell location", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerNextToSprite(page, bellPlacements.right, { verifyDebug: true })

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, { comparator: "gte", description: "bell count >= 1" })
      const metadata = await page.evaluate(() => window.__bellLastMetadata)
      expect(metadata?.interaction).toBe("bell")
    })
  })

  test("does not ring when the manager stands above the bell facing away", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    await placeManagerNextToSprite(
      page,
      { ...bellPlacements.above, direction: "up", animationKey: "idle-up" },
      { verifyDebug: true },
    )

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await page.waitForTimeout(200)
      const result = await page.evaluate(() => ({
        count: window.__bellCallCount ?? 0,
        metadata: window.__bellLastMetadata ?? null,
      }))
      expect(result).toEqual({ count: 0, metadata: null })
    })
  })

  test("rings when the manager stands at a reachable left-of-bell spot", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    const targetPosition = {
      x: 350.8188614792593,
      y: 152.63958971361726,
      direction: "right",
      animationKey: "idle-right",
    }

    await positionManager(page, targetPosition)

    await waitForManagerDebugState(page, targetPosition)

    const proximity = await collectInteractableSnapshot(page, {
      interactable: { type: "bell", index: 0 },
    })
    const horizontalGap = Math.max(
      0,
      Math.abs(proximity.target.foot.x - proximity.actor.foot.x) -
        proximity.tileSize.width / 2,
    )
    const verticalGap = Math.max(
      0,
      Math.abs(proximity.target.foot.y - proximity.actor.foot.y) -
        proximity.tileSize.height,
    )
    expect(horizontalGap).toBeLessThanOrEqual(18)
    expect(verticalGap).toBeLessThanOrEqual(16)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, {
        comparator: "gte",
        description: "bell count >= 1 (reachable left-of-bell)",
      })
    })
  })

  test("rings when the manager stands at a reachable below-bell spot", async ({
    page,
  }) => {
    await readyGame(page, { waitForDebug: true })
    const targetPosition = {
      x: 382.62066752471446,
      y: 193.0151481293354,
      direction: "up",
      animationKey: "idle-up",
    }

    await positionManager(page, targetPosition)

    await waitForManagerDebugState(page, targetPosition)

    const proximity = await collectInteractableSnapshot(page, {
      interactable: { type: "bell", index: 0 },
    })
    const horizontalGap = Math.max(
      0,
      proximity.target.rect.left - proximity.actor.rect.right,
      proximity.actor.rect.left - proximity.target.rect.right,
    )
    const verticalGap = Math.max(
      0,
      proximity.target.rect.top - proximity.actor.rect.bottom,
      proximity.actor.rect.top - proximity.target.rect.bottom,
    )
    expect(horizontalGap).toBeLessThanOrEqual(16)
    expect(verticalGap).toBeLessThanOrEqual(16)

    await withBellMonitor(page, async () => {
      await page.keyboard.press("KeyA")
      await waitForBellCount(page, 1, {
        comparator: "gte",
        description: "bell count >= 1 (reachable below-bell)",
      })
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
        await waitForBellCount(page, 1, { comparator: "gte", description: "bell count >= 1" })
      })
    }
  })
})
